"""Repository for storing and retrieving reusable author knowledge, observations, and opinions.
"""
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.schemas.database import KnowledgeType, PersonalKnowledge
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class KnowledgeRepository(BaseRepository):
    def __init__(self):
        super().__init__("personal_knowledge")

    async def store_knowledge(
        self,
        topic: str,
        original_content: str,
        corrected_content: Optional[str] = None,
        knowledge_type: KnowledgeType = "experience",
        metadata: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[UUID | str] = None
    ) -> PersonalKnowledge:
        """Stores a confirmed piece of author knowledge for future article cross-referencing."""
        payload = {
            "conversation_id": self._uuid_str(conversation_id),
            "topic": topic,
            "original_content": original_content,
            "corrected_content": corrected_content,
            "knowledge_type": knowledge_type,
            "metadata": metadata or {}
        }

        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to store personal knowledge entry for topic: {topic}")

        logger.info(f"Stored personal knowledge item: '{topic}' ({knowledge_type})")
        return PersonalKnowledge.model_validate(response.data[0])

    async def search_knowledge(
        self,
        query: str,
        limit: int = 5
    ) -> List[PersonalKnowledge]:
        """Searches personal knowledge using full-text search on topic and content."""
        try:
            # PostgreSQL websearch_to_tsquery or text search
            response = (
                self._table()
                .select("*")
                .text_search("topic", query, config="english")
                .limit(limit)
                .execute()
            )
            if response.data:
                return [PersonalKnowledge.model_validate(item) for item in response.data]
        except Exception as e:
            logger.debug(f"Full-text search fallback to ILIKE: {e}")

        # Fallback to ILIKE if full-text index isn't available
        response = (
            self._table()
            .select("*")
            .ilike("topic", f"%{query}%")
            .limit(limit)
            .execute()
        )
        if response.data:
            return [PersonalKnowledge.model_validate(item) for item in response.data]
        return []

    async def list_recent_knowledge(self, limit: int = 50) -> List[PersonalKnowledge]:
        """Fetches the latest stored personal knowledge entries for assistant memory context."""
        try:
            response = self._table().select("*").order("created_at", desc=True).limit(limit).execute()
            if response.data:
                return [PersonalKnowledge.model_validate(item) for item in response.data]
        except Exception as e:
            logger.warning(f"Could not fetch recent knowledge: {e}")
        return []

    async def delete_knowledge(self, knowledge_id: UUID | str) -> bool:
        """Deletes a knowledge memory entry by id."""
        try:
            self._table().delete().eq("id", str(knowledge_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting knowledge {knowledge_id}: {e}")
            return False

