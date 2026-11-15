-- ==============================================================================
-- DevScrolls Blog Automation: Supabase PostgreSQL Schema Migration
-- Migration: 001_automation_schema.sql
-- Run this in Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- Create dedicated schema to keep automation tables cleanly isolated from blog tables
CREATE SCHEMA IF NOT EXISTS automation;

-- Helper function for automated updated_at timestamp updates
CREATE OR REPLACE FUNCTION automation.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trg_telegram_users_updated ON automation.telegram_users;
CREATE TRIGGER trg_telegram_users_updated
    BEFORE UPDATE ON automation.telegram_users
    FOR EACH ROW EXECUTE FUNCTION automation.set_updated_at();

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

DROP TRIGGER IF EXISTS trg_conversations_updated ON automation.conversations;
CREATE TRIGGER trg_conversations_updated
    BEFORE UPDATE ON automation.conversations
    FOR EACH ROW EXECUTE FUNCTION automation.set_updated_at();

-- 3. Input Sessions (Enforces Two-Stage Audio & Transcript Gates)
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

-- 4. Generation Jobs (Asynchronous State Machine Tracking)
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

DROP TRIGGER IF EXISTS trg_generation_jobs_updated ON automation.generation_jobs;
CREATE TRIGGER trg_generation_jobs_updated
    BEFORE UPDATE ON automation.generation_jobs
    FOR EACH ROW EXECUTE FUNCTION automation.set_updated_at();

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

DROP TRIGGER IF EXISTS trg_blog_drafts_updated ON automation.blog_drafts;
CREATE TRIGGER trg_blog_drafts_updated
    BEFORE UPDATE ON automation.blog_drafts
    FOR EACH ROW EXECUTE FUNCTION automation.set_updated_at();

-- 6. Draft Versions (Immutable Version History)
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

DROP TRIGGER IF EXISTS trg_publishing_jobs_updated ON automation.publishing_jobs;
CREATE TRIGGER trg_publishing_jobs_updated
    BEFORE UPDATE ON automation.publishing_jobs
    FOR EACH ROW EXECUTE FUNCTION automation.set_updated_at();

-- 11. Usage & Cost Ledger
CREATE TABLE IF NOT EXISTS automation.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES automation.generation_jobs(id),
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'anthropic', 'tavily', 'github')),
    model TEXT,
    operation TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    search_credits INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_gen_jobs_queue ON automation.generation_jobs(status, claimed_at);
CREATE INDEX IF NOT EXISTS idx_blog_drafts_slug ON automation.blog_drafts(slug);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON automation.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_personal_knowledge_topic ON automation.personal_knowledge USING GIN (to_tsvector('english', topic || ' ' || original_content));
CREATE INDEX IF NOT EXISTS idx_article_claims_job ON automation.article_claims(job_id);
CREATE INDEX IF NOT EXISTS idx_input_sessions_conv ON automation.input_sessions(conversation_id);

-- ==============================================================================
-- Atomic Job Claiming RPC (FOR UPDATE SKIP LOCKED)
-- Ensures exactly-once execution across background workers without race conditions
-- ==============================================================================
CREATE OR REPLACE FUNCTION automation.claim_next_job(p_stale_minutes INTEGER DEFAULT 30)
RETURNS SETOF automation.generation_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Select next available queued job or stale processing job
    SELECT id INTO v_job_id
    FROM automation.generation_jobs
    WHERE status = 'queued'
       OR (status = 'processing' AND claimed_at < (now() - (p_stale_minutes || ' minutes')::interval))
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NOT NULL THEN
        RETURN QUERY
        UPDATE automation.generation_jobs
        SET status = 'processing',
            claimed_at = now(),
            updated_at = now()
        WHERE id = v_job_id
        RETURNING *;
    END IF;

    RETURN;
END;
$$;

-- ==============================================================================
-- Security & Row Level Security (RLS)
-- Lock down all tables so public anon key has ZERO read/write access.
-- Only the backend service_role key can access automation tables.
-- ==============================================================================
ALTER TABLE automation.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.input_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.blog_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.article_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.personal_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.usage_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'automation' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON automation.%I', tbl);
        EXECUTE format('CREATE POLICY "Service role full access" ON automation.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END;
$$;

-- ==============================================================================
-- Schema Privileges & PostgREST Exposure
-- Expose automation schema to Supabase PostgREST API so backend queries succeed
-- ==============================================================================
GRANT USAGE ON SCHEMA automation TO service_role, authenticator, anon;
GRANT ALL ON ALL TABLES IN SCHEMA automation TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA automation TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA automation TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA automation GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA automation GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA automation GRANT ALL ON ROUTINES TO service_role;

-- Expose automation schema to PostgREST and reload schema cache
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, automation, storage, graphql_public';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
