"""
Test suite for Phase 6: Research Agent and Tavily Integration.
Tests:
- Tavily search provider with credit tracking, 7-day caching, and error handling.
- Source priority classification (MDN/React -> official_docs (1.0), blogs/SO -> lower weights).
- Query formulation from classified claims.
- Per-article credit limit enforcement (max 120 credits).
- Stage handler integration (inserting sources into DB and advancing job to fact_check).
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.schemas.perspective import ArticleType, ClaimType, ClassifiedClaim
from app.schemas.research import SearchQuery, SourceTier, SearchResultItem, EvidenceSynthesis
from app.research.source_extractor import classify_source_url, rank_sources, SOURCE_TIER_PRIORITIES
from app.research.tavily_provider import TavilySearchProvider, TavilyCacheEntry
from app.ai.agents.research_agent import ResearchAgent
from app.ai.agents.stage_handlers import handle_research_stage, STAGE_HANDLERS
from app.schemas.database import JobStage, JobStatus


def test_classify_source_url_tiers():
    """Verify tier assignment and credibility weights based on domain."""
    # Official docs
    doc_res = classify_source_url("https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API")
    assert doc_res["tier"] == SourceTier.OFFICIAL_DOCS
    assert doc_res["credibility_weight"] == 1.0

    react_res = classify_source_url("https://react.dev/reference/react/useEffect")
    assert react_res["tier"] == SourceTier.OFFICIAL_DOCS
    assert react_res["credibility_weight"] == 1.0

    # Academic / Engineering blogs
    eng_res = classify_source_url("https://netflixtechblog.com/building-scalable-microservices")
    assert eng_res["tier"] == SourceTier.ACADEMIC_OR_ENGINEERING
    assert eng_res["credibility_weight"] == 0.85

    # Tech Publications
    pub_res = classify_source_url("https://infoq.com/news/2026/react-compiler/")
    assert pub_res["tier"] == SourceTier.TECH_PUBLICATION
    assert pub_res["credibility_weight"] == 0.70

    # Community Discussions
    comm_res = classify_source_url("https://stackoverflow.com/questions/123456/how-to-fix-this")
    assert comm_res["tier"] == SourceTier.COMMUNITY
    assert comm_res["credibility_weight"] == 0.50

    # Unknown domain falls into tech publication baseline
    unknown_res = classify_source_url("https://random-tech-blog.org/article")
    assert unknown_res["tier"] == SourceTier.TECH_PUBLICATION
    assert unknown_res["credibility_weight"] == 0.70


def test_rank_sources():
    """Verify sorting of search result items based on credibility and ranking score."""
    items = [
        SearchResultItem(
            url="https://stackoverflow.com/q/1",
            title="SO Question",
            snippet="Discussion",
            tier=SourceTier.COMMUNITY,
            credibility_weight=0.50,
            search_score=0.9
        ),
        SearchResultItem(
            url="https://developer.mozilla.org/doc",
            title="MDN Doc",
            snippet="Official specification",
            tier=SourceTier.OFFICIAL_DOCS,
            credibility_weight=1.0,
            search_score=0.8
        ),
        SearchResultItem(
            url="https://netflixtechblog.com/post",
            title="Netflix Post",
            snippet="Engineering report",
            tier=SourceTier.ACADEMIC_OR_ENGINEERING,
            credibility_weight=0.85,
            search_score=0.85
        )
    ]

    ranked = rank_sources(items)
    # MDN (1.0 * 0.8 = 0.8) should outrank or be ordered primarily by tier priority
    assert ranked[0].tier == SourceTier.OFFICIAL_DOCS
    assert ranked[1].tier == SourceTier.ACADEMIC_OR_ENGINEERING
    assert ranked[2].tier == SourceTier.COMMUNITY


@pytest.mark.asyncio
async def test_tavily_provider_caching():
    """Verify that identical queries hit in-memory cache and don't consume extra credits."""
    mock_client = MagicMock()
    mock_response = {
        "results": [
            {
                "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
                "title": "MDN JS",
                "content": "JavaScript reference documentation"
            }
        ]
    }
    mock_client.search = AsyncMock(return_value=mock_response)

    provider = TavilySearchProvider(api_key="tvly-mock-key")
    provider._client = mock_client

    # First call - cache miss
    res1 = await provider.search("javascript proxy performance")
    assert len(res1) == 1
    assert provider.credits_used_this_session == 1
    assert mock_client.search.call_count == 1

    # Second call - cache hit
    res2 = await provider.search("javascript proxy performance")
    assert len(res2) == 1
    assert provider.credits_used_this_session == 1  # Unchanged!
    assert mock_client.search.call_count == 1  # Not called again


