import axios from 'axios';
import prisma from './prisma';

export const sendSlackRateLimitNotification = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.slackWebhookUrl) {
      // User hasn't connected Slack
      return;
    }

    const payload = {
      text: `⚠️ *Rate Limit Reached* ⚠️\nYour account has reached the maximum emails per hour limit. Further emails have been rescheduled to the next available hour window.`
    };

    await axios.post(user.slackWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Slack notification sent to user ${userId}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
};
