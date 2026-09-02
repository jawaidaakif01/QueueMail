import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const INDEX_NAME = 'emails';

export const initElasticsearch = async () => {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              subject: { type: 'text' },
              body: { type: 'text' },
              toEmail: { type: 'keyword' },
              status: { type: 'keyword' },
              scheduledTime: { type: 'date' },
              sentTime: { type: 'date' },
            },
          },
        },
      });
      console.log(`Elasticsearch index '${INDEX_NAME}' created.`);
    } else {
      console.log(`Elasticsearch index '${INDEX_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
  }
};

export const indexEmail = async (emailJob: any) => {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailJob.id,
      document: {
        id: emailJob.id,
        userId: emailJob.userId,
        subject: emailJob.subject,
        body: emailJob.body,
        toEmail: emailJob.toEmail,
        status: emailJob.status,
        scheduledTime: emailJob.scheduledTime,
        sentTime: emailJob.sentTime,
      },
    });
  } catch (error) {
    console.error('Error indexing email:', error);
  }
};
