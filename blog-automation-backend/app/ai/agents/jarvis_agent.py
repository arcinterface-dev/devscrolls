"""ScrollBot Jarvis Conversational Agent & Memory Gatekeeper.
Powers the living blog companion experience for Sandy on Telegram.
"""
import logging
import re
from typing import List, Optional, Tuple

from pydantic import BaseModel, Field

from app.ai.factory import get_ai_provider
from app.ai.provider_interface import AIProvider
from app.knowledge.jarvis_memory import jarvis_memory
from app.schemas.database import KnowledgeType, PersonalKnowledge
from app.storage.repositories.knowledge_repo import KnowledgeRepository

logger = logging.getLogger(__name__)


class MemoryExtractionItem(BaseModel):
    should_remember: bool = Field(description="True ONLY if the user stated a lasting rule, preference, war story, or idea")
    topic: str = Field(description="Short topic, e.g. 'Styling Architecture' or 'Arcade Rules'")
    fact: str = Field(description="1-sentence crisp summary of the rule or preference")
    knowledge_type: KnowledgeType = Field(default="opinion")


class JarvisAgent:
    """Conversational assistant and personal chief of staff for Sandy Krish."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_ai_provider("gemini")
        self.knowledge_repo = KnowledgeRepository()

    async def chat(self, user_id: int, message_text: str) -> str:
        """Processes conversational input from Sandy and generates an insightful response."""
        system_prompt = await jarvis_memory.build_jarvis_system_prompt()

        try:
            reply, _ = await self.provider.generate_text(
                system_prompt=system_prompt,
                user_prompt=message_text,
                temperature=0.7,
                max_tokens=1000,
            )

            # Background: check if user stated a lasting rule or preference to remember
            import asyncio
            asyncio.create_task(self._auto_extract_memory(message_text))

            return reply
        except Exception as e:
            logger.error(f"Jarvis chat error: {e}")
            return f"I had a quick hiccup processing that, Sandy: {e}"

    async def save_memory(
        self,
        topic: str,
        fact: str,
        knowledge_type: KnowledgeType = "opinion",
    ) -> PersonalKnowledge:
        """Explicitly saves a permanent rule, preference, or fact to the private Supabase ledger."""
        return await self.knowledge_repo.store_knowledge(
            topic=topic,
            original_content=fact,
            corrected_content=fact,
            knowledge_type=knowledge_type,
            metadata={"source": "jarvis_telegram_command"},
        )

    async def list_memories(self, limit: int = 20) -> List[PersonalKnowledge]:
        """Retrieves recent stored memories from the private Supabase database."""
        return await self.knowledge_repo.list_recent_knowledge(limit=limit)

    async def _auto_extract_memory(self, text: str) -> None:
        """Background memory filter: detects if Sandy taught the bot a permanent rule."""
        # Quick heuristics to skip chit-chat without calling LLM
        lower = text.lower().strip()
        triggers = ["remember", "i prefer", "always", "never", "our rule", "i hate", "i like", "rule for"]
        if not any(t in lower for t in triggers):
            return

        extraction_system = (
            "You are a Memory Filter for an engineer's personal bot. "
            "Analyze if the user stated a LASTING rule, architectural decision, or permanent preference. "
            "If it's just casual conversation or a one-off task, set should_remember=False. "
            "Never save temporary instructions."
        )

        try:
            item, _ = await self.provider.generate_structured(
                system_prompt=extraction_system,
                user_prompt=f"User message: {text}",
                response_schema=MemoryExtractionItem,
                temperature=0.1,
                max_tokens=300,
            )
            if item.should_remember and item.fact:
                logger.info(f"Auto-remembered fact: [{item.topic}] {item.fact}")
                await self.save_memory(
                    topic=item.topic,
                    fact=item.fact,
                    knowledge_type=item.knowledge_type,
                )
        except Exception as e:
            logger.debug(f"Auto memory extraction skipped: {e}")


jarvis_agent = JarvisAgent()
