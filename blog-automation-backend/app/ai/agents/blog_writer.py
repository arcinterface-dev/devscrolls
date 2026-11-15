"""
Agent 4: Blog Writer & Editorial Reviewer.
Produces high-signal, research-backed, authentic engineering blog posts matching
Santhanakrishnan's exact tone, Astro Zod-compliant frontmatter, and DevScrolls standards.
"""

import math
import re
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.factory import get_agent_provider
from app.ai.provider_interface import AIProvider, UsageMetadata
from app.knowledge.context_builder import context_builder
from app.schemas.article import (
    AstroFrontmatter,
    ArticleDraftOutput,
    EditorialReviewOutput,
    CategoryEnum,
    TagEnum
)
from app.schemas.database import BlogDraft
from app.schemas.perspective import PerspectiveOutput
from app.schemas.research import ResearchOutput
from app.schemas.factcheck import FactCheckOutput
from app.storage.repositories import DraftRepository, UsageRepository

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"

# Banned LLM filler words and their replacements
BANNED_WORDS_MAP = {
    r"\bdelve into\b": "examine",
    r"\bdelve\b": "explore",
    r"\brobust\b": "resilient",
    r"\blandscape\b": "ecosystem",
    r"\bin conclusion\b": "in summary",
    r"\btapestry\b": "system",
    r"\bseamless\b": "frictionless",
    r"\bseamlessly\b": "smoothly",
    r"\bgame-changer\b": "turning point",
    r"\bgame changer\b": "turning point",
}

# Regex for stripping emojis from headers
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess, symbols
    "\U0001FA70-\U0001FAFF"  # symbols
    "]+",
    flags=re.UNICODE
)


