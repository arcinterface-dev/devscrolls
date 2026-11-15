"""
Unit and integration test suite for Phase 10: Telegram Review & Revision UX.
Tests:
- Markdown message chunking for long articles (>4096 chars).
- Callback handlers: draft_approve, draft_view, draft_sources, draft_revise, draft_reject.
- Conversational draft revision loop with version history tracking.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.database import BlogDraft, GenerationJob, ResearchSource, ArticleClaim
from app.schemas.article import ArticleDraftOutput, AstroFrontmatter
from app.telegram.callbacks import (
    chunk_markdown,
    _handle_draft_approve,
    _handle_draft_view,
    _handle_draft_sources,
    _handle_draft_revise,
    _handle_draft_reject,
)
from app.telegram.handlers import _handle_text_input


def test_chunk_markdown():
    """Verify that chunk_markdown safely splits articles without breaking lines."""
    # Short text
    short_text = "This is a brief markdown post."
    chunks = chunk_markdown(short_text, max_chars=100)
    assert len(chunks) == 1
    assert chunks[0] == short_text

    # Long text with multiple paragraphs
    paragraphs = [f"Paragraph {i}: " + ("A" * 200) for i in range(25)]
    long_doc = "\n\n".join(paragraphs)
    assert len(long_doc) > 5000

    chunks = chunk_markdown(long_doc, max_chars=1500)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) <= 1500
        assert not c.startswith("\n")
        assert not c.endswith("\n")

    # Joined text contains all paragraphs
    reconstructed = "\n\n".join(chunks)
    for p in paragraphs:
        assert p in reconstructed


@pytest.mark.asyncio
async def test_callback_draft_approve():
    """Verify draft_approve advances draft to approved and job to publishing."""
    draft_id = str(uuid4())
    job_id = str(uuid4())
    conv_id = str(uuid4())

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.job_id = job_id
    mock_draft.conversation_id = conv_id
    mock_draft.title = "React Server Components Architecture"
    mock_draft.current_version = 1
    mock_draft.slug = "rsc-architecture"

    with patch("app.telegram.callbacks.draft_repo.get_by_id", AsyncMock(return_value=mock_draft)), \
         patch("app.telegram.callbacks.draft_repo.update_status", AsyncMock()) as mock_update_status, \
         patch("app.telegram.callbacks.job_queue.advance_stage", AsyncMock()) as mock_advance, \
         patch("app.telegram.callbacks.job_repo.set_job_status", AsyncMock()) as mock_job_status, \
         patch("app.telegram.callbacks.conv_repo.update_status", AsyncMock()) as mock_conv_status, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()) as mock_answer, \
         patch("app.telegram.callbacks.bot_client.edit_message_text", AsyncMock()) as mock_edit_msg, \
         patch("app.workers.job_processor.job_processor.run_worker_cycle", AsyncMock()):

        await _handle_draft_approve("cb_1", 1234, 5678, 5435882029, draft_id)

        mock_update_status.assert_awaited_once_with(draft_id, "approved")
        mock_advance.assert_awaited_once_with(
            job_id=job_id,
            completed_stage="user_review",
            next_stage="publishing",
            stage_output={"draft_id": draft_id, "approved": True}
        )
        mock_job_status.assert_awaited_once_with(job_id, "queued")
        mock_conv_status.assert_awaited_once_with(conv_id, "active", "publishing")
        assert "Draft Approved!" in mock_edit_msg.call_args[1]["text"]


@pytest.mark.asyncio
async def test_callback_draft_view():
    """Verify draft_view chunks long articles and sends sequential messages."""
    draft_id = str(uuid4())
    long_content = "## Section 1\n\n" + ("Insightful analysis. " * 300) + "\n\n## Section 2\n\n" + ("More insights. " * 300)

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.title = "Long Form Technical Breakdown"
    mock_draft.current_version = 2
    mock_draft.frontmatter = {"category": "frontend", "tags": ["react"]}
    mock_draft.content = long_content

    with patch("app.telegram.callbacks.draft_repo.get_by_id", AsyncMock(return_value=mock_draft)), \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await _handle_draft_view("cb_2", 1234, 5678, 5435882029, draft_id)

        assert mock_send_msg.await_count >= 2
        first_call = mock_send_msg.call_args_list[0][1]["text"]
        assert "Full Draft (v2)" in first_call


@pytest.mark.asyncio
async def test_callback_draft_sources():
    """Verify draft_sources displays authoritative research citations and claims ledger."""
    draft_id = str(uuid4())
    job_id = str(uuid4())

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.job_id = job_id
    mock_draft.title = "Astro 5 Architecture"

    mock_source = MagicMock(spec=ResearchSource)
    mock_source.source_title = "Astro 5 Official Documentation"
    mock_source.source_url = "https://astro.build/blog/astro-5/"
    mock_source.source_type = "official_docs"
    mock_source.relevant_excerpt = "The Content Layer API standardizes data loading."

    mock_claim = MagicMock(spec=ArticleClaim)
    mock_claim.claim_text = "Content Layer standardizes data loading"
    mock_claim.verification_status = "VERIFIED"
    mock_claim.explanation = "Confirmed by official release notes."

    with patch("app.telegram.callbacks.draft_repo.get_by_id", AsyncMock(return_value=mock_draft)), \
         patch("app.telegram.callbacks.claim_repo.get_sources_for_job", AsyncMock(return_value=[mock_source])), \
         patch("app.telegram.callbacks.claim_repo.get_claims_for_job", AsyncMock(return_value=[mock_claim])), \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await _handle_draft_sources("cb_3", 1234, 5678, 5435882029, draft_id)

        mock_send_msg.assert_awaited_once()
        sent_text = mock_send_msg.call_args[1]["text"]
        assert "Astro 5 Official Documentation" in sent_text
        assert "Content Layer standardizes data loading" in sent_text


@pytest.mark.asyncio
async def test_callback_draft_revise():
    """Verify draft_revise sets conversation to draft_revising and prompts author."""
    draft_id = str(uuid4())
    conv_id = str(uuid4())

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.conversation_id = conv_id
    mock_draft.current_version = 1

    with patch("app.telegram.callbacks.draft_repo.get_by_id", AsyncMock(return_value=mock_draft)), \
         patch("app.telegram.callbacks.conv_repo.update_status", AsyncMock()) as mock_conv_status, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await _handle_draft_revise("cb_4", 1234, 5678, 5435882029, draft_id)

        mock_conv_status.assert_awaited_once_with(conv_id, "active", "draft_revising")
        mock_send_msg.assert_awaited_once()
        assert "Request Changes on Draft" in mock_send_msg.call_args[1]["text"]


@pytest.mark.asyncio
async def test_callback_draft_reject():
    """Verify draft_reject marks draft rejected and cancels generation job."""
    draft_id = str(uuid4())
    job_id = str(uuid4())
    conv_id = str(uuid4())

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.job_id = job_id
    mock_draft.conversation_id = conv_id

    with patch("app.telegram.callbacks.draft_repo.get_by_id", AsyncMock(return_value=mock_draft)), \
         patch("app.telegram.callbacks.draft_repo.update_status", AsyncMock()) as mock_draft_status, \
         patch("app.telegram.callbacks.job_repo.set_job_status", AsyncMock()) as mock_job_status, \
         patch("app.telegram.callbacks.conv_repo.update_status", AsyncMock()) as mock_conv_status, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.edit_message_text", AsyncMock()) as mock_edit_msg:

        await _handle_draft_reject("cb_5", 1234, 5678, 5435882029, draft_id)

        mock_draft_status.assert_awaited_once_with(draft_id, "rejected")
        mock_job_status.assert_awaited_once_with(job_id, "cancelled")
        mock_conv_status.assert_awaited_once_with(conv_id, "idle", None)
        assert "Draft Discarded" in mock_edit_msg.call_args[1]["text"]


@pytest.mark.asyncio
async def test_conversational_draft_revision():
    """Verify author text message in draft_revising mode generates revision v2 and presents review card."""
    conv_id = str(uuid4())
    draft_id = str(uuid4())
    job_id = str(uuid4())

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.current_stage = "draft_revising"

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.job_id = job_id
    mock_draft.current_version = 1
    mock_draft.content = "**Original BLUF.**\n\nContent"
    mock_draft.frontmatter = {
        "title": "Initial Draft",
        "description": "Initial description between one hundred and one hundred sixty characters long for SEO testing purposes.",
        "category": "frontend",
        "tags": ["react"]
    }

    revised_draft_output = ArticleDraftOutput(
        title="Initial Draft (Revised)",
        slug="initial-draft",
        frontmatter=AstroFrontmatter(
            title="Initial Draft (Revised)",
            description="Revised description between one hundred and one hundred sixty characters long for SEO testing purposes.",
            publishDate="2026-11-14",
            category="frontend",
            tags=["react", "performance"],
            heroImage="/initial-draft-hero.webp",
            heroImageAlt="Hero",
            draft=False
        ),
        markdown_content="**Revised punchier BLUF.**\n\n## Expanded Section\nAdded benchmarks.",
        word_count=250,
        reading_time="2 min read",
        banned_words_detected=[]
    )

    updated_draft = MagicMock(spec=BlogDraft)
    updated_draft.id = draft_id
    updated_draft.current_version = 2

    with patch("app.telegram.handlers.session_manager.get_or_create_active_conversation", AsyncMock(return_value=mock_conv)), \
         patch("app.telegram.handlers.draft_repo.get_latest_draft_for_conversation", AsyncMock(return_value=mock_draft)), \
         patch("app.ai.agents.blog_writer.blog_writer.revise_draft", AsyncMock(return_value=(revised_draft_output, None))), \
         patch("app.telegram.handlers.draft_repo.create_revision", AsyncMock(return_value=updated_draft)) as mock_create_rev, \
         patch("app.telegram.handlers.conv_repo.update_status", AsyncMock()) as mock_conv_status, \
         patch("app.telegram.handlers.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await _handle_text_input(1234, 5435882029, "Make the opening BLUF punchier and add benchmarks")

        mock_create_rev.assert_awaited_once()
        call_kwargs = mock_create_rev.call_args[1]
        assert call_kwargs["draft_id"] == draft_id
        assert "Revised punchier BLUF" in call_kwargs["new_content"]
        assert call_kwargs["revision_reason"] == "Make the opening BLUF punchier and add benchmarks"

        mock_conv_status.assert_awaited_once_with(conv_id, "active", "awaiting_draft_approval")

        # Check final sent message
        last_message = mock_send_msg.call_args_list[-1][1]
        assert "Revision v2 Ready!" in last_message["text"]
        assert last_message["reply_markup"] is not None
