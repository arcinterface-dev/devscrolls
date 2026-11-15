"""
Unit and integration test suite for Agent 4: Blog Writer & Editorial Agent (Phase 8).
Tests:
- Astro Zod-compliant frontmatter schema enforcement.
- Banned filler words scrubbing.
- Strict heading emoji stripping.
- End-to-end draft generation and draft repository persistence.
- Stage handler integration with Telegram review keyboard and job pausing.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.article import (
    AstroFrontmatter,
    ArticleDraftOutput,
    EditorialReviewOutput,
    CategoryEnum,
    TagEnum
)
from app.schemas.perspective import PerspectiveOutput, ClassifiedClaim, OutlineSection
from app.schemas.research import ResearchOutput, ClaimResearch, ResearchSourceItem
from app.schemas.factcheck import FactCheckOutput, ClaimVerification, ClaimVerificationStatus
from app.schemas.database import GenerationJob, BlogDraft
from app.ai.agents.blog_writer import BlogWriterAgent, blog_writer
from app.ai.agents.stage_handlers import handle_writing_stage


@pytest.fixture
def mock_perspective():
    return PerspectiveOutput(
        article_objective="Deconstruct React Server Components vs Client Fetching",
        proposed_title="Why React Server Components Won't Save Your Architecture",
        main_argument="**React Server Components optimize initial data serialization, but moving state mutations to server actions creates silent waterfall bottlenecks without explicit caching boundaries.**",
        target_audience="Senior Frontend Engineers",
        article_type="frontend",
        personal_perspective="Frustrated by the hype claiming RSC eliminates state management.",
        important_observations=["Mutations require server roundtrips that spike latency."],
        technical_explanations=["RSC renders to an intermediate JSON stream, not HTML."],
        claims=[
            ClassifiedClaim(
                statement="RSC streams a flight payload, not raw HTML",
                claim_type="technical_fact",
                requires_research=True,
                context="Runtime protocol"
            )
        ],
        outline=[
            OutlineSection(
                heading="The Mental Model Shift",
                key_points=["Client components vs server components", "Flight payload serialization"]
            )
        ]
    )


@pytest.fixture
def mock_research():
    return ResearchOutput(
        research_summary="Verified React flight data protocol and server action semantics.",
        claims_researched=[
            ClaimResearch(
                claim_id="c1",
                original_statement="RSC streams a flight payload, not raw HTML",
                search_queries=["React RSC flight payload format"],
                sources=[
                    ResearchSourceItem(
                        source_title="React Architecture Docs",
                        source_url="https://react.dev/reference/rsc",
                        source_type="official_docs",
                        relevant_excerpt="Flight data streams serialized component trees.",
                        reliability_score=1.0
                    )
                ],
                supporting_evidence=["Flight stream serializes JSX trees into JSON-like lines."],
                contradictory_evidence=[],
                research_verdict="Confirmed."
            )
        ],
        total_searches=1,
        credits_consumed=1
    )


@pytest.fixture
def mock_factcheck():
    return FactCheckOutput(
        verifications=[
            ClaimVerification(
                claim_text="RSC streams a flight payload, not raw HTML",
                status=ClaimVerificationStatus.VERIFIED,
                confidence_score=0.99,
                evidence_sources=["https://react.dev/reference/rsc"],
                explanation="Confirmed by React architecture docs."
            )
        ],
        overall_accuracy_score=0.99,
        major_corrections=[],
        minor_corrections=[],
        proceed_to_writing=True,
        human_approval_required=False
    )


def test_astro_frontmatter_validation():
    """Verify Astro frontmatter constraints (title length, description length, taxonomy)."""
    # Valid frontmatter
    fm = AstroFrontmatter(
        title="Why React Server Components Won't Save Your Architecture",
        description="A deep look into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        publishDate="2026-11-14",
        category="frontend",
        tags=["react", "performance"],
        heroImage="/rsc-pitfalls-hero.webp",
        heroImageAlt="Architecture diagram of server component flight stream",
        draft=False
    )
    assert len(fm.title) <= 70
    assert 100 <= len(fm.description) <= 160
    assert fm.category == "frontend"
    assert len(fm.tags) <= 5

    # Title truncation if over 70
    long_title = "This is an extremely long title that exceeds the strict limit of seventy characters easily"
    fm_truncated = AstroFrontmatter(
        title=long_title,
        description="A deep look into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        publishDate="2026-11-14",
        category="frontend",
        tags=["react"],
        heroImage="/hero.webp",
        heroImageAlt="Hero"
    )
    assert len(fm_truncated.title) <= 70
    assert fm_truncated.title.endswith("...")


def test_banned_words_and_emoji_sanitizer():
    """Verify that banned filler words and heading emojis are automatically sanitized."""
    agent = BlogWriterAgent(provider=MagicMock())

    raw_markdown = (
        "## 🚀 Getting Started with RSC\n\n"
        "Let us delve into the complex landscape of server actions. "
        "It provides a seamless and robust experience for modern teams. "
        "In conclusion, this is a real game-changer for frontend devs.\n\n"
        "### 💡 Under The Hood\n"
        "Here is the flight stream."
    )

    cleaned, banned_detected = agent._sanitize_markdown(raw_markdown)

    # Check that emojis were stripped from headings
    assert "## Getting Started with RSC" in cleaned
    assert "🚀" not in cleaned
    assert "### Under The Hood" in cleaned
    assert "💡" not in cleaned

    # Check that banned words were replaced
    assert "delve into" not in cleaned
    assert "examine the complex ecosystem" in cleaned
    assert "frictionless and resilient experience" in cleaned
    assert "in summary" in cleaned
    assert "turning point" in cleaned

    # Check detected words list
    assert any("delve" in w for w in banned_detected)
    assert any("robust" in w for w in banned_detected)


@pytest.mark.asyncio
async def test_blog_writer_write_draft(mock_perspective, mock_research, mock_factcheck):
    """Verify write_draft persists draft, computes word count, and builds valid Astro frontmatter."""
    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        ArticleDraftOutput(
            title="Why React Server Components Won't Save Your Architecture",
            slug="why-react-server-components-wont-save-architecture",
            frontmatter=AstroFrontmatter(
                title="Why React Server Components Won't Save Your Architecture",
                description="A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
                publishDate="2026-11-14",
                category="frontend",
                tags=["react", "performance"],
                heroImage="/why-react-server-components-wont-save-architecture-hero.webp",
                heroImageAlt="RSC Flight Architecture",
                draft=False
            ),
            markdown_content=(
                "**React Server Components optimize initial data serialization, but moving state mutations to server actions creates silent waterfall bottlenecks without explicit caching boundaries.**\n\n"
                "## The Mental Model Shift\n"
                "Senior engineers must look past marketing slides. Flight payloads stream component trees line by line."
            ),
            word_count=42,
            reading_time="1 min read",
            banned_words_detected=[]
        ),
        MagicMock(prompt_tokens=500, completion_tokens=300, total_tokens=800, estimated_cost=0.0, model="gemini-3.8-flash")
    ))

    agent = BlogWriterAgent(provider=mock_provider)

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = uuid4()
    mock_draft.slug = "why-react-server-components-wont-save-architecture"
    mock_draft.title = "Why React Server Components Won't Save Your Architecture"

    with patch.object(agent.draft_repo, "create_draft", AsyncMock(return_value=mock_draft)) as mock_create_draft, \
         patch.object(agent.usage_repo, "log_usage", AsyncMock()):

        conv_id = str(uuid4())
        job_id = str(uuid4())

        draft_output, persisted_draft, usage = await agent.write_draft(
            perspective=mock_perspective,
            research=mock_research,
            factcheck=mock_factcheck,
            job_id=job_id,
            conversation_id=conv_id,
            target_category="frontend"
        )

        assert draft_output.title == "Why React Server Components Won't Save Your Architecture"
        assert draft_output.frontmatter.category == "frontend"
        assert "react" in draft_output.frontmatter.tags
        assert persisted_draft.id == mock_draft.id
        mock_create_draft.assert_awaited_once()


@pytest.mark.asyncio
async def test_handle_writing_stage_flow(mock_perspective, mock_research, mock_factcheck):
    """Verify handle_writing_stage generates post, saves draft, alerts Telegram, and pauses job."""
    job_id = str(uuid4())
    conv_id = str(uuid4())

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        current_stage="writing",
        status="processing",
        perspective_output=mock_perspective.model_dump(),
        research_output=mock_research.model_dump(),
        factcheck_output=mock_factcheck.model_dump()
    )

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    mock_draft_output = ArticleDraftOutput(
        title="Why React Server Components Won't Save Your Architecture",
        slug="rsc-architecture",
        frontmatter=AstroFrontmatter(
            title="Why React Server Components Won't Save Your Architecture",
            description="A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
            publishDate="2026-11-14",
            category="frontend",
            tags=["react", "performance"],
            heroImage="/rsc-architecture-hero.webp",
            heroImageAlt="Hero",
            draft=False
        ),
        markdown_content="**React Server Components optimize data serialization.**\n\n## Section 1\nContent",
        word_count=500,
        reading_time="3 min read",
        banned_words_detected=[]
    )

    mock_persisted_draft = MagicMock(spec=BlogDraft)
    mock_persisted_draft.id = uuid4()

    with patch("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.ai.agents.stage_handlers.blog_writer.write_draft", AsyncMock(return_value=(mock_draft_output, mock_persisted_draft, None))), \
         patch("app.ai.agents.stage_handlers.job_queue.advance_stage", AsyncMock()) as mock_advance, \
         patch("app.ai.agents.stage_handlers.bot_client.send_message", AsyncMock()) as mock_send_msg, \
         patch("app.ai.agents.stage_handlers.job_queue.pause_for_user_action", AsyncMock()) as mock_pause, \
         patch("app.ai.agents.stage_handlers.conv_repo.update_status", AsyncMock()) as mock_update_conv:

        await handle_writing_stage(job)

        mock_advance.assert_awaited_once_with(
            job_id=job_id,
            completed_stage="writing",
            next_stage="editorial_review",
            stage_output=mock_draft_output.model_dump()
        )
        mock_pause.assert_awaited_once_with(
            job_id=job_id,
            status="awaiting_approval",
            reason="Draft completed. Awaiting author final review in Telegram."
        )
        mock_update_conv.assert_awaited_once_with(conv_id, "active", "awaiting_draft_approval")
        mock_send_msg.assert_awaited_once()

        sent_text = mock_send_msg.call_args[1]["text"]
        assert "Draft Complete: Ready for Your Review!" in sent_text
        assert "500 words" in sent_text
        assert mock_send_msg.call_args[1]["reply_markup"] is not None
