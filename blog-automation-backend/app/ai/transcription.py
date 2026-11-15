"""Audio Transcription Service for DevScrolls Blog Automation.
Orchestrates voice note retrieval from Telegram, multimodal transcription via Gemini,
and token/cost telemetry logging into Supabase.
"""
import logging
from pathlib import Path
from typing import Optional
from uuid import UUID

from app.ai.factory import get_ai_provider
from app.ai.provider_interface import TranscriptionResult, UsageMetadata
from app.storage.repositories import UsageRepository
from app.telegram.bot_client import bot_client

logger = logging.getLogger(__name__)
usage_repo = UsageRepository()

# Map common Telegram audio file extensions to MIME types supported by Gemini
MIME_TYPE_MAP = {
    ".oga": "audio/ogg",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".mp3": "audio/mp3",
    ".wav": "audio/wav",
    ".m4a": "audio/m4a",
    ".mp4": "audio/mp4",
}

class TranscriptionService:
    """Service handling audio downloads and AI transcription."""

    def __init__(self):
        self.provider = get_ai_provider("gemini")

    async def transcribe_telegram_voice(
        self,
        file_id: str,
        job_id: Optional[UUID | str] = None
    ) -> tuple[str, UsageMetadata]:
        """Downloads audio file from Telegram Bot API and transcribes it using Gemini.

        Args:
            file_id: The Telegram file_id of the voice/audio message.
            job_id: Optional job UUID for telemetry tracking.

        Returns:
            tuple of (transcribed_text, usage_metadata)
        """
        logger.info(f"Retrieving file path for Telegram file_id: {file_id}")
        file_path = await bot_client.get_file_path(file_id)
        if not file_path:
            raise RuntimeError(f"Could not retrieve file path from Telegram for file_id: {file_id}")

        # Determine MIME type based on file extension
        ext = Path(file_path).suffix.lower()
        mime_type = MIME_TYPE_MAP.get(ext, "audio/ogg")
        logger.info(f"Downloading voice file from Telegram: {file_path} (detected MIME: {mime_type})")

        audio_bytes = await bot_client.download_file(file_path)
        if not audio_bytes:
            raise RuntimeError(f"Downloaded empty audio payload from Telegram for {file_path}")

        logger.info(f"Downloaded {len(audio_bytes)} bytes. Calling Gemini multimodal transcription...")

        # Execute transcription via Gemini provider
        transcription_result, usage = await self.provider.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=mime_type
        )

        logger.info(
            f"Transcription succeeded! Tokens: in={usage.input_tokens}, out={usage.output_tokens}. "
            f"Length: {len(transcription_result.text)} chars."
        )

        # Log usage to Supabase telemetry ledger
        try:
            await usage_repo.log_usage(
                provider="gemini",
                model=usage.model,
                operation="transcription",
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                search_credits=0,
                estimated_cost=0.0,
                job_id=job_id
            )
        except Exception as e:
            logger.warning(f"Could not record usage telemetry in Supabase: {e}")

        return transcription_result.text, usage


transcription_service = TranscriptionService()