class BlogWriterAgent:
    """Agent that crafts the complete Astro markdown blog post and conducts editorial quality checks."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_agent_provider("writer")
        self.draft_repo = DraftRepository()
        self.usage_repo = UsageRepository()
        self._writer_prompt = self._load_writer_prompt()
        self._editorial_prompt = self._load_editorial_prompt()

    def _load_writer_prompt(self) -> str:
        path = PROMPTS_DIR / "blog_writer.md"
        if path.exists():
            return path.read_text(encoding="utf-8")
        return (
            "You are Santhanakrishnan's Senior Blog Writer. Write authentic, technical engineering articles. "
            "BLUF first, no banned words, no emojis in headings, title <= 70 chars, description 100-160 chars."
        )

    def _load_editorial_prompt(self) -> str:
        path = PROMPTS_DIR / "editorial_review.md"
        if path.exists():
            return path.read_text(encoding="utf-8")
        return (
            "You are the DevScrolls Editorial Reviewer. Audit title length, description length, "
            "banned words, and heading emojis."
        )

    def _generate_slug(self, title: str) -> str:
        """Converts title to a clean kebab-case URL slug."""
        clean = re.sub(r"[^\w\s-]", "", title.lower())
        slug = re.sub(r"[\s_-]+", "-", clean).strip("-")
        return slug[:50]

    def _sanitize_markdown(self, markdown: str) -> tuple[str, List[str]]:
        """Sanitizes body markdown: removes banned filler words and strips emojis from headings."""
        detected_banned = []
        cleaned = markdown

        # 1. Replace banned words
        for pattern, replacement in BANNED_WORDS_MAP.items():
            if re.search(pattern, cleaned, re.IGNORECASE):
                matches = re.findall(pattern, cleaned, re.IGNORECASE)
                detected_banned.extend(matches)
                cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

        # 2. Strip emojis from headings (#, ##, ###, ####)
        lines = cleaned.split("\n")
        sanitized_lines = []
        for line in lines:
            if re.match(r"^#{1,6}\s+", line):
                # Remove emojis from heading line
                no_emoji = EMOJI_PATTERN.sub("", line)
                # Clean up any doubled spaces created by emoji removal
                no_emoji = re.sub(r"\s+", " ", no_emoji).strip()
                sanitized_lines.append(no_emoji)
            else:
                sanitized_lines.append(line)

        return "\n".join(sanitized_lines), list(set(detected_banned))

    async def write_draft(
        self,
        perspective: PerspectiveOutput,
        research: ResearchOutput,
        factcheck: FactCheckOutput,
        job_id: Optional[UUID | str] = None,
        conversation_id: Optional[UUID | str] = None,
        target_category: Optional[str] = None
    ) -> tuple[ArticleDraftOutput, BlogDraft, UsageMetadata]:
        """Generates the full blog draft and persists it to the database."""
        logger.info(f"Writing article draft for '{perspective.proposed_title}'...")

        # 1. Build prompt with contextual knowledge assets
        user_prompt = context_builder.build_writer_prompt(
            perspective=perspective,
            research=research,
            factcheck=factcheck,
            target_category=target_category
        )

        # 2. Generate structured article draft
        raw_output, usage = await self.provider.generate_structured(
            system_prompt=self._writer_prompt,
            user_prompt=user_prompt,
            response_schema=ArticleDraftOutput,
            temperature=0.3
        )

        # 3. Post-generation sanitization
        sanitized_body, detected_banned = self._sanitize_markdown(raw_output.markdown_content)

        # Enforce title length <= 70 chars
        title = raw_output.title.strip()
        if len(title) > 70:
            title = title[:67] + "..."

        # Enforce description length 100-160 chars
        desc = raw_output.frontmatter.description.strip()
        if len(desc) < 100:
            desc = desc + " Learn the key trade-offs, architecture patterns, and senior engineering takeaways."
        if len(desc) > 160:
            desc = desc[:157] + "..."

        # Ensure valid slug
        slug = raw_output.slug or self._generate_slug(title)

        # Ensure publish date is present
        pub_date = raw_output.frontmatter.publishDate or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Fallback category and tags to taxonomy bounds
        valid_cats = ["frontend", "backend", "ai", "architecture", "interviews", "tutorials"]
        cat = raw_output.frontmatter.category if raw_output.frontmatter.category in valid_cats else "frontend"

        valid_tags = ["react", "typescript", "astro", "css", "performance", "accessibility", "system-design"]
        tags = [t for t in raw_output.frontmatter.tags if t in valid_tags][:5]
        if not tags:
            tags = ["react", "performance"]

        frontmatter = AstroFrontmatter(
            title=title,
            description=desc,
            publishDate=pub_date,
            updatedDate=raw_output.frontmatter.updatedDate,
            category=cat,
            tags=tags,
            heroImage=f"/{slug}-hero.webp",
            heroImageAlt=raw_output.frontmatter.heroImageAlt or f"Illustration for {title}",
            draft=False,
            canonical=f"https://devscrolls.dev/articles/{slug}/",
            series=raw_output.frontmatter.series,
            seriesOrder=raw_output.frontmatter.seriesOrder
        )

        words = len(sanitized_body.split())
        read_mins = max(1, math.ceil(words / 200))

        draft_output = ArticleDraftOutput(
            title=title,
            slug=slug,
            frontmatter=frontmatter,
            markdown_content=sanitized_body,
            word_count=words,
            reading_time=f"{read_mins} min read",
            banned_words_detected=detected_banned
        )

        # 4. Persist draft into database
        persisted_draft = None
        if conversation_id:
            try:
                persisted_draft = await self.draft_repo.create_draft(
                    conversation_id=conversation_id,
                    job_id=job_id,
                    title=title,
                    slug=slug,
                    description=desc,
                    content=sanitized_body,
                    frontmatter=frontmatter.model_dump(),
                    seo_metadata={
                        "reading_time": draft_output.reading_time,
                        "word_count": draft_output.word_count,
                        "primary_keyword": tags[0] if tags else "engineering"
                    }
                )
            except Exception as e:
                logger.error(f"Error persisting draft to database: {e}", exc_info=True)

        # 5. Log usage telemetry
        if job_id and usage:
            try:
                await self.usage_repo.log_usage(
                    job_id=job_id,
                    stage="writing",
                    model=usage.model,
                    prompt_tokens=usage.prompt_tokens,
                    completion_tokens=usage.completion_tokens,
                    estimated_cost=usage.estimated_cost
                )
            except Exception as e:
                logger.warning(f"Could not log blog writer usage: {e}")

        return draft_output, persisted_draft, usage

    async def editorial_review(self, draft: ArticleDraftOutput) -> EditorialReviewOutput:
        """Conducts an automated editorial quality review."""
        review_prompt = f"""
