"""Unit tests for repository data access logic with mocked Supabase queries.
Validates state machine transitions, authorization checks, and two-stage gates.
"""
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from app.storage.repositories.user_repo import UserRepository
from app.storage.repositories.input_session_repo import InputSessionRepository
from app.storage.repositories.job_repo import JobRepository

@pytest.mark.asyncio
async def test_user_repository_is_authorized_from_settings(monkeypatch):
    monkeypatch.setattr("app.config.settings.settings.AUTHORIZED_TELEGRAM_USER_IDS", [999888777])
    repo = UserRepository()
    assert await repo.is_authorized(999888777) is True
    # For non-allowlisted users with no DB connection, should not error, returns False or queries DB
    monkeypatch.setattr("app.config.settings.settings.AUTHORIZED_TELEGRAM_USER_IDS", [])
    # Mock DB response
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    monkeypatch.setattr(repo, "_table", lambda: mock_table)
    assert await repo.is_authorized(111222333) is False

@pytest.mark.asyncio
async def test_input_session_two_stage_gate_flow(monkeypatch):
    repo = InputSessionRepository()
    session_id = str(uuid4())
    conv_id = str(uuid4())

    mock_table = MagicMock()
    monkeypatch.setattr(repo, "_table", lambda: mock_table)

    # 1. Test Gate 1 (Audio confirmation)
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": session_id,
            "conversation_id": conv_id,
            "input_type": "voice",
            "audio_status": "confirmed",
            "transcript_status": "pending",
            "original_transcript": None,
            "corrected_transcript": None,
            "created_at": "2026-11-11T12:00:00Z"
        }]
    )

    confirmed_audio = await repo.confirm_audio(session_id)
    assert confirmed_audio is not None
    assert confirmed_audio.audio_status == "confirmed"
    assert confirmed_audio.transcript_status == "pending"

    # 2. Test Gate 2 (Transcript confirmation with edits)
    mock_table.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": session_id,
            "conversation_id": conv_id,
            "input_type": "voice",
            "audio_status": "confirmed",
            "transcript_status": "confirmed",
            "original_transcript": "Spoken text",
            "corrected_transcript": "Corrected spoken text",
            "created_at": "2026-11-11T12:00:00Z"
        }]
    )

    confirmed_transcript = await repo.confirm_transcript(session_id, "Corrected spoken text")
    assert confirmed_transcript is not None
    assert confirmed_transcript.transcript_status == "confirmed"
    assert confirmed_transcript.effective_transcript == "Corrected spoken text"

@pytest.mark.asyncio
async def test_job_repository_enqueue(monkeypatch):
    repo = JobRepository()
    conv_id = str(uuid4())
    job_id = str(uuid4())

    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = MagicMock(
        data=[{
            "id": job_id,
            "conversation_id": conv_id,
            "status": "queued",
            "current_stage": "perspective_analysis",
            "retry_count": 0,
            "created_at": "2026-11-11T12:00:00Z",
            "updated_at": "2026-11-11T12:00:00Z"
        }]
    )
    monkeypatch.setattr(repo, "_table", lambda: mock_table)

    job = await repo.create_job(conv_id)
    assert job.status == "queued"
    assert job.current_stage == "perspective_analysis"
    assert str(job.id) == job_id

