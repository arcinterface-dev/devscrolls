# Personal AI Blog Automation Platform
## Complete Technical Architecture & Phase-by-Phase Implementation Specification

> **Project:** DevScrolls – AI-Powered Blog Automation  
> **Author & Persona:** Santhanakrishnan  
> **Target Production System:** Telegram + Python FastAPI (Render Free) + Gemini API + Tavily API + Supabase PostgreSQL + GitHub REST API + GitHub Pages Deployment  
> **Operational Cost Budget:** Strictly $0 / ₹0 per month (Free Tier Limits)  
> **Primary Document Reference:** `.dev/ai-automation-plan.md`  

---

## 1. Executive Summary & Existing Platform Audit

DevScrolls is an established, production-grade static engineering blog built with **Astro v7.0.4** and **React 19.2.7**. It is currently deployed via GitHub Pages (`.github/workflows/deploy.yml`) on every push to the `main` branch.

### Key Audit Findings
1. **Source of Truth for Articles:** `src/content/articles/*.md` with 13 published articles.
2. **Strict Zod Frontmatter Schema (`src/content.config.ts`):**
   - `title`: string (≤ 70 chars)
   - `description`: string (100–160 chars)
   - `publishDate`: date
   - `category`: enum (`frontend`, `backend`, `ai`, `architecture`, `interviews`, `tutorials`)
   - `tags`: max 5 items from enum (`react`, `typescript`, `astro`, `css`, `performance`, `accessibility`, `system-design`)
   - `heroImage`: string (e.g. `"/<slug>-hero.webp"`)
   - `heroImageAlt`: string
   - `draft`: boolean
3. **Author Voice & Persona (`.dev/writing-samples/VOICE_PROFILE.md` & `.agents/rules/post-tone-and-voice.md`):**
   - Semi-casual, high warmth, peer-to-peer senior dev tone.
   - 6-Beat Post Blueprint (Cold Open Downward Spiral → Misattribution Pivot → Empirical Transition → Action Bullets → Epigrammatic Reversal → Utility CTA).
   - Banned LLM words: *delve, robust, landscape, in conclusion, tapestry, seamless, game-changer*.
   - Never emojis in H1-H4 headings.
4. **Existing Supabase Database (`supabase-schema.sql`):**
   - Active tables: `post_stats`, `post_claps`, `post_comments`, `tool_events`, `tool_stats`, `tool_daily_stats`.
   - The automation system extends this database with an isolated schema (`automation.*`) or dedicated prefixed tables without altering blog tables.
5. **Architectural Isolation:**
   - The automation backend will live in an independent service repository (`blog-automation-backend/`), keeping the blog clean.
   - Interaction with the blog occurs strictly via the GitHub REST API (committing approved Markdown files) and read-only consumption of extracted writing assets.

---

## 2. High-Level System Architecture & Flow

```
[ Telegram User ]
       |
       v (Voice or Text)
[ Telegram Webhook ] ---> [ FastAPI Backend on Render ]
                                |
               +----------------+----------------+
               |                                 |
        [ Voice Input ]                   [ Text Input ]
               |                                 |
       (STAGE 1 GATE)                            |
   [ Audio Confirmation ]                        |
    - Confirm & Transcribe                       |
    - Re-record / Cancel                         |
               |                                 |
         (Transcribe)                            |
               |                                 |
       (STAGE 2 GATE) <--------------------------+
  [ Transcript Review Gate ]
   - Confirm & Start AI
   - Edit Transcript
   - Re-record / Cancel
               |
               v (Only after explicit confirmation)
   [ Supabase Job Queue ]
               |
               v
   [ 4-Agent Orchestration Pipeline ]
       1. Personal Perspective Analyst (Extracts tone, claims, experiences)
       2. Research Agent (Tavily Search API with source ranking)
       3. Fact Checker & Critical Reviewer (Claim verification ledger)
       4. Blog Writer & Editorial Agent (Astro format, SEO, author voice)
               |
               v
   [ Draft Review Gate (Telegram) ]
    - View Full / View Research
    - Request Changes (Revision Loop)
    - Reject
    - Approve & Publish
               |
               v (Only upon explicit user click)
   [ GitHub Publisher (REST API) ] ---> Commits to main: src/content/articles/<slug>.md
               |
               v
   [ GitHub Pages Deploy Workflow ] ---> Deploys to https://devscrolls.dev
               |
               v
   [ Deployment Verifier ] ---> Tests live URL (200 OK) ---> Notifies Telegram
```

