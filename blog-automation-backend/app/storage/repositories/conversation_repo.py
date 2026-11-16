"""Repository for managing conversational sessions for blog ideas.
"""
import logging
from typing import Optional
from uuid import UUID
from app.schemas.database import Conversation, ConversationStatus
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class ConversationRepository(BaseRepository):
    def __init__(self):
        super().__init__("conversations")

    async def get_active_conversation(self, telegram_user_id: int) -> Optional[Conversation]:
        """Fetch current active conversation for a user."""
        response = (
            self._table()
            .select("*")
            .eq("telegram_user_id", telegram_user_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return Conversation.model_validate(response.data[0])
        return None

    async def get_by_id(self, conversation_id: UUID | str) -> Optional[Conversation]:
        """Fetch conversation by primary key UUID."""
        response = self._table().select("*").eq("id", self._uuid_str(conversation_id)).execute()
        if response.data and len(response.data) > 0:
            return Conversation.model_validate(response.data[0])
        return None

    async def create_conversation(self, telegram_user_id: int) -> Conversation:
        """Create a new active conversation, cancelling any existing dangling active ones."""
        # Cancel any previous active conversation
        existing = await self.get_active_conversation(telegram_user_id)
        if existing:
            await self.update_status(existing.id, "cancelled", "superseded_by_new_session")

        payload = {
            "telegram_user_id": telegram_user_id,
            "status": "active",
            "current_stage": "input_pending"
        }
        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError("Failed to create new conversation session.")

        logger.info(f"Created conversation {response.data[0]['id']} for user {telegram_user_id}")
        return Conversation.model_validate(response.data[0])

    async def update_status(
        self,
        conversation_id: UUID | str,
        status: ConversationStatus,
        current_stage: Optional[str] = None
    ) -> Optional[Conversation]:
        """Update conversation status and optional stage."""
        # Map any legacy non-standard statuses to valid DB constraint values: ('active', 'completed', 'cancelled', 'failed')
        status_map = {
            "idle": "completed",
            "pending": "active",
            "done": "completed",
            "rejected": "cancelled",
        }
        valid_status = status_map.get(str(status), str(status))
        if valid_status not in ["active", "completed", "cancelled", "failed"]:
            valid_status = "active"

        payload = {"status": valid_status}
        if current_stage is not None:
            payload["current_stage"] = current_stage

        response = (
            self._table()
            .update(payload)
            .eq("id", self._uuid_str(conversation_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return Conversation.model_validate(response.data[0])
        return None

