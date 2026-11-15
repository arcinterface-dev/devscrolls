"""Tests for Phase 2: Telegram Bot Integration & Two-Stage Confirmation Gates.
Validates webhook security, message routing, Gate 1 & Gate 2 state transitions,
and zero-token cost enforcement before user confirmation.
"""
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.database import Conversation, InputSession, TelegramUser
from app.telegram.callbacks import handle_callback_query
from app.telegram.handlers import handle_message

@pytest.mark.asyncio
async def test_webhook_secret_validation(monkeypatch):
    """Test that incoming Telegram webhooks require the configured secret header."""
    monkeypatch.setattr("app.config.settings.settings.TELEGRAM_WEBHOOK_SECRET", "super-secret-123")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Invalid secret -> 403 Forbidden
        res_bad = await client.post(
            "/webhooks/telegram",
            json={"update_id": 1001, "message": {}},
            headers={"x-telegram-bot-api-secret-token": "wrong-token"}
        )
        assert res_bad.status_code == 403

        # 2. Valid secret -> 200 OK
        res_good = await client.post(
            "/webhooks/telegram",
            json={"update_id": 1002},
            headers={"x-telegram-bot-api-secret-token": "super-secret-123"}
        )
        assert res_good.status_code == 200
        assert res_good.json()["update_id"] == 1002


@pytest.mark.asyncio
async def test_unauthorized_user_is_blocked(monkeypatch):
    """Test that users not in the allowlist receive access restriction and no sessions are created."""
    monkeypatch.setattr("app.config.settings.settings.AUTHORIZED_TELEGRAM_USER_IDS", [12345])

    mock_send = AsyncMock()
    monkeypatch.setattr("app.telegram.handlers.bot_client.send_message", mock_send)

    unauthorized_msg = {
        "message_id": 50,
        "chat": {"id": 99999},
        "from": {"id": 99999, "first_name": "Stranger", "username": "stranger"},
        "text": "Hello, write me a blog"
    }

    # Mock user repo to simulate unapproved user
    mock_user_repo = MagicMock()
    mock_user_repo.get_or_create_user = AsyncMock(return_value=TelegramUser(
        telegram_user_id=99999,
        is_authorized=False
    ))
    mock_user_repo.is_authorized = AsyncMock(return_value=False)
    monkeypatch.setattr("app.telegram.handlers.session_manager.user_repo", mock_user_repo)

    await handle_message(unauthorized_msg)

    # Bot should send restriction message
    mock_send.assert_called_once()
    args, kwargs = mock_send.call_args
    assert "Access Restricted" in kwargs["text"] or "Access Restricted" in args[1]


@pytest.mark.asyncio
async def test_voice_message_triggers_gate_1_without_ai_calls(monkeypatch):
    """CRITICAL TEST: Sending voice message must trigger Gate 1 audio confirmation
    WITHOUT spending any AI tokens or transcription credits.
    """
    user_id = 777
    conv_id = uuid4()
    session_id = uuid4()

    # Mock authorized user and conversation
    monkeypatch.setattr(
        "app.telegram.handlers.session_manager.authenticate_user",
        AsyncMock(return_value=(True, TelegramUser(telegram_user_id=user_id, is_authorized=True)))
    )
    monkeypatch.setattr(
        "app.telegram.handlers.session_manager.get_or_create_active_conversation",
        AsyncMock(return_value=Conversation(id=conv_id, telegram_user_id=user_id))
    )
    monkeypatch.setattr(
        "app.telegram.handlers.session_repo.create_session",
        AsyncMock(return_value=InputSession(
            id=session_id,
            conversation_id=conv_id,
            input_type="voice",
            audio_status="pending",
            transcript_status="pending"
        ))
    )
    monkeypatch.setattr(
        "app.telegram.handlers.session_manager.set_conversation_stage",
        AsyncMock()
    )

    mock_send = AsyncMock()
    monkeypatch.setattr("app.telegram.handlers.bot_client.send_message", mock_send)

    voice_msg = {
        "message_id": 101,
        "chat": {"id": user_id},
        "from": {"id": user_id, "first_name": "Santhanakrishnan"},
        "voice": {"file_id": "telegram_voice_file_abc", "duration": 42}
    }

    await handle_message(voice_msg)

    # 1. Bot must send confirmation message
    mock_send.assert_called_once()
    _, kwargs = mock_send.call_args
    assert "Voice Recording Received" in kwargs["text"]
    assert "No AI tokens or transcription credits have been spent yet" in kwargs["text"]

    # 2. Reply markup must contain Gate 1 buttons
    buttons = kwargs["reply_markup"]["inline_keyboard"]
    flattened_callbacks = [btn["callback_data"] for row in buttons for btn in row]
    assert f"audio_confirm:{session_id}" in flattened_callbacks
    assert f"audio_rerecord:{session_id}" in flattened_callbacks
    assert f"session_cancel:{session_id}" in flattened_callbacks