---

## 3. Database Schema Specification (Supabase PostgreSQL)

All automation tables are provisioned in Supabase, keeping blog tables completely intact:

```sql
-- 1. Authorized Telegram Users
CREATE TABLE IF NOT EXISTS automation.telegram_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    display_name TEXT,
    is_authorized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Conversations / Idea Sessions
CREATE TABLE IF NOT EXISTS automation.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL REFERENCES automation.telegram_users(telegram_user_id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled', 'failed')),
    current_stage TEXT DEFAULT 'input_pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Input Sessions (Enforces Two-Stage Gates)
CREATE TABLE IF NOT EXISTS automation.input_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES automation.conversations(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL CHECK (input_type IN ('voice', 'text')),
    telegram_file_id TEXT,
    telegram_message_id BIGINT,
    audio_status TEXT DEFAULT 'pending'
        CHECK (audio_status IN ('pending', 'confirmed', 'superseded', 'cancelled')),
    transcript_status TEXT DEFAULT 'pending'
        CHECK (transcript_status IN ('pending', 'confirmed', 'editing', 'cancelled')),
    original_transcript TEXT,
    corrected_transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Generation Jobs (Asynchronous Background Engine)
CREATE TABLE IF NOT EXISTS automation.generation_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES automation.conversations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'awaiting_clarification',
                          'awaiting_approval', 'completed', 'failed', 'cancelled',
                          'paused_quota')),
    current_stage TEXT DEFAULT 'perspective_analysis'
        CHECK (current_stage IN ('perspective_analysis', 'research', 'fact_check',
                                  'writing', 'editorial_review', 'user_review',
                                  'publishing', 'deployment_verification')),
    perspective_output JSONB,
    research_output JSONB,
    factcheck_output JSONB,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Blog Drafts (Astro Frontmatter + Body)
CREATE TABLE IF NOT EXISTS automation.blog_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES automation.conversations(id) ON DELETE CASCADE,
    job_id UUID REFERENCES automation.generation_jobs(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    frontmatter JSONB NOT NULL,
    seo_metadata JSONB,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_review', 'revision_requested',
                          'approved', 'published', 'rejected')),
    current_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Draft Versions (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS automation.draft_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES automation.blog_drafts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    frontmatter JSONB NOT NULL,
    revision_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (draft_id, version_number)
);

-- 7. Fact-Check Claims Ledger
CREATE TABLE IF NOT EXISTS automation.article_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES automation.generation_jobs(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    original_statement TEXT NOT NULL,
    claim_type TEXT NOT NULL
        CHECK (claim_type IN ('personal_experience', 'personal_opinion', 'technical_fact',
                              'interpretation', 'hypothesis', 'external_fact')),
    verification_status TEXT NOT NULL
        CHECK (verification_status IN ('VERIFIED', 'PARTIALLY_VERIFIED', 'CONTRADICTED',
                                        'UNSUPPORTED', 'OUTDATED', 'PERSONAL_EXPERIENCE',
                                        'PERSONAL_OPINION', 'INTERPRETATION', 'HYPOTHESIS')),
    suggested_correction TEXT,
    confidence DECIMAL(3,2),
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Research Sources
CREATE TABLE IF NOT EXISTS automation.research_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES automation.generation_jobs(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES automation.article_claims(id),
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('official_docs', 'academic', 'tech_publication',
                                            'community', 'other')),
    publication_date DATE,
    retrieved_at TIMESTAMPTZ DEFAULT now(),
    relevant_excerpt TEXT,
    reliability_score DECIMAL(3,2)
);

-- 9. Personal Knowledge Library
CREATE TABLE IF NOT EXISTS automation.personal_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES automation.conversations(id),
    original_content TEXT NOT NULL,
    corrected_content TEXT,
    topic TEXT NOT NULL,
    knowledge_type TEXT CHECK (knowledge_type IN ('experience', 'opinion', 'explanation',
                                                   'observation', 'project')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Publishing Jobs
CREATE TABLE IF NOT EXISTS automation.publishing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES automation.blog_drafts(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'committing', 'committed', 'deploying',
                          'deployed', 'verified', 'failed')),
    github_commit_sha TEXT,
    github_file_path TEXT,
    published_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Usage & Cost Ledger
CREATE TABLE IF NOT EXISTS automation.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES automation.generation_jobs(id),
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'tavily', 'github')),
    model TEXT,
    operation TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    search_credits INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Multi-Agent System Contracts

| Agent | Responsibility | Core Input | Structured Output |
|---|---|---|---|
| **Agent 1: Perspective Analyst** | Extracts topic, personal experiences, opinions, hypotheses, and isolates claims requiring research without fabricating experiences. | Confirmed transcript, previous knowledge | `PerspectiveOutput`: article_type, personal_perspective, observations, claims list, outline, clarification questions. |
| **Agent 2: Research Agent** | Runs targeted web searches via Tavily; prioritizes official docs > academic > tech publications > community; evaluates sources. | `PerspectiveOutput.claims` | `ResearchOutput`: sources list, supporting evidence, contradictory evidence, credit usage. |
| **Agent 3: Fact Checker** | Validates technical facts against research; protects personal opinions & experiences from being marked as errors; builds claim verification ledger. | `PerspectiveOutput` + `ResearchOutput` | `FactCheckOutput`: claim verification ledger, minor corrections (auto-applied), major corrections (user-approval gate). |
| **Agent 4: Blog Writer & Editor** | Drafts complete article strictly formatted for Astro content collection; applies Santhanakrishnan's voice profile and 6-beat framework; runs internal editorial pass. | Verified claims, research, voice profile, writing samples, Astro schema | `ArticleOutput`: Zod-compliant frontmatter, Markdown body with BLUF, SEO metadata, references. |

---

## 5. End-to-End Implementation Roadmap (Phases 0 to 13)

To ensure each phase can be executed smoothly with different models in separate sessions, each phase has clear input dependencies, code deliverables, acceptance tests, and handoff checklists.

### Phase Dependency Flow
```
Phase 0 (Scaffolding)
   |
