"""Tests for Phase 3: Gemini Audio Transcription Service and Telegram Gate 1 integration.
Validates multimodal voice transcription, MIME type detection, token telemetry logging,
and graceful error handling.
"""
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
import pytest

from app.ai.provider_interface import TranscriptionResult, UsageMetadata
from app.ai.transcription import TranscriptionService
from app.schemas.database import Conversation, InputSession
from app.telegram.callbacks import handle_callback_query

@pytest.mark.asyncio
async def test_transcription_service_downloads_and_transcribes(monkeypatch):
    """Test that TranscriptionService retrieves the audio file from Telegram,
    determines the correct MIME type, calls Gemini, and logs usage.
    """
    service = TranscriptionService()
    file_id = "test_voice_file_123"

    # 1. Mock Telegram client get_file_path & download_file
    mock_get_path = AsyncMock(return_value="voice/file_0.oga")
    mock_download = AsyncMock(return_value=b"fake-ogg-audio-binary-data")
    monkeypatch.setattr("app.ai.transcription.bot_client.get_file_path", mock_get_path)
    monkeypatch.setattr("app.ai.transcription.bot_client.download_file", mock_download)

    # 2. Mock GeminiProvider transcribe_audio
    expected_text = "I want to write about React 19 Actions and how useActionState simplifies form handling."
    mock_result = TranscriptionResult(text=expected_text, language="en")
    mock_usage = UsageMetadata(
        provider="gemini",
        model="gemini-3.5-flash-lite",
        operation="transcription",
        input_tokens=85,
        output_tokens=32,
        estimated_cost=0.0
    )
    mock_provider = MagicMock()
    mock_provider.transcribe_audio = AsyncMock(return_value=(mock_result, mock_usage))
    monkeypatch.setattr(service, "provider", mock_provider)

    # 3. Mock UsageRepository.log_usage
    mock_log_usage = AsyncMock()
    monkeypatch.setattr("app.ai.transcription.usage_repo.log_usage", mock_log_usage)

    # Execute service
    text, usage = await service.transcribe_telegram_voice(file_id=file_id, job_id=None)

    # Assertions
    assert text == expected_text
    assert usage.input_tokens == 85
    assert usage.output_tokens == 32

    # Verify MIME type was mapped from .oga to audio/ogg
    mock_provider.transcribe_audio.assert_called_once_with(
        audio_bytes=b"fake-ogg-audio-binary-data",
        mime_type="audio/ogg"
    )

    # Verify telemetry was logged
    mock_log_usage.assert_called_once_with(
        provider="gemini",
        model="gemini-3.5-flash-lite",
        operation="transcription",
        input_tokens=85,
        output_tokens=32,
        search_credits=0,
        estimated_cost=0.0,
        job_id=None
    )


@pytest.mark.asyncio
async def test_transcription_service_handles_empty_download(monkeypatch):
    """Test that downloading an empty audio file raises an informative error."""
    service = TranscriptionService()
    monkeypatch.setattr(
        "app.ai.transcription.bot_client.get_file_path",
        AsyncMock(return_value="voice/empty.oga")
    )
    monkeypatch.setattr(
        "app.ai.transcription.bot_client.download_file",
        AsyncMock(return_value=b"")
    )

    with pytest.raises(RuntimeError, match="Downloaded empty audio payload"):
        await service.transcribe_telegram_voice("empty_file_id")


