"""Tavily Search API Provider for technical documentation retrieval.
Enforces credit consumption tracking, 7-day query caching, and monthly budget protection.
"""
from datetime import datetime, timedelta, timezone
import logging
from typing import Dict, List, Optional, Tuple
import httpx

from app.config.limits import (
    MONTHLY_RESEARCH_CREDITS_CEILING,
    RESEARCH_CACHE_TTL_DAYS,
    RESEARCH_CREDITS_PER_ARTICLE,
)
from app.config.settings import settings
from app.research.search_provider import SearchProvider, SearchResult
from app.storage.repositories import UsageRepository

logger = logging.getLogger(__name__)

# In-memory query cache for rapid lookups and revision cycles (persisted across turn executions)
_SEARCH_CACHE: Dict[str, Tuple[List[SearchResult], datetime]] = {}

class TavilyProvider(SearchProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TAVILY_API_KEY
        self.usage_repo = UsageRepository()
        self.api_url = "https://api.tavily.com/search"

    @property
    def provider_name(self) -> str:
        return "tavily"

    def _ensure_api_key(self):
        if not self.api_key:
            raise ValueError(
                "TAVILY_API_KEY is not configured in settings or environment. "
                "Please add your key to .env."
            )

    async def search(
        self,
        query: str,
        search_depth: str = "advanced",
        max_results: int = 5,
        include_raw_content: bool = True
    ) -> List[SearchResult]:
        """Executes a search query against Tavily Search API with 7-day caching and credit safeguards.

        Args:
            query: The targeted technical search query.
            search_depth: 'basic' (1 credit) or 'advanced' (2 credits).
            max_results: Maximum number of search results to return.
            include_raw_content: Whether to retrieve detailed content for source extraction.

        Returns:
            List of SearchResult objects.
        """
        self._ensure_api_key()
        cache_key = f"{query.lower().strip()}:{search_depth}:{max_results}"

        # 1. Check 7-Day In-Memory Cache
        if cache_key in _SEARCH_CACHE:
            cached_results, cached_time = _SEARCH_CACHE[cache_key]
            now = datetime.now(timezone.utc)
            if (now - cached_time) < timedelta(days=RESEARCH_CACHE_TTL_DAYS):
                logger.info(f"Reusing cached Tavily research for: '{query}' (0 credits consumed)")
                return cached_results

        # 2. Check Monthly Budget Safeguard
        estimated_credits = 2 if search_depth == "advanced" else 1
        can_proceed = await self.usage_repo.can_consume_research_credits(estimated_credits)
        if not can_proceed:
            raise RuntimeError(
                f"Tavily monthly budget ceiling ({MONTHLY_RESEARCH_CREDITS_CEILING} credits) reached! "
                "Pausing research to maintain zero-cost operation."
            )

        logger.info(f"Querying Tavily Search API: '{query}' (depth={search_depth})")

        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "include_raw_content": include_raw_content,
            "max_results": max_results
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(self.api_url, json=payload)
            if res.status_code != 200:
                logger.error(f"Tavily search failed (HTTP {res.status_code}): {res.text}")
                raise RuntimeError(f"Tavily Search API returned error: {res.text[:150]}")

            data = res.json()

        results_data = data.get("results", [])
        search_results: List[SearchResult] = []

        for item in results_data:
            search_results.append(
                SearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    content=item.get("content", ""),
                    raw_content=item.get("raw_content"),
                    score=item.get("score", 0.0)
                )
            )

        # 3. Log search credit consumption to Supabase telemetry
        try:
            await self.usage_repo.log_usage(
                provider="tavily",
                operation="web_search",
                search_credits=estimated_credits,
                estimated_cost=0.0
            )
        except Exception as e:
            logger.warning(f"Could not log search credit usage in Supabase: {e}")

        # 4. Cache results for 7 days
        _SEARCH_CACHE[cache_key] = (search_results, datetime.now(timezone.utc))
        logger.info(f"Tavily returned {len(search_results)} sources for '{query}'. Cached for 7 days.")

        return search_results


tavily_provider = TavilyProvider()
