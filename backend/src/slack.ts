import axios from 'axios';
import prisma from './prisma';

export const sendSlackRateLimitNotification = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Fall back to env-level webhook URL if user hasn't set their own
    const webhookUrl = user?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('No Slack webhook URL configured. Skipping notification.');
      return;
    }

    const payload = {
      text: `⚠️ *Rate Limit Reached* ⚠️\nYour account has reached the maximum emails per hour limit. Further emails have been rescheduled to the next available hour window.`
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Slack notification sent to user ${userId}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
};
