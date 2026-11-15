"""Repository for managing voice and text input sessions.
Enforces the mandatory two-stage confirmation gates:
  1. Audio confirmation before transcription
  2. Transcript confirmation before multi-agent execution
"""
import logging
from typing import Optional
from uuid import UUID
from app.schemas.database import InputSession, InputType
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class InputSessionRepository(BaseRepository):
    def __init__(self):
        super().__init__("input_sessions")

    async def create_session(
        self,
        conversation_id: UUID | str,
        input_type: InputType,
        telegram_file_id: Optional[str] = None,
        telegram_message_id: Optional[int] = None,
        initial_text: Optional[str] = None
    ) -> InputSession:
        """Creates a pending input session.
        For voice: audio_status='pending', transcript_status='pending'.
        For text: audio_status='confirmed', transcript_status='pending', original_transcript=text.
        """
        payload = {
            "conversation_id": self._uuid_str(conversation_id),
            "input_type": input_type,
            "telegram_file_id": telegram_file_id,
            "telegram_message_id": telegram_message_id,
            "audio_status": "confirmed" if input_type == "text" else "pending",
            "transcript_status": "pending",
            "original_transcript": initial_text if input_type == "text" else None
        }

        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to create input_session for conversation: {conversation_id}")

        logger.info(f"Created input session {response.data[0]['id']} (type={input_type})")
        return InputSession.model_validate(response.data[0])

    async def get_by_id(self, session_id: UUID | str) -> Optional[InputSession]:
        """Fetch input session by ID."""
        response = self._table().select("*").eq("id", self._uuid_str(session_id)).execute()
        if response.data and len(response.data) > 0:
            return InputSession.model_validate(response.data[0])
        return None

    async def get_latest_session(self, conversation_id: UUID | str) -> Optional[InputSession]:
        """Fetch the most recent input session for a conversation."""
        response = (
            self._table()
            .select("*")
            .eq("conversation_id", self._uuid_str(conversation_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return InputSession.model_validate(response.data[0])
        return None

    async def confirm_audio(self, session_id: UUID | str) -> Optional[InputSession]:
        """Gate 1: Author confirms voice audio is accurate and ready for transcription."""
        response = (
            self._table()
            .update({"audio_status": "confirmed"})
            .eq("id", self._uuid_str(session_id))
            .eq("audio_status", "pending")  # Idempotency check
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Gate 1 Passed: Audio confirmed for session {session_id}")
            return InputSession.model_validate(response.data[0])
        return None

    async def save_transcription(
        self,
        session_id: UUID | str,
        transcript_text: str
    ) -> Optional[InputSession]:
        """Save the transcribed text and present it for Gate 2 review."""
        response = (
            self._table()
            .update({
                "original_transcript": transcript_text.strip(),
                "transcript_status": "pending"
            })
            .eq("id", self._uuid_str(session_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return InputSession.model_validate(response.data[0])
        return None

    async def confirm_transcript(
        self,
        session_id: UUID | str,
        corrected_text: Optional[str] = None
    ) -> Optional[InputSession]:
        """Gate 2: Author confirms transcript (with optional manual corrections).
        Multi-agent AI processing can only start after this status is confirmed!
        """
        payload = {"transcript_status": "confirmed"}
        if corrected_text:
            payload["corrected_transcript"] = corrected_text.strip()

        response = (
            self._table()
            .update(payload)
            .eq("id", self._uuid_str(session_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Gate 2 Passed: Transcript confirmed for session {session_id}")
            return InputSession.model_validate(response.data[0])
        return None

    async def mark_superseded(self, session_id: UUID | str) -> None:
        """Mark audio as superseded when user selects 'Re-record'."""
        self._table().update({
            "audio_status": "superseded",
            "transcript_status": "cancelled"
        }).eq("id", self._uuid_str(session_id)).execute()

    async def cancel_session(self, session_id: UUID | str) -> None:
        """Mark session cancelled when user clicks 'Cancel'."""
        self._table().update({
            "audio_status": "cancelled",
            "transcript_status": "cancelled"
        }).eq("id", self._uuid_str(session_id)).execute()

