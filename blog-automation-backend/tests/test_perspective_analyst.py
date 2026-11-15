"""Tests for Phase 5: Agent 1 — Personal Perspective Analyst.
Validates structured schema extraction, claim classification, editorial constraints,
and the human-in-the-loop clarification flow.
"""
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
import pytest

from app.ai.agents.perspective_analyst import PerspectiveAnalyst
from app.ai.agents.stage_handlers import handle_perspective_analysis_stage
from app.ai.provider_interface import UsageMetadata
from app.schemas.database import Conversation, GenerationJob, InputSession
from app.schemas.perspective import ClassifiedClaim, OutlineSection, PerspectiveOutput
from app.telegram.handlers import _handle_text_input

def _create_sample_perspective_output(has_clarification: bool = False) -> PerspectiveOutput:
    """Helper creating realistic PerspectiveOutput mock data."""
    return PerspectiveOutput(
        article_objective="Explain why React 19 Actions reduce boilerplate form handling.",
        proposed_title="How React 19 Actions Simplified Our Production Forms",
        main_argument="React 19 Actions eliminate manual pending states and error tracking in forms.",
        target_audience="Senior Frontend Engineers",
        article_type="problem_solving",
        personal_perspective="I spent three days refactoring our complex checkout forms and saw a 40% reduction in state logic.",
        important_observations=[
            "useActionState removes 3 separate useState hooks per form.",
            "Form reset behavior on optimistic updates requires careful error boundary handling."
        ],
        technical_explanations=[
            "Actions integrate natively with HTML form submission lifecycles."
        ],
        claims=[
            ClassifiedClaim(
                statement="I migrated our checkout forms to useActionState.",
                claim_type="personal_experience",
                requires_research=False,
                context="Personal migration experience"
            ),
            ClassifiedClaim(
                statement="useActionState automatically manages isPending transitions.",
                claim_type="technical_fact",
                requires_research=True,
                context="Technical explanation of the hook"
            ),
            ClassifiedClaim(
                statement="React 19 forms are significantly superior to controlled Redux forms.",
                claim_type="personal_opinion",
                requires_research=False,
                context="Author perspective on state management"
            )
        ],
        proposed_outline=[
            OutlineSection(heading="The State Boilerplate Trap", key_points=["useState overhead"]),
            OutlineSection(heading="Enter useActionState", key_points=["Native form transitions"])
        ],
        missing_information=[],
        clarification_questions=[
            "Did your checkout migration involve React Server Components or purely client components?"
        ] if has_clarification else []
    )

@pytest.mark.asyncio
async def test_perspective_analyst_editorial_constraints(monkeypatch):
    """Test that titles exceeding 70 characters are truncated and headings have emojis stripped."""
    analyst = PerspectiveAnalyst()

    long_title = "How React 19 Actions and Modern Server Components Completely Revolutionized Our Architecture"
    assert len(long_title) > 70

    mock_output = _create_sample_perspective_output()
    mock_output.proposed_title = long_title
    mock_output.proposed_outline = [
        OutlineSection(heading="🚀 Rocketing into React 19", key_points=["Intro"])
    ]

    mock_usage = UsageMetadata(
        provider="gemini",
        model="gemini-3.8-flash",
        operation="perspective_analysis",
        input_tokens=250,
        output_tokens=180,
        estimated_cost=0.0
    )

    mock_provider = MagicMock()
    mock_provider.provider_name = "gemini"
    mock_provider.generate_structured = AsyncMock(return_value=(mock_output, mock_usage))
    monkeypatch.setattr(analyst, "provider", mock_provider)
    monkeypatch.setattr(analyst.usage_repo, "log_usage", AsyncMock())

    result, usage = await analyst.analyze(
        transcript="I refactored checkout forms with React 19."
    )

    # Title must be <= 70 chars
    assert len(result.proposed_title) <= 70
    assert result.proposed_title.endswith("...")

    # Heading must not have emojis
    assert "🚀" not in result.proposed_outline[0].heading
    assert "Rocketing into React 19" in result.proposed_outline[0].heading


