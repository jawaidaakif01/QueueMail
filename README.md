# 📬 MailFlow — Distributed Email Scheduler & Dashboard

A production-grade, full-stack email campaign scheduling platform built with **Node.js**, **BullMQ**, **Redis**, **PostgreSQL**, and **Next.js**. Schedule bulk campaigns, enforce smart rate limiting, monitor live queue execution, and get instant Slack alerts — all in one sleek dashboard.

![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20TypeScript-green?style=flat-square)
![Queue](https://img.shields.io/badge/Queue-BullMQ%20%7C%20Redis-red?style=flat-square)
![DB](https://img.shields.io/badge/DB-PostgreSQL%20%7C%20Prisma-blue?style=flat-square)
![Search](https://img.shields.io/badge/Search-Elasticsearch-yellow?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%7C%20Tailwind-black?style=flat-square)

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
  - [How Scheduling Works](#how-scheduling-works)
  - [Persistence on Server Restarts](#persistence-on-server-restarts)
  - [Throughput, Rate Limiting & Concurrency](#throughput-rate-limiting--concurrency)
  - [Elasticsearch Search Indexing](#elasticsearch-search-indexing)
  - [Slack Rate-Limit Notifications](#slack-rate-limit-notifications)
- [Features Implemented](#-features-implemented)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Start Infrastructure (Docker)](#1-start-infrastructure-docker)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Step-by-Step Evaluator Test Guide](#-step-by-step-evaluator-test-guide)
- [Trade-offs & Assumptions](#-trade-offs--assumptions)

---

## 🏗 Architecture Overview

### How Scheduling Works
- Email scheduling requests are received via `POST /api/schedule`.
- Jobs are persisted in **PostgreSQL** with status `SCHEDULED` and simultaneously dispatched into **BullMQ** as delayed jobs (`emailQueue.add('send-email', data, { delay })`).
- **No cron jobs** are used. Redis handles timer triggers natively and accurately down to the millisecond.
- Workers dequeue jobs concurrently, execute the rate-limit checks, and dispatch real SMTP emails via **Ethereal Email**.

### Persistence on Server Restarts
- **Crash/Restart Resilient**: BullMQ persists all queue states and delayed timestamps in Redis. PostgreSQL maintains the persistent relational records.
- If the backend or worker restarts midway:
  - Jobs scheduled for the future remain safely in Redis delayed state and fire at the exact target time.
  - Completed jobs are updated in PostgreSQL with status `SENT` and sent timestamps, preventing duplicate sends (guaranteeing idempotency).

### Throughput, Rate Limiting & Concurrency
- **Worker Concurrency**: BullMQ worker is configured with configurable concurrency (e.g. 5 concurrent workers) to safely process multiple parallel jobs without race conditions.
- **Minimum Delay (Throttling)**: A minimum delay between individual email sends (configured via `MIN_DELAY_BETWEEN_EMAILS_MS`) is strictly enforced using BullMQ's native worker limiter to simulate provider throttling.
- **Per-Sender / Hourly Rate Limiting**: 
  - Enforced using an atomic Redis counter keyed by `rate_limit:${userId}:${hourWindow}`.
  - When the hourly threshold (`MAX_EMAILS_PER_HOUR`) is reached, jobs are **not dropped or failed**. Instead, the worker calculates the exact millisecond delta until the start of the next hour and moves the job to delayed state (`job.moveToDelayed(nextHourTimestamp)`), preserving execution order.

### Elasticsearch Search Indexing
- Every scheduled or sent email job is automatically indexed into an **Elasticsearch** index (`emails`).
- The dashboard search bar executes real-time multi-match queries (`subject`, `body`, `toEmail`) across Elasticsearch, offering sub-millisecond search capability over high-volume email datasets.

### Slack Rate-Limit Notifications
- Supports connecting Slack via **Incoming Webhook** or **OAuth 2.0**.
- The moment a sender hits their configured hourly limit, the backend automatically triggers an instant Slack notification to the configured channel (e.g., `#all-outbox-labs`) informing the user that their limit was reached and subsequent emails are scheduled for the next hour window.

---

## ✨ Features Implemented

| Area | Feature | Description |
|---|---|---|
| **Backend** | BullMQ + Redis Scheduler | Production-grade persistent delayed job scheduling without cron. |
| **Backend** | PostgreSQL + Prisma ORM | Relational state persistence for Users and Email Jobs. |
| **Backend** | Rate Limiting Engine | Redis atomic hourly counters with next-hour rescheduling. |
| **Backend** | BullMQ Live Dashboard | Real-time queue visualizer accessible at `http://localhost:5000/admin/queues`. |
| **Backend** | Elasticsearch Integration | Full-text search engine for instant email querying. |
| **Backend** | Ethereal SMTP | Real email dispatching with virtual mailboxes. |
| **Backend** | Google OAuth 2.0 | Real Google OAuth authentication flow with JWT sessions. |
| **Backend** | Slack Webhook Alerts | Live Slack channel notifications on rate limit hits. |
| **Frontend** | Pixel-Perfect UI | Next.js + Tailwind CSS matching the Figma design specifications. |
| **Frontend** | CSV Lead Uploader | Client-side CSV parser with lead count detection (`sample_leads.csv` included). |
| **Frontend** | Scheduled & Sent Tables | Real-time views of queued and completed campaigns with auto-refresh. |
| **Frontend** | Fast Search Bar | Elasticsearch-backed instant filtering by query. |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### 1. Start Infrastructure (Docker)
In the project root folder:
```bash
docker-compose up -d
```
*This will launch PostgreSQL (port 5432), Redis (port 6379), and Elasticsearch (port 9200).*

---

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
- Backend API runs at: **`http://localhost:5000`**
- BullMQ Live Dashboard: **`http://localhost:5000/admin/queues`**

---

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- Frontend Dashboard runs at: **`http://localhost:3000`**

---

## 🧪 Testing the Features

### 1. Login with Google
1. Open `http://localhost:3000/login`.
2. Click **"Login with Google"** (or use the test login).
3. You will be authenticated and redirected to the main dashboard with your profile loaded.

### 2. Connect Slack
1. Click the **"Connect Slack"** button in the sidebar.
2. An in-app modal opens explaining how to generate an Incoming Webhook from [api.slack.com/apps](https://api.slack.com/apps).
3. Paste your Webhook URL and click **Connect**.

### 3. Schedule Emails (Single or CSV)
1. Click **"Compose"** in the sidebar.
2. **Option A (CSV Upload)**: Click **Choose File** and select the provided `sample_leads.csv` located in the project root.
3. **Option B (Manual)**: In the **To** input, enter comma-separated emails:
   `test1@example.com, test2@example.com, test3@example.com`
4. Enter Subject and Body, choose optional delays, and click **Send**.
5. Check the **Scheduled** tab to see your jobs queued.

### 4. Monitor Live Queue Execution
1. Open **`http://localhost:5000/admin/queues`** in your browser.
2. View real-time active, delayed, and completed jobs moving through the BullMQ pipeline.

### 5. Verify Rate Limiting & Slack Notification
1. Set `MAX_EMAILS_PER_HOUR=2` in `backend/.env` and restart the backend.
2. Schedule 3 or more emails at once.
3. The 3rd email will trigger the rate limit:
   - Check your Slack channel to see the live **Rate Limit Reached** alert.
   - Check `/admin/queues` to observe the job gracefully shifted to `delayed` until the next hour window.

### 6. Verify Server Restart Persistence
1. Schedule an email 2 minutes into the future (using Send Later or a delay).
2. Stop the backend server (`Ctrl+C`).
3. Start the backend again (`npm run dev`).
4. Notice that when the scheduled time arrives, the email is automatically processed and sent without duplication.

### 7. Verify Elasticsearch Full-Text Search
1. In the dashboard top search bar, type keywords from your email subjects or bodies (e.g. `Test`).
2. Results are dynamically queried and filtered via Elasticsearch.

---

## ⚖ Trade-offs & Assumptions
1. **Frontend CSV Parsing**: CSV parsing is handled client-side using `PapaParse` to provide instantaneous feedback on total valid email rows detected before dispatching payloads.
2. **Synchronous Elasticsearch Indexing**: Email metadata is indexed directly upon creation. In an ultra-high-throughput enterprise environment (millions of emails/sec), an asynchronous event streaming pipeline (e.g. Kafka or Debezium CDC) would be preferred.
3. **Idempotency**: Handled by tracking unique database job IDs and checking job state before dispatch.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