Phase 1 (Database & Migrations)
   |
   +-----------------------+
   |                       |
Phase 2 (Telegram Bot)   Phase 4 (Job Queue & Workers)
   |                       |
Phase 3 (Gemini & Voice)   |
   |                       |
   +-----------+-----------+
               |
Phase 5 (Agent 1: Perspective Analyst)
   |
Phase 6 (Agent 2: Research & Tavily)
   |
Phase 7 (Agent 3: Fact Checker)
   |
Phase 8 (Agent 4: Blog Writer & Editor)
   |
Phase 9 (Central Orchestrator Integration)
   |
Phase 10 (Telegram Review & Revision UX)
   |
Phase 11 (GitHub & Deployment Verification)
   |
Phase 12 (Knowledge Library)
   |
Phase 13 (E2E Validation & Production Hardening)
```

---

### Detailed Phase Specifications

#### Phase 0: Scaffolding & Repository Setup
- **Objective:** Create independent `blog-automation-backend/` workspace with Python 3.12, FastAPI app factory, Dockerfile, env settings, and copy read-only writing/SEO assets from the blog repo.
- **Key Files:** `app/main.py`, `app/config/settings.py`, `app/config/limits.py`, `Dockerfile`, `docker-compose.yml`, `requirements.txt`.
- **Acceptance Criteria:** `docker compose up` starts service; `GET /health` returns `200 OK`; knowledge assets synced.

#### Phase 1: Database Schema & Supabase Integration
- **Objective:** Execute `migrations/001_automation_schema.sql` on Supabase; create typed repository layer for users, conversations, input sessions, generation jobs, and drafts.
- **Key Files:** `app/storage/database.py`, `app/storage/repositories/*.py`.
- **Acceptance Criteria:** Atomic job claiming works (`UPDATE ... WHERE status='queued' AND claimed_at IS NULL RETURNING *`); RLS policies configured.

#### Phase 2: Telegram Bot & Two-Stage Confirmation Gates
- **Objective:** Implement Telegram Bot webhook with user allowlist and strict DB-enforced two-stage gates (Audio Confirmation Gate & Transcript Confirmation Gate).
- **Key Files:** `app/api/telegram_webhook.py`, `app/telegram/handlers.py`, `app/telegram/keyboards.py`, `app/telegram/callbacks.py`.
- **Acceptance Criteria:** Voice message triggers inline confirmation without calling AI; "Re-record" discards; "Cancel" cleans up; transcript editing supported; spoofed callbacks rejected.

#### Phase 3: Gemini Integration & Audio Transcription
- **Objective:** Implement `google-genai` provider; transcribe audio only after explicit "Confirm & Transcribe" callback; implement token and budget limits.
- **Key Files:** `app/ai/provider_interface.py`, `app/ai/gemini_provider.py`, `app/ai/transcription.py`, `app/storage/repositories/usage_repo.py`.
- **Acceptance Criteria:** Audio transcribed via Gemini; usage logged; quota limit raises error and pauses gracefully.

#### Phase 4: Background Job Queue & Worker System
- **Objective:** Design persistent, restart-tolerant job worker for Render Free Tier cold starts and webhook timeouts.
- **Key Files:** `app/workers/job_queue.py`, `app/workers/job_processor.py`, `app/workers/recovery.py`, `app/api/worker.py`.
- **Acceptance Criteria:** Webhook acknowledges within 5s; background worker claims and processes jobs; cold restart recovers interrupted jobs from last saved stage.

#### Phase 5: Agent 1 — Personal Perspective Analyst
- **Objective:** Build first agent to extract author perspective, categorize article types, classify claims, and formulate clarification questions if ambiguous.
- **Key Files:** `app/ai/agents/perspective_analyst.py`, `prompts/perspective_analyst.md`, `app/schemas/perspective.py`.
- **Acceptance Criteria:** Extracts personal experiences without fabrication; classifies opinions vs facts; pauses for clarification via Telegram if necessary.

#### Phase 6: Agent 2 — Research Agent + Tavily Integration
- **Objective:** Web research via Tavily Search API with credit budgeting (max 120 credits/article) and source hierarchy ranking (Official docs > Academic > Tech pubs > Community).
- **Key Files:** `app/research/search_provider.py`, `app/research/tavily_provider.py`, `app/ai/agents/research_agent.py`, `app/research/source_extractor.py`.
- **Acceptance Criteria:** Real URLs extracted; source priority enforced; 7-day cache saves credits; budget pause triggers on quota exhaustion.

#### Phase 7: Agent 3 — Fact Checker & Critical Reviewer
- **Objective:** Build claim verification ledger matching original claims to research; protect opinions & experiences; classify minor vs major corrections.
- **Key Files:** `app/ai/agents/fact_checker.py`, `prompts/fact_checker.md`, `app/schemas/factcheck.py`.
- **Acceptance Criteria:** Opinions never flagged as errors; major technical errors flagged with suggested corrections; approval gate pauses for author sign-off.

#### Phase 8: Agent 4 — Blog Writer & Editorial Agent
- **Objective:** Generate full Astro-compatible article matching Santhanakrishnan's voice profile, BLUF layout, 6-beat framework, and Zod frontmatter schema; perform internal editorial validation.
- **Key Files:** `app/ai/agents/blog_writer.py`, `prompts/blog_writer.md`, `prompts/editorial_review.md`, `app/knowledge/context_builder.py`.
- **Acceptance Criteria:** Title ≤ 70 chars, description 100-160 chars; valid taxonomy category/tags; no banned words; max 2 editorial correction cycles.

#### Phase 9: Central Orchestrator & Full Pipeline Integration
- **Objective:** Connect all 4 agents into end-to-end state machine with pause/resume support and Telegram stage progress notifications.
- **Key Files:** `app/ai/orchestrator.py`, stage state handlers.
- **Acceptance Criteria:** Full automated run from confirmed transcript to completed draft; intermediate states persisted in DB; Telegram progress updates delivered.

#### Phase 10: Telegram Draft Review & Revision Workflow
- **Objective:** Deliver interactive review cards to Telegram with chunked article viewer, research summary viewer, revision request loop, rejection, and approval trigger.
- **Key Files:** `app/telegram/handlers.py`, `app/telegram/callbacks.py`.
- **Acceptance Criteria:** Multi-part message rendering; user revision loop saves version history; "Approve & Publish" requires explicit click.

#### Phase 11: GitHub Publishing & Deployment Verification
- **Objective:** Commit approved draft to `src/content/articles/<slug>.md` via GitHub REST API; monitor GitHub Pages build workflow; poll live URL.
- **Key Files:** `app/publishing/github_publisher.py`, `app/publishing/article_validator.py`, `app/publishing/deployment_monitor.py`.
- **Acceptance Criteria:** Frontmatter re-validated before commit; duplicate slugs rejected; workflow monitored; live URL verified with 200 OK.

#### Phase 12: Personal Knowledge Library
- **Objective:** Persist original transcript, corrected transcript, and structured takeaways into `personal_knowledge` with PostgreSQL full-text search for future cross-linking.
- **Key Files:** `app/knowledge/knowledge_manager.py`, `app/knowledge/retrieval.py`.
- **Acceptance Criteria:** Append-only knowledge stored; full-text search retrieves related concepts for future articles.

#### Phase 13: End-to-End Testing & Production Readiness
- **Objective:** Validate all 8 acceptance scenarios (personal experience, wrong fact, opinion, ambiguity, conflicting sources, revision, publish failure, quota pause); security audit (secrets, RLS, webhooks).
- **Key Files:** `tests/e2e/*.py`, `render.yaml`, production documentation.
- **Acceptance Criteria:** All scenarios pass; zero cost operations confirmed; ready for continuous personal blogging.

---

## 6. Model Allocation Strategy for Multi-Session Execution

| Phase | Recommended Model | Focus Area |
|---|---|---|
| **Phase 0** | Gemini Flash / Claude Sonnet | Scaffolding, config, Docker, directory setup |
| **Phase 1** | Claude Sonnet / GPT-4o | SQL migrations, constraints, repository CRUD |
| **Phase 2** | Claude Opus / Sonnet | Telegram state machine, callback security, two-stage gates |
| **Phase 3** | Gemini Flash / Pro | Multimodal Gemini API, audio handling, token logging |
| **Phase 4** | Claude Opus / Sonnet | Concurrency, job queue recovery, Render cold-start resilience |
| **Phase 5** | Claude Sonnet / GPT-4o | Persona extraction, claim classification prompt engineering |
| **Phase 6** | Claude Sonnet / Gemini Pro | Tavily search API, source ranking algorithm, caching |
| **Phase 7** | Claude Opus / Sonnet | Fact-check ledger, epistemic classification, critical review |
| **Phase 8** | Claude Opus | Voice matching, 6-beat framework, frontmatter compliance |
| **Phase 9** | Claude Opus / Sonnet | State machine orchestration, error handling, pause/resume |
| **Phase 10** | Claude Sonnet / GPT-4o | Telegram interactive UX, message chunking, revision loops |
| **Phase 11** | Claude Sonnet / GPT-4o | GitHub API commits, CI/CD polling, deployment verification |
| **Phase 12** | Gemini Flash / Sonnet | Full-text search, knowledge extraction, cross-linking |
| **Phase 13** | Claude Opus / Sonnet | Comprehensive E2E test suites, edge cases, security audit |

---

## 7. How to Prompt the Next Model for Each Phase

Whenever starting a new phase in a fresh model session:

1. Provide this document: `PERSONAL_AI_BLOG_AUTOMATION_ARCHITECTURE.md`.
2. Reference the master plan: `.dev/ai-automation-plan.md`.
3. Provide the specific Phase prompt:
   > *"We are implementing Phase [X]: [Phase Name] from PERSONAL_AI_BLOG_AUTOMATION_ARCHITECTURE.md. Please review the deliverables, file paths, and acceptance criteria for Phase [X] and implement the required files. Ensure all code satisfies the acceptance checklist before concluding."*

