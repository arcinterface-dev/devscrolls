"""Tests for Pydantic database models in app.schemas.database.
Validates serialization, defaults, and business rules.
"""
from uuid import UUID, uuid4
from datetime import datetime
import pytest
from app.schemas.database import (
    TelegramUser,
    Conversation,
    InputSession,
    GenerationJob,
    BlogDraft,
    DraftVersion,
    ArticleClaim,
    UsageLog,
)

def test_telegram_user_model_defaults():
    user = TelegramUser(telegram_user_id=123456789, username="stark")
    assert isinstance(user.id, UUID)
    assert user.telegram_user_id == 123456789
    assert user.is_authorized is False
    assert isinstance(user.created_at, datetime)

def test_input_session_effective_transcript():
    conv_id = uuid4()
    # When only original transcript is present
    session = InputSession(
        conversation_id=conv_id,
        input_type="voice",
        original_transcript="My raw thoughts on React 19."
    )
    assert session.effective_transcript == "My raw thoughts on React 19."
    assert session.audio_status == "pending"
    assert session.transcript_status == "pending"

    # When author edits the transcript in Gate 2
    session.corrected_transcript = "My refined thoughts on React 19 Server Components."
    assert session.effective_transcript == "My refined thoughts on React 19 Server Components."

def test_generation_job_defaults():
    conv_id = uuid4()
    job = GenerationJob(conversation_id=conv_id)
    assert job.status == "queued"
    assert job.current_stage == "perspective_analysis"
    assert job.retry_count == 0
    assert job.claimed_at is None

def test_blog_draft_and_version():
    conv_id = uuid4()
    draft = BlogDraft(
        conversation_id=conv_id,
        title="Why Developers Need A Daily Companion",
        slug="why-developers-need-a-daily-companion",
        content="**BLUF:** Every engineer needs a dashboard...",
        frontmatter={"category": "frontend", "tags": ["react", "performance"]}
    )
    assert draft.current_version == 1
    assert draft.status == "draft"

    version = DraftVersion(
        draft_id=draft.id,
        version_number=1,
        content=draft.content,
        frontmatter=draft.frontmatter,
        revision_reason="Initial draft"
    )
    assert version.version_number == 1

def test_article_claim_model():
    job_id = uuid4()
    claim = ArticleClaim(
        job_id=job_id,
        claim_text="React Server Components eliminate client bundles.",
        original_statement="RSC removes client bundle size completely.",
        claim_type="technical_fact",
        verification_status="PARTIALLY_VERIFIED",
        suggested_correction="RSC shifts server component code out of the client bundle, but client components still require JavaScript.",
        confidence=0.95
    )
    assert claim.verification_status == "PARTIALLY_VERIFIED"
    assert claim.confidence == 0.95

def test_usage_log_model():
    job_id = uuid4()
    log = UsageLog(
        job_id=job_id,
        provider="gemini",
        model="gemini-3.5-flash-lite",
        operation="transcription",
        input_tokens=150,
        output_tokens=300,
        estimated_cost=0.0
    )
    assert log.provider == "gemini"
    assert log.input_tokens == 150
    assert log.estimated_cost == 0.0