@pytest.mark.asyncio
async def test_audio_confirm_callback_triggers_real_gemini_transcription(monkeypatch):
    """Test that tapping [Confirm & Transcribe] triggers transcription service,
    saves the real transcript to database, and presents Gate 2 review screen.
    """
    user_id = 777
    session_id = str(uuid4())
    conv_id = uuid4()
    real_text = "Today I learned why useMemo is often overused in small components."

    mock_session = InputSession(
        id=session_id,
        conversation_id=conv_id,
        input_type="voice",
        telegram_file_id="voice_telegram_file_xyz",
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

    # Mock real transcription service
    mock_transcribe = AsyncMock(return_value=(real_text, UsageMetadata(
        provider="gemini",
        model="gemini-3.5-flash-lite",
        operation="transcription",
        input_tokens=40,
        output_tokens=20,
        estimated_cost=0.0
    )))
    monkeypatch.setattr("app.telegram.callbacks.transcription_service.transcribe_telegram_voice", mock_transcribe)

    mock_save = AsyncMock()
    monkeypatch.setattr("app.telegram.callbacks.session_repo.save_transcription", mock_save)

    mock_edit = AsyncMock()
    mock_action = AsyncMock()
    mock_answer = AsyncMock()
    monkeypatch.setattr("app.telegram.callbacks.bot_client.edit_message_text", mock_edit)
    monkeypatch.setattr("app.telegram.callbacks.bot_client.send_chat_action", mock_action)
    monkeypatch.setattr("app.telegram.callbacks.bot_client.answer_callback_query", mock_answer)

    cb_query = {
        "id": "cb_query_voice",
        "from": {"id": user_id},
        "data": f"audio_confirm:{session_id}",
        "message": {"chat": {"id": user_id}, "message_id": 999}
    }

    await handle_callback_query(cb_query)

    # 1. Verify transcription service was called with the file_id
    mock_transcribe.assert_called_once_with(file_id="voice_telegram_file_xyz")

    # 2. Verify transcript was saved into the database
    mock_save.assert_called_once_with(session_id, real_text)

    # 3. Verify final message displays the real transcript
    assert mock_edit.call_count >= 2  # Once for "Transcribing...", once for final Gate 2
    final_call_kwargs = mock_edit.call_args_list[-1][1]
    assert "Audio Transcribed Successfully" in final_call_kwargs["text"]
    assert real_text in final_call_kwargs["text"]
    buttons = final_call_kwargs["reply_markup"]["inline_keyboard"]
    flattened_callbacks = [btn["callback_data"] for row in buttons for btn in row]
    assert f"transcript_confirm:{session_id}" in flattened_callbacks
    assert f"transcript_edit:{session_id}" in flattened_callbacks


@pytest.mark.asyncio
async def test_audio_confirm_handles_gemini_error_cleanly(monkeypatch):
    """Test that if Gemini transcription fails (e.g. rate limit),
    the bot presents an error message without breaking the session.
    """
    user_id = 777
    session_id = str(uuid4())
    conv_id = uuid4()

    mock_session = InputSession(
        id=session_id,
        conversation_id=conv_id,
        input_type="voice",
        telegram_file_id="bad_voice_file",
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

    # Simulate Gemini API error
    mock_transcribe = AsyncMock(side_effect=Exception("Gemini quota rate limit exceeded (429)"))
    monkeypatch.setattr("app.telegram.callbacks.transcription_service.transcribe_telegram_voice", mock_transcribe)

    mock_edit = AsyncMock()
    monkeypatch.setattr("app.telegram.callbacks.bot_client.edit_message_text", mock_edit)
    monkeypatch.setattr("app.telegram.callbacks.bot_client.send_chat_action", AsyncMock())
    monkeypatch.setattr("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock())

    cb_query = {
        "id": "cb_query_error",
        "from": {"id": user_id},
        "data": f"audio_confirm:{session_id}",
        "message": {"chat": {"id": user_id}, "message_id": 999}
    }

    await handle_callback_query(cb_query)

    # Verify bot caught the error and presented recovery options
    final_call_kwargs = mock_edit.call_args_list[-1][1]
    assert "Transcription Failed" in final_call_kwargs["text"]
    assert "Gemini quota rate limit exceeded" in final_call_kwargs["text"]
    # Gate 1 buttons should be restored so user can re-record or retry
    buttons = final_call_kwargs["reply_markup"]["inline_keyboard"]
    flattened_callbacks = [btn["callback_data"] for row in buttons for btn in row]
    assert f"audio_rerecord:{session_id}" in flattened_callbacks
