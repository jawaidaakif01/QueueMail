# ReachInbox Full-stack Email Job Scheduler

This is a production-grade email scheduler service and dashboard built for the (Outbox Labs) ReachInbox Hiring Assignment.

## Features Implemented

### Backend
- **Scheduler**: Accepts email jobs via API and schedules them at specific times using BullMQ.
- **Persistence**: BullMQ is backed by Redis, and jobs are persisted in a PostgreSQL database using Prisma ORM. On server restart, jobs resume and are not lost.
- **Rate Limiting**: Custom rate limiting implemented via Redis counters. Ensures that global/per-user hourly limits are respected. Jobs exceeding the limit are delayed to the next hour window rather than dropped.
- **Concurrency**: BullMQ workers are configured to handle parallel jobs safely. A minimum delay between sends is enforced using BullMQ's built-in `limiter` options.
- **Slack Notification**: When a rate limit is hit, a Slack notification is triggered to the user's webhook.
- **Elasticsearch**: Scheduled and sent emails are indexed in Elasticsearch, allowing for fast searches through campaigns.

### Frontend
- **Dashboard**: A clean Next.js app built with Tailwind CSS.
- **Compose Email Modal**: Allows setting Subject, Body, uploading a CSV of leads, and configuring start time, delay, and hourly limits.
- **Tables**: Displays live data of "Scheduled" and "Sent/Failed" emails fetched from the backend.

## Architecture Overview

- **Database (PostgreSQL)**: Acts as the source of truth for Users and Email Jobs.
- **Queue (Redis + BullMQ)**: Handles job scheduling and delaying. Chosen for its robust persistence and concurrency handling.
- **Search (Elasticsearch)**: Synchronizes with the database to provide fast querying on email subjects and content.
- **Backend (Express + TypeScript)**: Exposes APIs for scheduling, fetching stats, and searching. Handles rate-limit state in Redis.
- **Frontend (Next.js)**: Uses React Query for data fetching, rendering the state of the queues.

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose

### Infrastructure Setup
1. Clone the repository and navigate to the root directory.
2. Run `docker-compose up -d` to start PostgreSQL, Redis, and Elasticsearch.

### Backend Setup
1. Navigate to the `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. The `.env` file should be configured automatically with default Docker ports. Ensure you add your Ethereal SMTP credentials in `.env` if you wish to see actual emails delivered.
4. Run migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`
*(The API runs on `http://localhost:5000` and the BullMQ dashboard is available at `http://localhost:5000/admin/queues`)*

### Frontend Setup
1. Navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Next.js app: `npm run dev`
*(The frontend runs on `http://localhost:3000`)*

## Trade-offs & Assumptions
- **Mocked OAuth**: To save time on setup and credential sharing, Google OAuth and Slack OAuth have been simplified to mock middleware/webhooks for demonstration purposes. In a real environment, passport.js or NextAuth would handle the handshake.
- **CSV Parsing**: Handled entirely on the frontend via PapaParse for a smoother UX and lower backend memory overhead.
- **Search Synchronization**: The integration indexes emails synchronously when scheduling them. In a high-throughput scenario, it would be better to stream changes to Elasticsearch via a CDC tool like Debezium or logstash.
