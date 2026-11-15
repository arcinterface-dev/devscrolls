"""Search Provider Abstraction for DevScrolls Technical Research.
Decouples research agents from any specific search engine API.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field

class SearchResult(BaseModel):
    """Normalized search result returned by any search provider."""
    title: str = Field(description="Webpage or document title")
    url: str = Field(description="Full HTTPS URL of the result")
    content: str = Field(description="Search snippet or excerpt")
    raw_content: Optional[str] = Field(default=None, description="Detailed markdown/HTML content if retrieved")
    score: float = Field(default=0.0, description="Relevance score from provider (0.0 - 1.0)")

class SearchProvider(ABC):
    """Abstract Base Class for search providers (Tavily, Google Search, etc.)."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider, e.g. 'tavily'."""
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        search_depth: str = "advanced",
        max_results: int = 5
    ) -> List[SearchResult]:
        """Executes a search query and returns normalized SearchResult objects."""
        pass
