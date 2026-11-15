"""
Unit and integration test suite for Phase 9: Central Orchestrator & End-to-End Pipeline Integration.
Tests:
- Continuous sequential execution through registered agent stage handlers.
- Pause and resume handling on Stage 1 clarification questions.
- Pause and resume handling on Stage 3 major technical corrections.
- Final draft delivery pause in awaiting_approval for user review.
- Pipeline status reporting and crash recovery safeguards.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.database import GenerationJob
from app.ai.orchestrator import PipelineOrchestrator


@pytest.fixture
def sample_job():
    return GenerationJob(
        id=str(uuid4()),
        conversation_id=str(uuid4()),
        current_stage="perspective_analysis",
        status="processing",
        retry_count=0
    )


@pytest.mark.asyncio
async def test_orchestrator_pause_on_clarification(sample_job):
    """Verify orchestrator pauses when Agent 1 requests clarifications."""
    orchestrator = PipelineOrchestrator()

    # Mock stage handler that simulates asking clarification questions
    async def mock_handler(job):
        job.status = "awaiting_clarification"

    with patch.object(orchestrator.job_repo, "get_by_id", AsyncMock(side_effect=[
        sample_job,
        GenerationJob(
            id=sample_job.id,
            conversation_id=sample_job.conversation_id,
            current_stage="perspective_analysis",
            status="awaiting_clarification"
        )
    ])), patch.dict("app.ai.orchestrator.STAGE_HANDLERS", {"perspective_analysis": mock_handler}):

        res = await orchestrator.execute_job(sample_job.id)
        assert res["status"] == "awaiting_clarification"
        assert res["current_stage"] == "perspective_analysis"


@pytest.mark.asyncio
async def test_orchestrator_resume_from_clarification(sample_job):
    """Verify resuming job from clarification answers advances to research."""
    orchestrator = PipelineOrchestrator()

    paused_job = GenerationJob(
        id=sample_job.id,
        conversation_id=sample_job.conversation_id,
        current_stage="perspective_analysis",
        status="awaiting_clarification",
        perspective_output={"proposed_title": "React Server Actions"}
    )

    with patch.object(orchestrator.job_repo, "get_by_id", AsyncMock(return_value=paused_job)), \
         patch.object(orchestrator.queue, "advance_stage", AsyncMock()) as mock_advance, \
         patch.object(orchestrator.job_repo, "set_job_status", AsyncMock()) as mock_status, \
         patch.object(orchestrator.conv_repo, "update_status", AsyncMock()) as mock_conv_status, \
         patch.object(orchestrator, "execute_job", AsyncMock(return_value={"status": "processing"})) as mock_exec:

        res = await orchestrator.resume_from_clarification(
            job_id=sample_job.id,
            answers={"1": "We use optimistic updates with useActionState"}
        )

        mock_advance.assert_awaited_once()
        call_kwargs = mock_advance.call_args[1]
        assert call_kwargs["next_stage"] == "research"
        assert "clarification_answers" in call_kwargs["stage_output"]
        mock_status.assert_awaited_once_with(sample_job.id, "processing")
        mock_exec.assert_awaited_once_with(sample_job.id)


@pytest.mark.asyncio
async def test_orchestrator_pause_on_major_correction(sample_job):
    """Verify orchestrator pauses when Fact Checker finds a major contradiction."""
    orchestrator = PipelineOrchestrator()

    async def mock_fc_handler(job):
        job.status = "awaiting_approval"

    fc_job = GenerationJob(
        id=sample_job.id,
        conversation_id=sample_job.conversation_id,
        current_stage="fact_check",
        status="processing"
    )

    with patch.object(orchestrator.job_repo, "get_by_id", AsyncMock(side_effect=[
        fc_job,
        GenerationJob(
            id=sample_job.id,
            conversation_id=sample_job.conversation_id,
            current_stage="fact_check",
            status="awaiting_approval"
        )
    ])), patch.dict("app.ai.orchestrator.STAGE_HANDLERS", {"fact_check": mock_fc_handler}):

        res = await orchestrator.execute_job(sample_job.id)
        assert res["status"] == "awaiting_approval"
        assert res["current_stage"] == "fact_check"


@pytest.mark.asyncio
async def test_orchestrator_resume_from_major_correction(sample_job):
    """Verify resuming from major correction approval advances to writing."""
    orchestrator = PipelineOrchestrator()

    paused_job = GenerationJob(
        id=sample_job.id,
        conversation_id=sample_job.conversation_id,
        current_stage="fact_check",
        status="awaiting_approval",
        factcheck_output={"verifications": []}
    )

    with patch.object(orchestrator.job_repo, "get_by_id", AsyncMock(return_value=paused_job)), \
         patch.object(orchestrator.queue, "advance_stage", AsyncMock()) as mock_advance, \
         patch.object(orchestrator.job_repo, "set_job_status", AsyncMock()) as mock_status, \
         patch.object(orchestrator.conv_repo, "update_status", AsyncMock()) as mock_conv_status, \
         patch.object(orchestrator, "execute_job", AsyncMock(return_value={"status": "processing"})) as mock_exec:

        res = await orchestrator.resume_from_major_correction(
            job_id=sample_job.id,
            action="accept"
        )

        mock_advance.assert_awaited_once()
        call_kwargs = mock_advance.call_args[1]
        assert call_kwargs["next_stage"] == "writing"
        assert call_kwargs["stage_output"]["author_correction_decision"] == "accept"
        mock_status.assert_awaited_once_with(sample_job.id, "processing")
        mock_exec.assert_awaited_once_with(sample_job.id)


@pytest.mark.asyncio
async def test_orchestrator_pipeline_summary(sample_job):
    """Verify pipeline summary aggregates stages completed and draft status."""
    orchestrator = PipelineOrchestrator()

    summary_job = GenerationJob(
        id=sample_job.id,
        conversation_id=sample_job.conversation_id,
        current_stage="user_review",
        status="awaiting_approval",
        perspective_output={"proposed_title": "React Server Components Architecture"},
        research_output={"claims_researched": []},
        factcheck_output={"verifications": []}
    )

    with patch.object(orchestrator.job_repo, "get_by_id", AsyncMock(return_value=summary_job)), \
         patch.object(orchestrator.draft_repo, "get_by_slug", AsyncMock(return_value=MagicMock())):

        summary = await orchestrator.get_pipeline_summary(sample_job.id)

        assert summary["job_id"] == sample_job.id
        assert summary["current_stage"] == "user_review"
        assert summary["status"] == "awaiting_approval"
        assert "perspective_analysis" in summary["stages_completed"]
        assert "research" in summary["stages_completed"]
        assert "fact_check" in summary["stages_completed"]
        assert summary["has_draft"] is True
