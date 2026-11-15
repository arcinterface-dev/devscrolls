"""
Knowledge Extractor for DevScrolls.
Extracts author opinions, production war stories, and architectural stances
from published articles and persists them into the personal knowledge library.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.factory import get_agent_provider
from app.ai.provider_interface import AIProvider
from app.schemas.knowledge import KnowledgeExtractionOutput, KnowledgeUnit
from app.schemas.database import PersonalKnowledge
from app.storage.repositories import KnowledgeRepository

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


class KnowledgeExtractor:
    """Extracts reusable engineering perspectives from published articles."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_agent_provider("analyst")
        self.knowledge_repo = KnowledgeRepository()
        self._prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        path = PROMPTS_DIR / "knowledge_extractor.md"
        if path.exists():
            return path.read_text(encoding="utf-8")
        return (
            "You are Santhanakrishnan's Knowledge Archivist. Extract reusable personal opinions, "
            "production war stories, and architectural principles from the article."
        )

    async def extract_and_index(
        self,
        markdown_content: str,
        title: str,
        slug: str,
        conversation_id: Optional[UUID | str] = None
    ) -> List[PersonalKnowledge]:
        """
        Analyzes an article, extracts knowledge units, and saves them to personal_knowledge.
        """
        logger.info(f"Extracting personal knowledge units from published article: '{title}'...")

        user_prompt = f"""
ARTICLE TITLE: {title}
SLUG: {slug}

FULL ARTICLE CONTENT:
{markdown_content[:6000]}

TASK:
Extract the author's authentic personal opinions, lived production experiences, and architectural principles.
"""

        try:
            output, _ = await self.provider.generate_structured(
                system_prompt=self._prompt,
                user_prompt=user_prompt,
                response_schema=KnowledgeExtractionOutput,
                temperature=0.2
            )
        except Exception as e:
            logger.error(f"Failed to generate structured knowledge extraction: {e}", exc_info=True)
            return []

        saved_entries = []
        for unit in output.units:
            try:
                entry = await self.knowledge_repo.store_knowledge(
                    topic=unit.topic,
                    original_content=unit.statement,
                    corrected_content=unit.context,
                    knowledge_type=unit.knowledge_type,
                    metadata={
                        "tags": unit.tags,
                        "source_title": title,
                        "source_slug": slug
                    },
                    conversation_id=conversation_id
                )
                saved_entries.append(entry)
            except Exception as e:
                logger.warning(f"Could not save knowledge unit for topic '{unit.topic}': {e}")

        logger.info(f"Indexed {len(saved_entries)} knowledge units into personal knowledge library.")
        return saved_entries


knowledge_extractor = KnowledgeExtractor()
