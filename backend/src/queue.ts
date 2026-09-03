import 'dotenv/config';
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import prisma from './prisma';
import { sendSlackRateLimitNotification } from './slack';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { connection });
export const emailQueueEvents = new QueueEvents('email-queue', { connection });

// Configure Nodemailer with Ethereal SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configure the Worker
const worker = new Worker(
  'email-queue',
  async (job) => {
    const { emailJobId, toEmail, subject, body, userId } = job.data;
    const maxPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR || '200');
    
    // Hourly Rate Limiting via Redis Counter (Per Sender)
    const hourWindow = new Date().toISOString().slice(0, 13); // e.g. "2026-09-02T13"
    const redisKey = `rate_limit:${userId}:${hourWindow}`;
    
    const count = await connection.incr(redisKey);
    if (count === 1) {
      await connection.expire(redisKey, 3600); // Expire in 1 hour
    }

    if (count > maxPerHour) {
      console.log(`Rate limit reached for ${userId}. Rescheduling job ${job.id}`);
      

      // Calculate delay until the start of the next hour
      const now = new Date();
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      const delay = nextHour.getTime() - now.getTime();
      
      // Move to delayed and preserve order
      await job.moveToDelayed(Date.now() + delay, job.token as string);
      
      // Trigger Slack Notification logic here
      await sendSlackRateLimitNotification(userId);

      return; // Stop processing this job for now
    }

    // Minimum delay between individual sends is handled by BullMQ worker limiter

    // Attempt to send email
    try {
      const info = await transporter.sendMail({
        from: '"ReachInbox Scheduler" <scheduler@reachinbox.ai>',
        to: toEmail,
        subject: subject,
        text: body,
      });

      console.log(`Message sent: ${info.messageId}`);
      
      // Update DB
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SENT', sentTime: new Date() }
      });
      
    } catch (error: any) {
      console.error(`Failed to send email to ${toEmail}:`, error);
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'FAILED', error: error.message }
      });
      throw error;
    }
  },
  { 
    connection,
    concurrency: 5, // configurable concurrency
    limiter: {
      max: 1,
      duration: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || '2000'), // Minimum delay between individual sends
    }
  }
);

worker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
