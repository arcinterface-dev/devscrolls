"""
Knowledge Retrieval Engine for DevScrolls.
Retrieves the author's past opinions, production war stories, and architectural stances
from the personal knowledge library to maintain narrative continuity across articles.
"""

import logging
from typing import Any, Dict, List, Optional
from app.schemas.knowledge import KnowledgeUnit, RetrievedKnowledgeContext
from app.schemas.database import PersonalKnowledge
from app.storage.repositories import KnowledgeRepository

logger = logging.getLogger(__name__)


class KnowledgeRetriever:
    """Retrieves relevant past knowledge units to inject into agent generation contexts."""

    def __init__(self):
        self.knowledge_repo = KnowledgeRepository()

    async def retrieve_relevant_knowledge(
        self,
        query: str,
        limit: int = 5
    ) -> RetrievedKnowledgeContext:
        """
        Searches personal knowledge ledger for topics or statements relevant to the query.
        """
        # Clean query to extract keywords (first few words or main noun phrase)
        cleaned_words = [w for w in query.split() if len(w) > 3][:6]
        search_term = " ".join(cleaned_words) if cleaned_words else query

        entries: List[PersonalKnowledge] = []
        try:
            entries = await self.knowledge_repo.search_knowledge(search_term, limit=limit)
        except Exception as e:
            logger.warning(f"Error searching personal knowledge for '{search_term}': {e}")

        units = []
        for e in entries:
            units.append(
                KnowledgeUnit(
                    topic=e.topic,
                    knowledge_type=e.knowledge_type,
                    statement=e.original_content,
                    context=e.corrected_content or "",
                    tags=(e.metadata or {}).get("tags", [])
                )
            )

        # Format clean prompt injection block
        if units:
            block = "## AUTHOR'S HISTORICAL PERSPECTIVE ON THIS TOPIC (DEVSCROLLS SECOND BRAIN):\n"
            for u in units:
                block += f"• [{u.knowledge_type.upper()}] Topic: {u.topic}\n"
                block += f"  Assertion: \"{u.statement}\"\n"
                if u.context:
                    block += f"  Context: {u.context}\n"
                block += "\n"
        else:
            block = ""

        return RetrievedKnowledgeContext(
            topic_query=query,
            matching_units=units,
            formatted_prompt_block=block
        )


knowledge_retriever = KnowledgeRetriever()