TITLE: {draft.title} (Length: {len(draft.title)})
DESCRIPTION: {draft.frontmatter.description} (Length: {len(draft.frontmatter.description)})
CATEGORY: {draft.frontmatter.category}
TAGS: {draft.frontmatter.tags}

BODY CONTENT:
{draft.markdown_content[:3000]}
"""
        output, _ = await self.provider.generate_structured(
            system_prompt=self._editorial_prompt,
            user_prompt=review_prompt,
            response_schema=EditorialReviewOutput,
            temperature=0.1
        )
        return output

    async def revise_draft(
        self,
        current_content: str,
        current_frontmatter: Dict[str, Any],
        revision_instructions: str,
        job_id: Optional[UUID | str] = None
    ) -> tuple[ArticleDraftOutput, UsageMetadata]:
        """Revises an existing article draft according to the author's feedback."""
        logger.info(f"Revising article draft: '{revision_instructions[:60]}...'")

        user_prompt = f"""
EXISTING FRONTMATTER:
{current_frontmatter}

EXISTING ARTICLE MARKDOWN:
{current_content}

AUTHOR'S REVISION INSTRUCTIONS:
{revision_instructions}

TASK:
1. Apply the author's requested changes directly to the article.
2. Maintain the Senior Frontend Engineer peer voice, BLUF bolded thesis, and 6-beat DevScrolls structure.
3. Strictly enforce:
   - title <= 70 chars
   - description between 100-160 chars
   - category in [frontend, backend, ai, architecture, interviews, tutorials]
   - tags in [react, typescript, astro, css, performance, accessibility, system-design] (max 5)
   - ZERO banned words (delve, robust, landscape, in conclusion, tapestry, seamless, game-changer)
   - ZERO emojis in headings
"""
        raw_output, usage = await self.provider.generate_structured(
            system_prompt=self._writer_prompt,
            user_prompt=user_prompt,
            response_schema=ArticleDraftOutput,
            temperature=0.3
        )

        sanitized_body, detected_banned = self._sanitize_markdown(raw_output.markdown_content)

        title = raw_output.title.strip()
        if len(title) > 70:
            title = title[:67] + "..."

        desc = raw_output.frontmatter.description.strip()
        if len(desc) < 100:
            desc = desc + " Learn the key trade-offs, architecture patterns, and senior engineering takeaways."
        if len(desc) > 160:
            desc = desc[:157] + "..."

        slug = raw_output.slug or current_frontmatter.get("slug") or self._generate_slug(title)

        valid_cats = ["frontend", "backend", "ai", "architecture", "interviews", "tutorials"]
        cat = raw_output.frontmatter.category if raw_output.frontmatter.category in valid_cats else "frontend"

        valid_tags = ["react", "typescript", "astro", "css", "performance", "accessibility", "system-design"]
        tags = [t for t in raw_output.frontmatter.tags if t in valid_tags][:5]
        if not tags:
            tags = ["react", "performance"]

        frontmatter = AstroFrontmatter(
            title=title,
            description=desc,
            publishDate=raw_output.frontmatter.publishDate or current_frontmatter.get("publishDate", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
            updatedDate=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            category=cat,
            tags=tags,
            heroImage=f"/{slug}-hero.webp",
            heroImageAlt=raw_output.frontmatter.heroImageAlt or f"Illustration for {title}",
            draft=False,
            canonical=f"https://devscrolls.dev/articles/{slug}/"
        )

        words = len(sanitized_body.split())
        read_mins = max(1, math.ceil(words / 200))

        draft_output = ArticleDraftOutput(
            title=title,
            slug=slug,
            frontmatter=frontmatter,
            markdown_content=sanitized_body,
            word_count=words,
            reading_time=f"{read_mins} min read",
            banned_words_detected=detected_banned
        )

        return draft_output, usage


blog_writer = BlogWriterAgent()
