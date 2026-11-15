# DevScrolls Blog Automation: Production Deployment Guide

This guide walks you through deploying the **DevScrolls Blog Automation Backend** to Render's Free Tier and linking it with your Telegram bot (`@DevScrollsBot`).

---

## 1. Zero-Cost Production Stack Overview

| Component | Provider & Tier | Cost | Role |
| :--- | :--- | :--- | :--- |
| **Backend Service** | Render (Free Web Service) | \$0.00 | FastAPI backend running 4-agent state machine |
| **Database & Queue** | Supabase (Free Tier) | \$0.00 | PostgreSQL ledger, atomic job queue, RLS |
| **Primary AI Reasoning** | Google Gemini (`gemini-3.8-flash`) | \$0.00 | Agent 1, 2, 3, 4 analysis, fact-checking, drafting |
| **Audio Transcription** | Google Gemini (`gemini-3.5-flash-lite`) | \$0.00 | Multimodal voice-to-text transcription |
| **Technical Web Research** | Tavily Search API (Free Tier) | \$0.00 | Authoritative documentation research (1,000 req/mo) |
| **Human Interface** | Telegram Bot API | \$0.00 | Voice notes intake, confirmation gates, review card |
| **Publishing Pipeline** | GitHub REST API + GitHub Pages | \$0.00 | Commits to `src/content/articles/<slug>.md` & builds site |

---

## 2. Deploying to Render (Free Web Service)

### Step 1: Connect GitHub Repository
1. Log into [Render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select your repository: `santhanakrishnanstark/myblog`.
4. Configure the service settings:
   - **Name**: `devscrolls-blog-automation`
   - **Region**: `Singapore` (or nearest region)
   - **Branch**: `main`
   - **Root Directory**: `blog-automation-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

### Step 2: Configure Environment Variables
In the **Environment** tab on Render, add the following variables:

```bash
# App Configuration
APP_ENV=production
LOG_LEVEL=INFO
BASE_BLOG_URL=https://devscrolls.dev
INTERNAL_API_SECRET=<YOUR_CHOSEN_INTERNAL_SECRET>

# Pluggable AI Configuration (Gemini Free Tier)
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TRANSCRIPTION_MODEL=gemini-3.5-flash-lite

# Telegram Bot
TELEGRAM_BOT_TOKEN=9066790475:AAGcppeA_WF0-Ak1lZ3a7WtoPXiVHbXGsqc
TELEGRAM_WEBHOOK_SECRET=<RANDOM_STRING_FOR_WEBHOOK_HEADER>
AUTHORIZED_TELEGRAM_USER_IDS=5435882029

# Supabase (PostgreSQL Ledger)
SUPABASE_URL=https://rznvcmvidgyrppvkjptm.supabase.co
SUPABASE_SERVICE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# Web Research (Tavily)
TAVILY_API_KEY=<YOUR_TAVILY_API_KEY>

# GitHub REST API Publishing
GITHUB_TOKEN=<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
GITHUB_REPO_OWNER=santhanakrishnanstark
GITHUB_REPO_NAME=myblog
GITHUB_BRANCH=main
```

Click **Create Web Service**. Render will build and deploy the container. Once live, note your public Render URL:
`https://devscrolls-blog-automation.onrender.com`

---

## 3. Registering the Telegram Webhook

Once your Render service is deployed and responding at `https://<YOUR_RENDER_APP>/health`, register your Telegram webhook so Telegram delivers updates directly to your backend:

Open your browser or terminal and run:

```bash
curl -F "url=https://<YOUR_RENDER_APP>/api/telegram/webhook" \
     -F "secret_token=<YOUR_TELEGRAM_WEBHOOK_SECRET>" \
     "https://api.telegram.org/bot9066790475:AAGcppeA_WF0-Ak1lZ3a7WtoPXiVHbXGsqc/setWebhook"
```

Expected response:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## 4. Keeping Render Awake (Optional Zero-Cost Keepalive)

Render Free Tier instances spin down after 15 minutes of inactivity. To ensure instant responses to Telegram voice notes during your active working hours:

1. Sign up for a free account at [cron-job.org](https://cron-job.org) or [UptimeRobot.com](https://uptimerobot.com).
2. Create a new monitor/cron job:
   - **URL**: `https://<YOUR_RENDER_APP>/health`
   - **Schedule**: Every 14 minutes
   - **Method**: GET
3. This completely prevents cold-start delays at zero cost.

---

## 5. Testing the Production Bot

1. Open Telegram and search for `@DevScrollsBot` (`t.me/DevScrollsBot`).
2. Type `/start`. The bot will greet you by name and confirm authorization.
3. Send a short voice note (e.g. 30 seconds describing an architectural pattern or engineering trade-off).
4. Tap **Confirm & Transcribe** (Gate 1).
5. Inspect the generated transcript and tap **Confirm & Start AI** (Gate 2).
6. Watch real-time milestone updates stream in as the 4 agents research, fact-check, and draft your article.
7. Inspect the draft card, tap **View Full Article** or **View Research**, and tap **Approve & Publish** to publish directly to DevScrolls!
