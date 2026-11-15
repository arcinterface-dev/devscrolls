"""
Pydantic schemas for Agent 3: Fact Checker and Critical Reviewer.
Defines structures for verifying claims, handling technical corrections,
and determining whether human approval is required before blog writing.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class ClaimVerificationStatus(str, Enum):
    """Verdict on an individual claim made by the author."""
    VERIFIED = "verified"                  # Backed by research / official docs
    CONTRADICTED = "contradicted"          # Contradicts official docs or known facts
    OUTDATED = "outdated"                  # Was once true, but changed in recent versions
    PERSONAL_OPINION = "personal_opinion"  # Subjective stance; immune to contradiction
    PERSONAL_EXPERIENCE = "personal_exp"  # Specific team/prod anecdote; immune to contradiction
    UNVERIFIABLE = "unverifiable"          # Insufficient external evidence; acceptable with caution
    AMBIGUOUS = "ambiguous"                # Vague or multi-interpretable; requires nuance


class ClaimVerification(BaseModel):
    """Detailed verification record for a single classified claim."""
    claim_id: Optional[str] = Field(None, description="UUID of claim if persisted")
    claim_text: str = Field(..., description="The original claim from the author")
    status: ClaimVerificationStatus = Field(..., description="Verification verdict")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in verdict")
    evidence_sources: List[str] = Field(default_factory=list, description="URLs supporting verdict")
    explanation: str = Field(..., description="Reasoning for this verdict based on evidence")
    suggested_revision: Optional[str] = Field(None, description="Suggested phrasing fix if contradicted/outdated")


class MajorCorrection(BaseModel):
    """
    A critical technical contradiction that would mislead readers or harm author credibility.
    Triggers an explicit human confirmation gate in Telegram before proceeding.
    """
    claim: str = Field(..., description="Original claim made by the author")
    reason: str = Field(..., description="Why this claim is factually inaccurate")
    contradicting_source: str = Field(..., description="Authoritative URL/doc proving contradiction")
    suggested_remedy: str = Field(..., description="Actionable replacement or nuance for the article")
    requires_human_approval: bool = Field(True, description="Always True for major corrections")


class MinorCorrection(BaseModel):
    """
    A non-critical adjustment (e.g. version precision, minor terminology nuance).
    Does not halt the pipeline; incorporated automatically by the writer.
    """
    claim: str = Field(..., description="Original claim")
    suggested_nuance: str = Field(..., description="Recommended slight adjustment")
    note: str = Field(..., description="Context for writer")


class FactCheckOutput(BaseModel):
    """Complete output produced by the Fact Checker Agent."""
    verifications: List[ClaimVerification] = Field(
        ...,
        description="Verification for every claim from the perspective analysis"
    )
    overall_accuracy_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weighted accuracy score across all technical claims"
    )
    major_corrections: List[MajorCorrection] = Field(
        default_factory=list,
        description="Blocking factual errors requiring human confirmation"
    )
    minor_corrections: List[MinorCorrection] = Field(
        default_factory=list,
        description="Non-blocking recommendations for the writer"
    )
    proceed_to_writing: bool = Field(
        ...,
        description="True if no blocking major corrections remain unaddressed"
    )
    human_approval_required: bool = Field(
        ...,
        description="True if pipeline must pause for author confirmation in Telegram"
    )
    explanation_for_author: Optional[str] = Field(
        None,
        description="Friendly, respectful Telegram message explaining the findings"
    )
