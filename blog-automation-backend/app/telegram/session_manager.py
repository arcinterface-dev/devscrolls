"""Session state management for Telegram bot interactions.
Guarantees session isolation, single active conversation per user, and user allowlist verification.
"""
import logging
from typing import Optional, Tuple
from uuid import UUID
from app.config.settings import settings
from app.schemas.database import Conversation, InputSession, TelegramUser
from app.storage.repositories import (
    ConversationRepository,
    InputSessionRepository,
    UserRepository,
)

logger = logging.getLogger(__name__)

class TelegramSessionManager:
    """Manages conversational session lifecycle and state transitions for Telegram users."""

    def __init__(self):
        self.user_repo = UserRepository()
        self.conv_repo = ConversationRepository()
        self.session_repo = InputSessionRepository()

    async def authenticate_user(
        self,
        telegram_user_id: int,
        username: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> Tuple[bool, Optional[TelegramUser]]:
        """Verifies if the Telegram user is authorized.
        Returns (is_authorized, user_record).
        """
        user = await self.user_repo.get_or_create_user(
            telegram_user_id=telegram_user_id,
            username=username,
            display_name=display_name
        )
        is_auth = await self.user_repo.is_authorized(telegram_user_id)
        return is_auth, user

    async def get_or_create_active_conversation(self, telegram_user_id: int) -> Conversation:
        """Retrieves existing active conversation or creates a new one."""
        conv = await self.conv_repo.get_active_conversation(telegram_user_id)
        if not conv:
            conv = await self.conv_repo.create_conversation(telegram_user_id)
        return conv

    async def get_latest_input_session(self, conversation_id: UUID | str) -> Optional[InputSession]:
        """Fetches the latest input session for the conversation."""
        return await self.session_repo.get_latest_session(conversation_id)

    async def cancel_active_conversation(self, telegram_user_id: int) -> bool:
        """Cancels any active conversation and its latest input session."""
        conv = await self.conv_repo.get_active_conversation(telegram_user_id)
        if not conv:
            return False

        # Cancel latest input session if exists
        latest_session = await self.session_repo.get_latest_session(conv.id)
        if latest_session:
            await self.session_repo.cancel_session(latest_session.id)

        await self.conv_repo.update_status(conv.id, "cancelled", "cancelled_by_user")
        logger.info(f"Conversation {conv.id} cancelled by user {telegram_user_id}")
        return True

    async def set_conversation_stage(
        self,
        conversation_id: UUID | str,
        stage: str
    ) -> Optional[Conversation]:
        """Updates the conversation stage (e.g. 'transcript_editing', 'processing')."""
        return await self.conv_repo.update_status(
            conversation_id=conversation_id,
            status="active",
            current_stage=stage
        )


session_manager = TelegramSessionManager()

