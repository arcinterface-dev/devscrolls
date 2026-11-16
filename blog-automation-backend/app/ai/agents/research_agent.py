"""Agent 2: Technical Research Agent.
Formulates targeted search queries for technical claims, searches authoritative sources via Tavily,
and synthesizes verifiable supporting and contradictory evidence.
"""
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.ai.factory import get_agent_provider
from app.ai.provider_interface import UsageMetadata
from app.config.limits import RESEARCH_CREDITS_PER_ARTICLE
from app.research.source_extractor import classify_source_url, clean_excerpt
from app.research.tavily_provider import tavily_provider
from app.schemas.perspective import ClassifiedClaim
from app.schemas.research import ClaimResearch, ResearchOutput, ResearchSourceItem
from app.storage.repositories import UsageRepository

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"

class ClaimQueryPair(BaseModel):
    """Mapping of an individual claim to its targeted technical search query."""
    claim: str = Field(description="The exact claim statement to be researched.")
    query: str = Field(description="Single targeted technical search query for official documentation.")

class QueryGenerationOutput(BaseModel):
    """Schema for AI query generation step (Gemini Developer API compatible with zero additionalProperties)."""
    queries: List[ClaimQueryPair] = Field(
        description="List of claim-to-query mappings."
    )

class ResearchAgent:
    """Agent that coordinates web research, source extraction, and evidence synthesis."""

    def __init__(self):
        self.provider = get_agent_provider("research")
        self.search_provider = tavily_provider
        self.usage_repo = UsageRepository()
        self._system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = PROMPTS_DIR / "research_agent.md"
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8")
        return (
            "You are the Technical Research Agent for DevScrolls. "
            "Validate claims against official technical documentation without fabricating citations."
        )

    async def formulate_queries(
        self,
        claims: List[ClassifiedClaim],
        topic: str
    ) -> Dict[str, str]:
        """Generates a laser-targeted technical search query for each claim requiring research."""
        researchable_claims = [c for c in claims if c.requires_research]
        if not researchable_claims:
            return {}

        prompt = (
            f"Topic: {topic}\n\n"
            "Generate exactly ONE targeted, high-signal technical search query for each claim below.\n"
            "Prioritize querying official framework names, API methods, and specifications (e.g. 'React 19 useActionState form reset official docs').\n\n"
            "Claims to research:\n"
        )
        for i, c in enumerate(researchable_claims, 1):
            prompt += f"{i}. {c.statement}\n"

        system_instruction = (
            "You are a technical search strategist. Output a QueryGenerationOutput JSON with a list of "
            "ClaimQueryPair objects mapping each claim to a single authoritative search query."
        )

        output, _ = await self.provider.generate_structured(
            system_prompt=system_instruction,
            user_prompt=prompt,
            response_schema=QueryGenerationOutput,
            temperature=0.1
        )
        return {item.claim: item.query for item in output.queries}

    async def conduct_research(
        self,
        claims: List[ClassifiedClaim],
        topic: str,
        job_id: Optional[UUID | str] = None
    ) -> tuple[ResearchOutput, UsageMetadata]:
        """Conducts full technical research across all researchable claims.

        Args:
            claims: The classified claims list from PerspectiveOutput.
            topic: The article topic or objective.
            job_id: Optional job UUID for telemetry tracking.

        Returns:
            tuple of (ResearchOutput, UsageMetadata)
        """
        researchable_claims = [c for c in claims if c.requires_research]
        logger.info(f"Conducting research for {len(researchable_claims)}/{len(claims)} claims on '{topic}'...")

        # If no claims require research (e.g. purely personal reflection), return clean report
        if not researchable_claims:
            empty_report = ResearchOutput(
                research_summary="No technical or external claims required external research.",
                claims_researched=[],
                total_searches=0,
                credits_consumed=0,
                limitations=[]
            )
            return empty_report, UsageMetadata(
                provider="gemini",
                model="gemini-3.8-flash",
                operation="research_synthesis"
            )

        # 1. Formulate Queries
        queries_by_claim = await self.formulate_queries(researchable_claims, topic)

        # 2. Execute Searches via Tavily (respecting article credit budget)
        all_sources_by_claim: Dict[str, List[ResearchSourceItem]] = {}
        total_searches = 0
        credits_consumed = 0

        for claim in researchable_claims:
            # Check per-article budget safeguard
            if credits_consumed >= (RESEARCH_CREDITS_PER_ARTICLE - 2):
                logger.warning(
                    f"Hit per-article research credit ceiling ({RESEARCH_CREDITS_PER_ARTICLE}). "
                    "Skipping further external queries to preserve budget."
                )
                break

            query = queries_by_claim.get(claim.statement, f"{claim.statement} technical documentation")

            try:
                search_results = await self.search_provider.search(
                    query=query,
                    search_depth="advanced",
                    max_results=3
                )
                total_searches += 1
                credits_consumed += 2  # Advanced search = 2 credits

                claim_sources: List[ResearchSourceItem] = []
                for res in search_results:
                    source_type, reliability = classify_source_url(res.url)
                    claim_sources.append(
                        ResearchSourceItem(
                            claim_id=claim.statement,
                            source_title=res.title or "Documentation Page",
                            source_url=res.url,
                            source_type=source_type,
                            relevant_excerpt=clean_excerpt(res.content, max_length=350),
                            reliability_score=reliability
                        )
                    )

                # Sort sources so Priority 1 (Official Docs) appear first
                claim_sources.sort(key=lambda s: s.reliability_score, reverse=True)
                all_sources_by_claim[claim.statement] = claim_sources

            except Exception as e:
                logger.error(f"Search failed for query '{query}': {e}")
                all_sources_by_claim[claim.statement] = []

        # 3. Synthesize Findings using Gemini into ResearchOutput
        synthesis_prompt = f"### Topic: {topic}\n\n### Claims and Retrieved External Sources:\n"

        for claim in researchable_claims:
            synthesis_prompt += f"\nClaim: {claim.statement} (Type: {claim.claim_type})\n"
            sources = all_sources_by_claim.get(claim.statement, [])
            if sources:
                synthesis_prompt += "Retrieved Sources:\n"
                for s in sources:
                    synthesis_prompt += (
                        f"  - Title: {s.source_title}\n"
                        f"    URL: {s.source_url}\n"
                        f"    Type: {s.source_type} (Reliability: {s.reliability_score})\n"
                        f"    Excerpt: {s.relevant_excerpt}\n"
                    )
            else:
                synthesis_prompt += "  - No external documentation found.\n"

        synthesis_prompt += (
            "\nAnalyze the evidence for each claim. Identify specific supporting evidence and any contradictory evidence. "
            "Output a complete, verified ResearchOutput JSON object. Never fabricate URLs."
        )

        output, usage = await self.provider.generate_structured(
            system_prompt=self._system_prompt,
            user_prompt=synthesis_prompt,
            response_schema=ResearchOutput,
            temperature=0.1
        )

        # Attach telemetry metrics
        output.total_searches = total_searches
        output.credits_consumed = credits_consumed

        logger.info(
            f"Research synthesis complete! Researched {len(output.claims_researched)} claims. "
            f"Searches: {total_searches}, Credits: {credits_consumed}."
        )

        return output, usage


research_agent = ResearchAgent()
