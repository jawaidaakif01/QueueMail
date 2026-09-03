import 'dotenv/config';
import { Router } from 'express';
import prisma from './prisma';
import { emailQueue } from './queue';
import { indexEmail } from './elasticsearch';
import { esClient } from './elasticsearch';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = Router();

// OAuth Configuration
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/google/callback'
);

// ==============================
// AUTHENTICATION ROUTES
// ==============================

router.get('/auth/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    
    // Get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload");
    
    const { sub: googleId, email, name } = payload;
    
    let user = await prisma.user.findUnique({ where: { email: email! } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: email!, name, googleId }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email: email! },
        data: { googleId }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '7d' });
    res.redirect(`http://localhost:3000/?token=${token}`);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.redirect('http://localhost:3000/login?error=auth_failed');
  }
});

router.get('/auth/slack', (req, res) => {
  const userId = req.query.userId;
  const slackClientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = 'http://localhost:5000/api/auth/slack/callback';
  const url = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=incoming-webhook&redirect_uri=${redirectUri}&state=${userId}`;
  res.redirect(url);
});

router.get('/auth/slack/callback', async (req, res) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;
  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:5000/api/auth/slack/callback'
      }
    });

    if (response.data.ok) {
      const webhookUrl = response.data.incoming_webhook.url;
      await prisma.user.update({
        where: { id: userId },
        data: { slackWebhookUrl: webhookUrl }
      });
      res.redirect('http://localhost:3000/?slack_connected=true');
    } else {
      throw new Error(response.data.error);
    }
  } catch (error) {
    console.error('Slack Auth Error:', error);
    res.redirect('http://localhost:3000/?error=slack_auth_failed');
  }
});

// Direct webhook URL save (alternative to OAuth for local dev)
router.post('/slack/webhook', async (req, res) => {
  const { userId, webhookUrl } = req.body;
  try {
    if (!userId || !webhookUrl) {
      return res.status(400).json({ error: 'userId and webhookUrl are required' });
    }
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({ error: 'Invalid Slack webhook URL' });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { slackWebhookUrl: webhookUrl }
    });
    res.json({ message: 'Slack webhook connected successfully' });
  } catch (error) {
    console.error('Slack webhook save error:', error);
    res.status(500).json({ error: 'Failed to save webhook URL' });
  }
});

// ==============================
// SCHEDULER ROUTES
// ==============================

router.post('/schedule', async (req, res) => {
  try {
    const { jobs } = req.body;
    
    // Auth Middleware would normally extract userId, but for demo we pass it or fallback to test user
    const userId = req.headers['x-user-id'] as string;
    
    let user;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
      if (!user) {
        user = await prisma.user.create({
          data: { email: 'test@example.com', name: 'Test User' }
        });
      }
    }

    // 2. Insert into PostgreSQL
    const createdJobs = await Promise.all(
      jobs.map((job: any) => 
        prisma.emailJob.create({
          data: {
            userId: user!.id,
            subject: job.subject,
            body: job.body,
            toEmail: job.toEmail,
            scheduledTime: new Date(job.scheduleTime),
            status: 'SCHEDULED'
          }
        })
      )
    );

    // 3. Add to BullMQ
    for (const [index, job] of jobs.entries()) {
      const dbJob = createdJobs[index];
      const scheduledTime = new Date(job.scheduleTime).getTime();
      const now = Date.now();
      let delay = Math.max(0, scheduledTime - now);
      
      if (job.delaySeconds) {
        delay += (job.delaySeconds * 1000 * index);
      }

      await emailQueue.add(
        'send-email',
        {
          emailJobId: dbJob.id,
          toEmail: job.toEmail,
          subject: job.subject,
          body: job.body,
          userId: user.id
        },
        { 
          delay,
          jobId: dbJob.id 
        }
      );

      // Index to Elasticsearch
      await indexEmail({
        id: dbJob.id,
        subject: job.subject,
        body: job.body,
        toEmail: job.toEmail,
        status: 'SCHEDULED'
      });
    }

    res.json({ message: 'Jobs scheduled successfully', count: jobs.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to schedule jobs' });
  }
});

router.get('/scheduled', async (req, res) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      where: { status: 'SCHEDULED' },
      orderBy: { scheduledTime: 'asc' }
    });
    res.json({ data: jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled jobs' });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      where: { status: { in: ['SENT', 'FAILED'] } },
      orderBy: { sentTime: 'desc' }
    });
    res.json({ data: jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent jobs' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ data: [] });
    }

    const response = await esClient.search({
      index: 'emails',
      body: {
        query: {
          multi_match: {
            query: q as string,
            fields: ['subject', 'body', 'toEmail']
          }
        }
      }
    });

    const hits = (response.hits.hits as any[]).map((h: any) => h._source);
    res.json({ data: hits });
  } catch (error) {
    console.error('Search failed', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
