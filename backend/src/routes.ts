import 'dotenv/config';
import { Router } from 'express';
import prisma from './prisma';
import { emailQueue } from './queue';
import { indexEmail } from './elasticsearch';
import { esClient } from './elasticsearch';

const router = Router();

router.post('/schedule', async (req, res) => {
  try {
    const { jobs } = req.body;
    
    // 1. Create dummy user if not exists (for assignment purposes)
    let user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test@example.com', name: 'Test User' }
      });
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

    const { body } = await esClient.search({
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

    const hits = body.hits.hits.map((h: any) => h._source);
    res.json({ data: hits });
  } catch (error) {
    console.error('Search failed', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