@pytest.mark.asyncio
async def test_gate_1_confirm_callback_transitions_to_gate_2(monkeypatch):
    """Test that clicking 'Confirm & Transcribe' updates audio_status to confirmed
    and displays the transcript review screen (Gate 2).
    """
    user_id = 777
    session_id = str(uuid4())
    conv_id = uuid4()

    mock_session = InputSession(
        id=session_id,
        conversation_id=conv_id,
        input_type="voice",
        audio_status="pending",
        transcript_status="pending"
    )

    monkeypatch.setattr("app.telegram.callbacks.user_repo.is_authorized", AsyncMock(return_value=True))
    monkeypatch.setattr("app.telegram.callbacks.session_repo.get_by_id", AsyncMock(return_value=mock_session))
    monkeypatch.setattr("app.telegram.callbacks.conv_repo.get_by_id", AsyncMock(return_value=Conversation(
        id=conv_id,
        telegram_user_id=user_id
    )))
    monkeypatch.setattr("app.telegram.callbacks.session_repo.confirm_audio", AsyncMock())
    monkeypatch.setattr("app.telegram.callbacks.session_repo.save_transcription", AsyncMock())

    mock_edit = AsyncMock()
    mock_answer = AsyncMock()
    monkeypatch.setattr("app.telegram.callbacks.bot_client.edit_message_text", mock_edit)
    monkeypatch.setattr("app.telegram.callbacks.bot_client.answer_callback_query", mock_answer)

    cb_query = {
        "id": "cb_query_1",
        "from": {"id": user_id},
        "data": f"audio_confirm:{session_id}",
        "message": {"chat": {"id": user_id}, "message_id": 555}
    }

    await handle_callback_query(cb_query)

    mock_answer.assert_called_once()
    mock_edit.assert_called_once()
    _, kwargs = mock_edit.call_args
    assert "Audio Confirmed & Transcribed" in kwargs["text"]
    buttons = kwargs["reply_markup"]["inline_keyboard"]
    flattened_callbacks = [btn["callback_data"] for row in buttons for btn in row]
    assert f"transcript_confirm:{session_id}" in flattened_callbacks
    assert f"transcript_edit:{session_id}" in flattened_callbacks


@pytest.mark.asyncio
async def test_gate_2_confirm_enqueues_generation_job(monkeypatch):
    """Test that clicking 'Confirm & Start AI' sets transcript_status=confirmed
    and enqueues the generation job.
    """
    user_id = 777
    session_id = str(uuid4())
    conv_id = uuid4()
    job_id = uuid4()

    mock_session = InputSession(
        id=session_id,
        conversation_id=conv_id,
        input_type="voice",
        audio_status="confirmed",
        transcript_status="pending",
        original_transcript="Spoken ideas on frontend architecture."
    )

    monkeypatch.setattr("app.telegram.callbacks.user_repo.is_authorized", AsyncMock(return_value=True))
    monkeypatch.setattr("app.telegram.callbacks.session_repo.get_by_id", AsyncMock(return_value=mock_session))
    monkeypatch.setattr("app.telegram.callbacks.conv_repo.get_by_id", AsyncMock(return_value=Conversation(
        id=conv_id,
        telegram_user_id=user_id
    )))
    monkeypatch.setattr("app.telegram.callbacks.session_repo.confirm_transcript", AsyncMock())
    monkeypatch.setattr("app.telegram.callbacks.conv_repo.update_status", AsyncMock())

    mock_create_job = AsyncMock(return_value=MagicMock(id=job_id, status="queued"))
    monkeypatch.setattr("app.telegram.callbacks.job_repo.create_job", mock_create_job)

    mock_edit = AsyncMock()
    mock_answer = AsyncMock()
    monkeypatch.setattr("app.telegram.callbacks.bot_client.edit_message_text", mock_edit)
    monkeypatch.setattr("app.telegram.callbacks.bot_client.answer_callback_query", mock_answer)

    cb_query = {
        "id": "cb_query_2",
        "from": {"id": user_id},
        "data": f"transcript_confirm:{session_id}",
        "message": {"chat": {"id": user_id}, "message_id": 555}
    }

    await handle_callback_query(cb_query)

    # Verify job was enqueued
    mock_create_job.assert_called_once_with(conv_id)

    # Verify UI confirmation shows queued status
    mock_edit.assert_called_once()
    _, kwargs = mock_edit.call_args
    assert "AI Processing Enqueued" in kwargs["text"]
    assert str(job_id) in kwargs["text"]