@pytest.mark.asyncio
async def test_stage_handler_advances_to_research_when_no_clarification(monkeypatch):
    """Test that when transcript is clear, claims are inserted into DB,
    job advances to research, and author receives milestone notification.
    """
    job_id = uuid4()
    conv_id = uuid4()
    user_id = 5435882029

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        status="processing",
        current_stage="perspective_analysis"
    )

    mock_conv = Conversation(id=conv_id, telegram_user_id=user_id)
    mock_session = InputSession(
        conversation_id=conv_id,
        input_type="voice",
        original_transcript="Clear explanation of React 19 actions."
    )
    mock_output = _create_sample_perspective_output(has_clarification=False)

    monkeypatch.setattr("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv))
    monkeypatch.setattr("app.ai.agents.stage_handlers.session_repo.get_latest_session", AsyncMock(return_value=mock_session))
    monkeypatch.setattr(
        "app.ai.agents.stage_handlers.perspective_analyst.analyze",
        AsyncMock(return_value=(mock_output, MagicMock()))
    )

    mock_insert_claims = AsyncMock()
    mock_advance_stage = AsyncMock()
    mock_notify = AsyncMock()

    monkeypatch.setattr("app.ai.agents.stage_handlers.claim_repo.insert_claims", mock_insert_claims)
    monkeypatch.setattr("app.ai.agents.stage_handlers.job_queue.advance_stage", mock_advance_stage)
    monkeypatch.setattr("app.ai.agents.stage_handlers.bot_client.send_message", mock_notify)

    await handle_perspective_analysis_stage(job)

    # 1. Claims inserted into DB
    mock_insert_claims.assert_called_once()
    claims_arg = mock_insert_claims.call_args[0][1]
    assert len(claims_arg) == 3

    # 2. Stage advanced to research
    mock_advance_stage.assert_called_once()
    assert mock_advance_stage.call_args[1]["next_stage"] == "research"

    # 3. Author notified
    mock_notify.assert_called_once()
    _, kwargs = mock_notify.call_args
    assert "Perspective Analysis Complete" in kwargs["text"]
    assert kwargs["chat_id"] == user_id


@pytest.mark.asyncio
async def test_stage_handler_pauses_for_clarification_questions(monkeypatch):
    """Test that ambiguous transcripts trigger clarification questions to Telegram
    and pause the job without advancing to research.
    """
    job_id = uuid4()
    conv_id = uuid4()
    user_id = 5435882029

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        status="processing",
        current_stage="perspective_analysis"
    )

    mock_conv = Conversation(id=conv_id, telegram_user_id=user_id)
    mock_session = InputSession(
        conversation_id=conv_id,
        input_type="voice",
        original_transcript="Ambiguous recording about migrations."
    )
    mock_output = _create_sample_perspective_output(has_clarification=True)

    monkeypatch.setattr("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv))
    monkeypatch.setattr("app.ai.agents.stage_handlers.session_repo.get_latest_session", AsyncMock(return_value=mock_session))
    monkeypatch.setattr(
        "app.ai.agents.stage_handlers.perspective_analyst.analyze",
        AsyncMock(return_value=(mock_output, MagicMock()))
    )

    mock_pause = AsyncMock()
    mock_advance = AsyncMock()
    mock_notify = AsyncMock()

    monkeypatch.setattr("app.ai.agents.stage_handlers.job_queue.pause_for_user_action", mock_pause)
    monkeypatch.setattr("app.ai.agents.stage_handlers.job_queue.advance_stage", mock_advance)
    monkeypatch.setattr("app.ai.agents.stage_handlers.bot_client.send_message", mock_notify)

    await handle_perspective_analysis_stage(job)

    # 1. Author receives questions
    mock_notify.assert_called_once()
    _, kwargs = mock_notify.call_args
    assert "Clarification Questions" in kwargs["text"]
    assert "Did your checkout migration involve React Server Components" in kwargs["text"]

    # 2. Job paused in awaiting_clarification
    mock_pause.assert_called_once()
    assert mock_pause.call_args[1]["status"] == "awaiting_clarification"

    # 3. Must NOT advance to research
    mock_advance.assert_not_called()


@pytest.mark.asyncio
async def test_author_answering_clarification_resumes_pipeline(monkeypatch):
    """Test that author text replies while in awaiting_clarification save the answer
    and resume the background worker.
    """
    user_id = 5435882029
    conv_id = uuid4()
    job_id = uuid4()

    mock_conv = Conversation(
        id=conv_id,
        telegram_user_id=user_id,
        current_stage="awaiting_clarification"
    )
    mock_session = InputSession(
        conversation_id=conv_id,
        input_type="voice",
        original_transcript="Original spoken text"
    )
    mock_job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        status="awaiting_clarification"
    )

    monkeypatch.setattr(
        "app.telegram.handlers.session_manager.get_or_create_active_conversation",
        AsyncMock(return_value=mock_conv)
    )
    monkeypatch.setattr(
        "app.telegram.handlers.session_repo.get_latest_session",
        AsyncMock(return_value=mock_session)
    )
    monkeypatch.setattr(
        "app.telegram.handlers.job_repo.get_active_job_for_conversation",
        AsyncMock(return_value=mock_job)
    )

    mock_confirm_transcript = AsyncMock()
    mock_set_stage = AsyncMock()
    mock_set_status = AsyncMock()
    mock_notify = AsyncMock()
    mock_run_worker = AsyncMock()

    monkeypatch.setattr("app.telegram.handlers.session_repo.confirm_transcript", mock_confirm_transcript)
    monkeypatch.setattr("app.telegram.handlers.session_manager.set_conversation_stage", mock_set_stage)
    monkeypatch.setattr("app.telegram.handlers.job_repo.set_job_status", mock_set_status)
    monkeypatch.setattr("app.telegram.handlers.bot_client.send_message", mock_notify)
    monkeypatch.setattr("app.workers.job_processor.job_processor.run_worker_cycle", mock_run_worker)

    await _handle_text_input(
        chat_id=user_id,
        user_id=user_id,
        text="It was purely client components with Next.js App Router."
    )

    # 1. Enriched transcript saved
    mock_confirm_transcript.assert_called_once()
    saved_text = mock_confirm_transcript.call_args[1]["corrected_text"]
    assert "Original spoken text" in saved_text
    assert "[Author Clarification]: It was purely client components" in saved_text

    # 2. Job re-queued
    mock_set_status.assert_called_once_with(job_id, "queued")

    # 3. Author confirmed
    mock_notify.assert_called_once()
    assert "Clarification Received" in mock_notify.call_args[1]["text"]