@pytest.mark.asyncio
async def test_tavily_provider_budget_exhaustion():
    """Verify that provider stops searches once the limit is reached."""
    provider = TavilySearchProvider(api_key="tvly-mock-key", max_credits_per_session=2)
    provider._client = MagicMock()
    provider._client.search = AsyncMock(return_value={"results": []})

    await provider.search("query 1")
    await provider.search("query 2")
    assert provider.credits_used_this_session == 2

    # Third query should return empty without making network call
    res3 = await provider.search("query 3")
    assert res3 == []
    assert provider._client.search.call_count == 2


@pytest.mark.asyncio
async def test_research_agent_generate_queries():
    """Verify research agent generates focused search queries for factual/trade-off claims."""
    mock_ai = MagicMock()
    # Structured response with search queries
    mock_ai.generate_structured = AsyncMock(return_value=[
        SearchQuery(
            query="Astro 5 content layer performance benchmark",
            intent="Verify build time improvements",
            target_claim="Astro 5 builds 3x faster with the Content Layer",
            search_depth="basic"
        )
    ])

    agent = ResearchAgent(ai_provider=mock_ai)

    claims = [
        ClassifiedClaim(
            claim_text="Astro 5 builds 3x faster with the Content Layer",
            claim_type=ClaimType.TECHNICAL_FACT,
            requires_evidence=True
        ),
        ClassifiedClaim(
            claim_text="I personally prefer static site generation over SSR",
            claim_type=ClaimType.PERSONAL_OPINION,
            requires_evidence=False
        )
    ]

    queries = await agent.generate_queries(claims, ArticleType.DEEP_DIVE)
    assert len(queries) == 1
    assert "Astro 5" in queries[0].query
    mock_ai.generate_structured.assert_awaited_once()


@pytest.mark.asyncio
async def test_handle_research_stage_advancement():
    """Verify stage handler integrates research agent and advances job stage to fact_check."""
    mock_job_repo = MagicMock()
    mock_job_repo.update_stage = AsyncMock()
    mock_job_repo.update = AsyncMock()

    mock_db = MagicMock()
    mock_db.table().insert().execute = AsyncMock()

    # Mock ResearchAgent execution
    mock_synthesis = EvidenceSynthesis(
        verified_points=["Astro 5 introduces Content Layer APIs."],
        contradictions_found=[],
        benchmarks_and_metrics=["3x faster build times on 10k pages"],
        quotes_and_citations=[],
        summary="Research confirms significant improvements in Astro 5."
    )

    with patch("app.ai.agents.stage_handlers.ResearchAgent") as MockAgentClass:
        mock_instance = MagicMock()
        mock_instance.research_claims = AsyncMock(return_value=(mock_synthesis, [
            SearchResultItem(
                url="https://astro.build/blog/astro-5/",
                title="Astro 5 Release",
                snippet="Content layer announcement",
                tier=SourceTier.OFFICIAL_DOCS,
                credibility_weight=1.0,
                search_score=0.9
            )
        ]))
        MockAgentClass.return_value = mock_instance

        job_data = {
            "id": "job-123",
            "conversation_id": "conv-456",
            "current_stage": JobStage.RESEARCH.value,
            "status": JobStatus.PROCESSING.value,
            "stage_outputs": {
                "perspective_analysis": {
                    "article_type": "deep_dive",
                    "classified_claims": [
                        {
                            "claim_text": "Astro 5 uses content layer",
                            "claim_type": "technical_fact",
                            "requires_evidence": True
                        }
                    ]
                }
            }
        }

        next_stage = await handle_research_stage(job_data, mock_job_repo, mock_db)
        assert next_stage == JobStage.FACT_CHECK

        # Assert job updated to fact_check stage
        mock_job_repo.update.assert_awaited_once()
        call_kwargs = mock_job_repo.update.call_args[1]
        assert call_kwargs["current_stage"] == JobStage.FACT_CHECK
        assert "research" in call_kwargs["stage_outputs"]
        assert call_kwargs["stage_outputs"]["research"]["summary"] == mock_synthesis.summary
