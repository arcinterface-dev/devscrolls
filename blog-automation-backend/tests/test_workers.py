"""Tests for Phase 4: Background Job Queue, Worker Processor & Crash Recovery.
Validates queue claiming, crash recovery (Render sleep resilience), stage progression,
and internal worker API security.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
import pytest
from httpx import ASGITransport, AsyncClient

from app.config.limits import MAX_GENERATION_ATTEMPTS
from app.main import app
from app.schemas.database import Conversation, GenerationJob
from app.workers.job_processor import JobProcessor, register_stage_handler
from app.workers.job_queue import JobQueue
from app.workers.recovery import run_startup_recovery

@pytest.mark.asyncio
async def test_job_queue_advance_stage(monkeypatch):
    """Test that advance_stage saves output and updates current_stage."""
    queue = JobQueue()
    job_id = uuid4()

    mock_update = AsyncMock(return_value=GenerationJob(
        id=job_id,
        conversation_id=uuid4(),
        status="processing",
        current_stage="research",
        perspective_output={"claims": ["test claim"]}
    ))
    monkeypatch.setattr(queue.job_repo, "update_stage_output", mock_update)

    result = await queue.advance_stage(
        job_id=job_id,
        completed_stage="perspective_analysis",
        next_stage="research",
        stage_output={"claims": ["test claim"]}
    )

    assert result is not None
    assert result.current_stage == "research"
    assert mock_update.call_count == 2


@pytest.mark.asyncio
async def test_startup_recovery_resets_stale_processing_jobs(monkeypatch):
    """Test that jobs abandoned mid-processing (e.g. Render restart) are recovered
    to 'queued' status while preserving their current_stage and intermediate outputs.
    """
    queue = JobQueue()
    job_id = uuid4()
    stale_time = (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()

    stale_job_row = {
        "id": str(job_id),
        "conversation_id": str(uuid4()),
        "status": "processing",
        "current_stage": "research",
        "perspective_output": {"topic": "React 19"},
        "claimed_at": stale_time,
        "retry_count": 0,
        "created_at": stale_time,
        "updated_at": stale_time
    }

    # Mock select response returning the stale job
    mock_select = MagicMock()
    mock_select.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[stale_job_row])
    monkeypatch.setattr(queue.job_repo, "_table", lambda: mock_select)

    # Mock update response setting it back to queued
    recovered_row = dict(stale_job_row)
    recovered_row["status"] = "queued"
    recovered_row["claimed_at"] = None
    mock_select.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[recovered_row])

    # Execute recovery
    recovered_jobs = await run_startup_recovery(timeout_minutes=30)

    assert len(recovered_jobs) == 1
    assert recovered_jobs[0].status == "queued"
    assert recovered_jobs[0].current_stage == "research"  # Stage preserved!
    assert recovered_jobs[0].perspective_output == {"topic": "React 19"}  # Intermediate data preserved!


@pytest.mark.asyncio
async def test_job_processor_advances_default_stages_and_notifies(monkeypatch):
    """Test that job processor executes stages and sends progress notices to Telegram."""
    processor = JobProcessor()
    job_id = uuid4()
    conv_id = uuid4()
    user_id = 999888

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        status="processing",
        current_stage="perspective_analysis"
    )

    # Mock user and conversation lookup
    monkeypatch.setattr(
        processor.conv_repo,
        "get_by_id",
        AsyncMock(return_value=Conversation(id=conv_id, telegram_user_id=user_id))
    )

    # Mock bot client message notification
    mock_notify = AsyncMock()
    monkeypatch.setattr("app.workers.job_processor.bot_client.send_message", mock_notify)

    # Mock advance_stage
    mock_advance = AsyncMock()
    monkeypatch.setattr(processor.queue, "advance_stage", mock_advance)

    success = await processor.process_single_job(job)

    assert success is True
    # Verify Telegram notification was sent
    mock_notify.assert_called_once()
    _, kwargs = mock_notify.call_args
    assert "Perspective Analysis" in kwargs["text"]
    assert kwargs["chat_id"] == user_id

    # Verify stage was advanced to research
    mock_advance.assert_called_once_with(
        job_id=job_id,
        completed_stage="perspective_analysis",
        next_stage="research",
        stage_output={"status": "stage_initialized", "claims_count": 0}
    )


@pytest.mark.asyncio
async def test_job_processor_retries_on_failure(monkeypatch):
    """Test that a failing stage increments retry_count and resets to queued."""
    processor = JobProcessor()
    job_id = uuid4()
    conv_id = uuid4()

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        status="processing",
        current_stage="perspective_analysis",
        retry_count=0
    )

    # Register failing stage handler
    async def failing_handler(j):
        raise ValueError("Network timeout connecting to external API")

    register_stage_handler("perspective_analysis", failing_handler)

    mock_table = MagicMock()
    monkeypatch.setattr(processor.queue.job_repo, "_table", lambda: mock_table)

    success = await processor.process_single_job(job)

    assert success is False
    # Verify update was called to reset to queued with retry_count=1
    mock_table.update.assert_called_once()
    update_data = mock_table.update.call_args[0][0]
    assert update_data["status"] == "queued"
    assert update_data["retry_count"] == 1
    assert "Network timeout" in update_data["error_message"]


@pytest.mark.asyncio
async def test_internal_worker_api_security(monkeypatch):
    """Test that POST /internal/worker/process enforces X-Internal-Secret header."""
    monkeypatch.setattr("app.config.settings.settings.INTERNAL_API_SECRET", "super-internal-key-999")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Invalid secret -> 403 Forbidden
        res_bad = await client.post(
            "/internal/worker/process",
            headers={"x-internal-secret": "wrong-key"}
        )
        assert res_bad.status_code == 403

        # 2. Valid secret -> 200 OK
        res_good = await client.post(
            "/internal/worker/process",
            headers={"x-internal-secret": "super-internal-key-999"}
        )
        assert res_good.status_code == 200
        data = res_good.json()
        assert data["status"] == "triggered"
