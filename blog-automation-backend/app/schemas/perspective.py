"""Pydantic schemas for Agent 1: Personal Perspective Analyst.
Extracts author perspective, classifies claims, outlines articles, and formulates clarification questions.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

ArticleType = Literal[
    "personal_experience",
    "technical_tutorial",
    "interview_prep",
    "technical_opinion",
    "conceptual_explanation",
    "project_case_study",
    "problem_solving",
    "comparison",
    "industry_observation"
]

ClaimType = Literal[
    "personal_experience",
    "personal_opinion",
    "technical_fact",
    "interpretation",
    "hypothesis",
    "external_fact"
]

class ClassifiedClaim(BaseModel):
    """An individual assertion extracted from the author's transcript."""
    statement: str = Field(description="The specific statement or claim made by the author.")
    claim_type: ClaimType = Field(description="Epistemic category of the claim.")
    requires_research: bool = Field(
        description="True ONLY for technical facts, specifications, or external assertions. False for personal experiences/opinions."
    )
    context: str = Field(description="Context in which this statement was spoken.")

class OutlineSection(BaseModel):
    """A proposed section for the blog article outline."""
    heading: str = Field(description="Section heading (H2/H3). Must be clean text with NO emojis.")
    key_points: List[str] = Field(description="Key arguments, code snippets, or takeaways for this section.")

class PerspectiveOutput(BaseModel):
    """Structured output produced by the Personal Perspective Analyst."""
    article_objective: str = Field(description="The primary objective or problem being addressed.")
    proposed_title: str = Field(description="Working article title (strictly 70 characters or less).")
    main_argument: str = Field(description="The core thesis or Bottom Line Up Front (BLUF) of the article.")
    target_audience: str = Field(description="Primary developer audience (e.g., Senior Frontend Engineers, Full-Stack Devs).")
    article_type: ArticleType = Field(description="Intended format and angle of the article.")
    personal_perspective: str = Field(
        description="Summary of the author's unique viewpoint, personal voice, and core philosophy on this topic."
    )
    important_observations: List[str] = Field(
        default_factory=list,
        description="Key personal observations, pain points, or trade-offs mentioned by the author."
    )
    technical_explanations: List[str] = Field(
        default_factory=list,
        description="Technical mechanics or concepts explained in the transcript."
    )
    claims: List[ClassifiedClaim] = Field(
        default_factory=list,
        description="All notable claims classified for research and fact-checking."
    )
    proposed_outline: List[OutlineSection] = Field(
        default_factory=list,
        description="Structured section outline for the final article."
    )

    @property
    def outline(self) -> List[OutlineSection]:
        """Convenience property mapping to proposed_outline."""
        return self.proposed_outline
    missing_information: List[str] = Field(
        default_factory=list,
        description="Any technical details or context omitted in the recording."
    )
    clarification_questions: List[str] = Field(
        default_factory=list,
        description="Targeted questions for the author if the transcript is ambiguous. If non-empty, pipeline pauses to ask."
    )
