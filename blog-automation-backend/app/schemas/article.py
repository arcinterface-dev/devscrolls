"""
Pydantic schemas for Agent 4: Blog Writer and Editorial Reviewer.
Enforces strict Astro Zod-compliant frontmatter schemas, controlled taxonomy enums,
and content structure standards.
"""

from typing import List, Optional, Literal
from datetime import date
from pydantic import BaseModel, Field, field_validator


# Strictly matched to src/content/_taxonomy.ts
CategoryEnum = Literal[
    "frontend",
    "backend",
    "ai",
    "architecture",
    "interviews",
    "tutorials"
]

TagEnum = Literal[
    "react",
    "typescript",
    "astro",
    "css",
    "performance",
    "accessibility",
    "system-design"
]


class AstroFrontmatter(BaseModel):
    """
    Astro Content Collection frontmatter schema.
    Directly mirrors the Zod validation schema in `src/content.config.ts`.
    """
    title: str = Field(
        ...,
        max_length=70,
        description="Article title. Strictly 70 characters or less (<= 60 preferred for SEO)."
    )
    description: str = Field(
        ...,
        min_length=100,
        max_length=160,
        description="SEO meta description summarizing core thesis (100 to 160 characters)."
    )
    publishDate: str = Field(
        ...,
        description="Publication date formatted as YYYY-MM-DD."
    )
    updatedDate: Optional[str] = Field(
        None,
        description="Optional updated date formatted as YYYY-MM-DD."
    )
    category: CategoryEnum = Field(
        ...,
        description="Controlled category from src/content/_taxonomy.ts."
    )
    tags: List[TagEnum] = Field(
        ...,
        max_length=5,
        description="Controlled tags list (maximum 5) from src/content/_taxonomy.ts."
    )
    heroImage: str = Field(
        ...,
        description="Path to WebP image in /public/ (e.g., '/<slug>-hero.webp')."
    )
    heroImageAlt: str = Field(
        ...,
        min_length=1,
        description="Descriptive alt text for the hero image (required for accessibility)."
    )
    draft: bool = Field(
        default=False,
        description="Draft status. False for ready-to-publish articles."
    )
    canonical: Optional[str] = Field(
        None,
        description="Canonical URL (e.g. 'https://devscrolls.dev/articles/<slug>/')."
    )
    series: Optional[str] = Field(
        None,
        description="Optional series name."
    )
    seriesOrder: Optional[int] = Field(
        None,
        description="Optional integer position within series."
    )

    @field_validator("title")
    @classmethod
    def validate_title_length(cls, v: str) -> str:
        if len(v) > 70:
            return v[:67] + "..."
        return v


class ArticleDraftOutput(BaseModel):
    """Structured output produced by the Blog Writer Agent."""
    title: str = Field(..., max_length=70, description="Article title matching frontmatter.")
    slug: str = Field(..., description="Kebab-case URL slug (e.g. 'react-server-components-pitfalls').")
    frontmatter: AstroFrontmatter = Field(..., description="Astro Zod-compliant frontmatter metadata.")
    markdown_content: str = Field(..., description="Full Markdown content body including BLUF.")
    word_count: int = Field(..., ge=1, description="Total word count of the article body.")
    reading_time: str = Field(..., description="Estimated reading time (e.g. '6 min read').")
    banned_words_detected: List[str] = Field(
        default_factory=list,
        description="Any filler words detected during self-audit (should be empty)."
    )


class EditorialReviewOutput(BaseModel):
    """Output produced during editorial and quality validation."""
    passed_review: bool = Field(..., description="True if draft passes all editorial guardrails.")
    banned_words_found: List[str] = Field(default_factory=list, description="List of banned filler words found.")
    title_character_count: int = Field(..., description="Length of title (must be <= 70).")
    description_character_count: int = Field(..., description="Length of description (must be 100-160).")
    heading_emoji_check_passed: bool = Field(..., description="True if NO emojis exist in headings.")
    bluf_present: bool = Field(..., description="True if bolded BLUF exists in opening paragraph.")
    feedback: str = Field(..., description="Editorial remarks and critique.")
    revised_markdown: Optional[str] = Field(None, description="Cleaned markdown if edits were required.")
