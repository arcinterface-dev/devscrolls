"""Pydantic schemas for Agent 2: Technical Research Agent.
Models search queries, external sources, source reliability ranking, and synthesized evidence.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

SourceType = Literal[
    "official_docs",
    "academic",
    "tech_publication",
    "community",
    "other"
]

class ResearchSourceItem(BaseModel):
    """An individual verifiable external source retrieved during research."""
    claim_id: Optional[str] = Field(default=None, description="ID or reference of the claim this source addresses.")
    source_title: str = Field(description="Title of the article or documentation page.")
    source_url: str = Field(description="Authoritative, real URL of the source.")
    source_type: SourceType = Field(description="Tier of the source based on the priority hierarchy.")
    publication_date: Optional[str] = Field(default=None, description="Publication or last modified date (YYYY-MM-DD).")
    relevant_excerpt: str = Field(description="Verbatim excerpt or quotation providing technical proof.")
    reliability_score: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Reliability weight: 1.0 (Official Docs), 0.85 (Academic/Official Eng), 0.70 (Tech Pub), 0.50 (Community)."
    )

class ClaimResearch(BaseModel):
    """Synthesized research evidence for a specific technical claim."""
    claim_id: str = Field(description="Claim identifier matching PerspectiveOutput.claims.")
    original_statement: str = Field(description="The exact statement spoken by the author.")
    search_queries: List[str] = Field(default_factory=list, description="Targeted queries used to research this claim.")
    sources: List[ResearchSourceItem] = Field(default_factory=list, description="Retrieved sources evaluating this claim.")
    supporting_evidence: List[str] = Field(
        default_factory=list,
        description="Key findings confirming or validating the claim."
    )
    contradictory_evidence: List[str] = Field(
        default_factory=list,
        description="Findings refuting or qualifying the claim, or highlighting outdated assumptions."
    )
    research_verdict: str = Field(
        description="Objective summary of what the technical documentation specifies regarding this claim."
    )

class ResearchOutput(BaseModel):
    """Structured output produced by the Technical Research Agent."""
    research_summary: str = Field(description="Executive summary of research findings across all claims.")
    claims_researched: List[ClaimResearch] = Field(
        default_factory=list,
        description="Per-claim research breakdown with sources and evidence."
    )
    total_searches: int = Field(default=0, description="Total search operations performed.")
    credits_consumed: int = Field(default=0, description="Tavily API search credits used.")
    limitations: List[str] = Field(
        default_factory=list,
        description="Any technical claims where documentation was inconclusive or sources conflicted."
    )
