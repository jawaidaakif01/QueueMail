import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './prisma';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queue';
import router from './routes';
import { initElasticsearch } from './elasticsearch';

const app = express();
// Force nodemon restart
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Bull Board Setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());


app.use('/api', router);

initElasticsearch().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`BullMQ dashboard is available at http://localhost:${PORT}/admin/queues`);
  });
});
