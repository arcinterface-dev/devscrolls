"""Repository for tracking AI token consumption, Tavily search credits, and enforcing
strict zero-cost budget ceilings.
"""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
from uuid import UUID
from app.config.limits import (
    MONTHLY_ARTICLE_LIMIT,
    MONTHLY_RESEARCH_CREDITS_CEILING,
    RESEARCH_CREDITS_PER_ARTICLE,
)
from app.schemas.database import AIProviderName, UsageLog
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class UsageRepository(BaseRepository):
    def __init__(self):
        super().__init__("usage_logs")

    async def log_usage(
        self,
        provider: AIProviderName,
        operation: str,
        input_tokens: int = 0,
        output_tokens: int = 0,
        search_credits: int = 0,
        estimated_cost: float = 0.0,
        model: Optional[str] = None,
        job_id: Optional[UUID | str] = None
    ) -> UsageLog:
        """Records an API consumption event."""
        payload = {
            "job_id": self._uuid_str(job_id),
            "provider": provider,
            "model": model,
            "operation": operation,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "search_credits": search_credits,
            "estimated_cost": estimated_cost
        }

        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError("Failed to record usage log.")

        return UsageLog.model_validate(response.data[0])

    async def get_monthly_search_credits(self, year: Optional[int] = None, month: Optional[int] = None) -> int:
        """Computes total Tavily search credits consumed in the specified or current month."""
        now = datetime.now(timezone.utc)
        target_year = year or now.year
        target_month = month or now.month

        start_of_month = datetime(target_year, target_month, 1, tzinfo=timezone.utc).isoformat()

        response = (
            self._table()
            .select("search_credits")
            .eq("provider", "tavily")
            .gte("created_at", start_of_month)
            .execute()
        )

        if not response.data:
            return 0

        return sum(row.get("search_credits", 0) for row in response.data)

    async def can_consume_research_credits(self, credits_needed: int = 5) -> bool:
        """Guardrail: Returns False if adding credits_needed exceeds the monthly Tavily budget ceiling."""
        current_credits = await self.get_monthly_search_credits()
        if (current_credits + credits_needed) > MONTHLY_RESEARCH_CREDITS_CEILING:
            logger.warning(
                f"Tavily budget ceiling hit! Used: {current_credits}, "
                f"Needed: {credits_needed}, Ceiling: {MONTHLY_RESEARCH_CREDITS_CEILING}"
            )
            return False
        return True

    async def get_monthly_published_articles_count(self) -> int:
        """Counts how many articles have been published this month."""
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()

        drafts_table = self._get_client().schema("automation").from_("blog_drafts")
        response = (
            drafts_table
            .select("id")
            .eq("status", "published")
            .gte("updated_at", start_of_month)
            .execute()
        )
        return len(response.data) if response.data else 0

    async def can_publish_more_articles(self) -> bool:
        """Guardrail: Returns False if the monthly publishing target (5 articles) is reached."""
        count = await self.get_monthly_published_articles_count()
        return count < MONTHLY_ARTICLE_LIMIT

