"""
Pydantic schemas for Phase 12: Personal Knowledge Library.
Defines structures for extracted author opinions, production war stories,
architectural preferences, and retrieval payloads.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


KnowledgeCategory = Literal[
    "experience",     # Lived production anecdote or war story
    "opinion",        # Strong subjective engineering take or contrarian view
    "explanation",    # Deep under-the-hood mental model or abstraction teardown
    "observation",    # Industry or tooling observation
    "project"         # Specific project architecture or case study
]


class KnowledgeUnit(BaseModel):
    """An individual reusable piece of personal knowledge or perspective."""
    topic: str = Field(..., description="Primary technical topic (e.g. 'React Server Components', 'Astro Content Layer').")
    knowledge_type: KnowledgeCategory = Field(..., description="Epistemic type of this knowledge item.")
    statement: str = Field(..., description="Concise statement of the author's take or war story.")
    context: str = Field(..., description="Supporting context, metrics, or detailed explanation.")
    tags: List[str] = Field(default_factory=list, description="Keywords and tags associated with this unit.")


class KnowledgeExtractionOutput(BaseModel):
    """Structured output produced when analyzing a published article to index reusable knowledge."""
    summary: str = Field(..., description="Overview of key takeaways extracted from the article.")
    units: List[KnowledgeUnit] = Field(
        ...,
        description="List of extracted personal opinions, experiences, and architectural principles."
    )


class RetrievedKnowledgeContext(BaseModel):
    """Payload injected into agent prompts summarizing relevant past knowledge."""
    topic_query: str = Field(..., description="Query used for retrieval.")
    matching_units: List[KnowledgeUnit] = Field(default_factory=list, description="Matched past knowledge units.")
    formatted_prompt_block: str = Field(..., description="Pre-formatted markdown block ready for prompt injection.")
