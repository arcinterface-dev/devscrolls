# DevScrolls Blog Automation Backend

> **Personal AI Knowledge-to-Blog Publishing Agent**  
> Independent FastAPI backend orchestrating voice note intake via Telegram, two-stage human verification gates, Tavily research, epistemic fact-checking, and automated GitHub publishing to DevScrolls.

---

## 🚀 Key Architectural Principles

1. **Zero Cost Target:** Optimized to operate 100% within free tiers:
   - **AI Provider:** Google Gemini API (Free Tier default)
   - **Hosting:** Render Free Web Service
   - **Database:** Supabase PostgreSQL (Free Tier)
   - **Web Research:** Tavily Search API (1,000 free credits/month)
   - **Deployments:** GitHub Pages via GitHub REST API

2. **Pluggable Multi-Model Architecture:**
   - Default: `gemini` (Free tier)
   - Built-in upgrade support: Switch to `anthropic` (Claude 3.5 Sonnet / Opus) whenever ready simply by setting `DEFAULT_AI_PROVIDER=anthropic` and adding `ANTHROPIC_API_KEY`.
   - Hybrid mode: Supports per-agent overrides (e.g. running the Blog Writer on Claude while running Analysis/Research on Gemini Free to conserve tokens).

3. **Two-Stage Human Confirmation Gates:**
   - **Gate 1 (Audio):** You review and confirm your voice recording in Telegram before ANY AI API or transcription credit is spent.
   - **Gate 2 (Transcript):** You review and edit the transcript before the multi-agent pipeline begins.
   - **Final Approval:** You must explicitly click `[Approve & Publish]` in Telegram before anything is committed to GitHub.

---

## 📁 Repository Structure

```
blog-automation-backend/
├── app/
│   ├── main.py                     # FastAPI application factory
│   ├── api/
│   │   ├── health.py               # Health check endpoint
│   │   └── telegram_webhook.py     # Telegram bot webhook handler
│   ├── ai/
│   │   ├── provider_interface.py   # Abstract AIProvider contract
│   │   ├── factory.py              # Pluggable provider factory
│   │   └── providers/
│   │       ├── gemini_provider.py  # Google Gemini implementation (Free)
│   │       └── anthropic_provider.py # Claude implementation (Optional)
│   ├── config/
│   │   ├── settings.py             # Pydantic Settings & environment config
│   │   └── limits.py               # Budget and operational safeguards
│   ├── storage/
│   │   ├── database.py             # Supabase client singleton
│   │   └── repositories/           # Database access layer
│   └── workers/                    # Job queue and recovery workers
├── knowledge_assets/               # Read-only author assets copied from blog repo
│   ├── VOICE_PROFILE.md            # Author voice analysis & quirks
│   ├── post-tone-and-voice.md      # 6-Beat Post Blueprint
│   ├── blog_generation_rules.md    # Editorial rules & banned words
│   ├── seo_guidelines.md           # SEO Master Guide
│   ├── content_schema.md           # Astro frontmatter Zod specification
│   └── writing_samples/            # 8 benchmark articles
├── prompts/                        # Agent system prompts
├── migrations/                     # Supabase SQL migrations
├── tests/                          # Test suites
├── Dockerfile                      # Production container image
├── docker-compose.yml              # Local development compose
└── requirements.txt                # Python dependencies
```

---

## 🛠️ Local Development Setup

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, etc.
```

### 2. Run via Docker Compose
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`.

### 3. Run Locally (Python 3.12+)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Health Check
```bash
curl http://localhost:8000/health
```

---

## 🔄 Switching AI Models

To switch from Gemini Free to Claude:
1. In `.env`, change:
   ```ini
   DEFAULT_AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-api...
   ```
2. Restart the service. That's it!

To run a hybrid setup (e.g., Writer on Claude, Analysis on Gemini Free):
```ini
DEFAULT_AI_PROVIDER=gemini
WRITER_AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api...
```

