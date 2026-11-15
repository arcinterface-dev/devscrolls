"""
End-to-End Acceptance Test Suite (Phase 13).
Validates the 8 core operational and architectural invariants:
1. Zero-Cost Budget Guardrail Verification
2. Two-Stage Confirmation Gate Invariant
3. Personal Opinion & War Story Protection
4. Critical Technical Fact-Check Contradiction Gate
5. Astro Zod Frontmatter & Quality Compliance
6. Astro Codebase Isolation & GitHub REST API Publishing
7. Crash Recovery on Server Restart
8. Knowledge Feedback Loop (Publishing -> Indexing -> Retrieval)
"""

import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.config.limits import (
    DAILY_TOKEN_BUDGET_GEMINI,
    MONTHLY_TAVILY_CREDIT_BUDGET,
    RESEARCH_CREDITS_PER_ARTICLE,
    JOB_STALE_TIMEOUT_MINUTES
)
from app.schemas.article import AstroFrontmatter
from app.schemas.database import GenerationJob, BlogDraft, InputSession, PersonalKnowledge
from app.schemas.factcheck import FactCheckOutput, ClaimVerification, ClaimVerificationStatus, MajorCorrection
from app.schemas.perspective import ClassifiedClaim
from app.schemas.research import ResearchOutput
from app.publishing.article_validator import article_validator
from app.publishing.github_publisher import GitHubPublisher
from app.knowledge.knowledge_extractor import KnowledgeExtractor
from app.knowledge.retrieval import KnowledgeRetriever
from app.workers.recovery import run_startup_recovery
from app.telegram.callbacks import _handle_audio_confirm, _handle_transcript_confirm


# ==============================================================================
# Scenario 1: Zero-Cost Budget Guardrail Verification
# ==============================================================================
def test_scenario_1_budget_guardrails():
    """Verify that hardcoded free-tier limits protect against runaway spending."""
    assert DAILY_TOKEN_BUDGET_GEMINI > 0
    assert MONTHLY_TAVILY_CREDIT_BUDGET <= 1000
    assert RESEARCH_CREDITS_PER_ARTICLE <= 120
    assert JOB_STALE_TIMEOUT_MINUTES == 30


# ==============================================================================
# Scenario 2: Two-Stage Confirmation Gate Invariant
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_2_two_stage_confirmation_gates():
    """Verify that NO AI processing or transcription occurs prior to explicit button confirmations."""
    session_id = str(uuid4())
    conv_id = str(uuid4())

    mock_session = MagicMock(spec=InputSession)
    mock_session.id = session_id
    mock_session.conversation_id = conv_id
    mock_session.telegram_file_id = "voice_file_123"
    mock_session.transcript_status = "pending"

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    # Gate 1: Confirm Audio
    with patch("app.telegram.callbacks.session_repo.get_by_id", AsyncMock(return_value=mock_session)), \
         patch("app.telegram.callbacks.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.telegram.callbacks.transcription_service.transcribe_voice_note", AsyncMock(return_value=("Transcribed text", MagicMock()))), \
         patch("app.telegram.callbacks.session_repo.update_transcription", AsyncMock()), \
         patch("app.telegram.callbacks.conv_repo.update_status", AsyncMock()) as mock_conv_update, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.edit_message_text", AsyncMock()):

        await _handle_audio_confirm("cb1", 1234, 5678, 5435882029, session_id)
        mock_conv_update.assert_awaited_once_with(conv_id, "active", "transcript_review_pending")

    # Gate 2: Confirm Transcript (Only here is the job enqueued)
    with patch("app.telegram.callbacks.session_repo.get_by_id", AsyncMock(return_value=mock_session)), \
         patch("app.telegram.callbacks.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.telegram.callbacks.session_repo.confirm_transcript", AsyncMock()) as mock_confirm_tx, \
         patch("app.telegram.callbacks.job_repo.create_job", AsyncMock(return_value=MagicMock(id=uuid4()))) as mock_create_job, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()), \
         patch("app.telegram.callbacks.bot_client.edit_message_text", AsyncMock()), \
         patch("app.workers.job_processor.job_processor.run_worker_cycle", AsyncMock()):

        await _handle_transcript_confirm("cb2", 1234, 5678, 5435882029, session_id)
        mock_confirm_tx.assert_awaited_once_with(session_id)
        mock_create_job.assert_awaited_once_with(conv_id)


# ==============================================================================
# Scenario 3: Personal Opinion & War Story Protection
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_3_opinion_and_war_story_protection():
    """Verify that author opinions and experiences cannot be marked CONTRADICTED or block writing."""
    from app.ai.agents.fact_checker import FactCheckerAgent

    mock_provider = MagicMock()
    # Mock LLM trying to falsely contradict an opinion
    mock_provider.generate_structured = AsyncMock(return_value=(
        FactCheckOutput(
            verifications=[
                ClaimVerification(
                    claim_text="I believe microfrontends introduce more organizational pain than they solve",
                    status=ClaimVerificationStatus.CONTRADICTED,
                    confidence_score=0.9,
                    explanation="Many enterprises use them."
                )
            ],
            overall_accuracy_score=0.5,
            major_corrections=[
                MajorCorrection(
                    claim="I believe microfrontends introduce more organizational pain than they solve",
                    reason="Disputed",
                    contradicting_source="https://microfrontends.com",
                    suggested_remedy="Tone down"
                )
            ],
            minor_corrections=[],
            proceed_to_writing=False,
            human_approval_required=True
        ),
        MagicMock(prompt_tokens=100, completion_tokens=50)
    ))

    checker = FactCheckerAgent(provider=mock_provider)
    claims = [
        ClassifiedClaim(
            statement="I believe microfrontends introduce more organizational pain than they solve",
            claim_type="personal_opinion",
            requires_research=False,
            context="Architecture take"
        )
    ]
    empty_research = ResearchOutput(research_summary="N/A", claims_researched=[])

    output, _ = await checker.verify(claims, empty_research, "Microfrontends")

    # Invariants must protect opinion
    assert output.verifications[0].status == ClaimVerificationStatus.PERSONAL_OPINION
    assert len(output.major_corrections) == 0
    assert output.proceed_to_writing is True
    assert output.human_approval_required is False


# ==============================================================================
# Scenario 4: Critical Technical Fact-Check Contradiction Gate
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_4_technical_fact_contradiction_gate():
    """Verify that an objective technical contradiction raises a MajorCorrection and halts pipeline."""
    from app.ai.agents.fact_checker import FactCheckerAgent

    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        FactCheckOutput(
            verifications=[
                ClaimVerification(
                    claim_text="React Server Components run in client browser DOM",
                    status=ClaimVerificationStatus.CONTRADICTED,
                    confidence_score=0.99,
                    evidence_sources=["https://react.dev"],
                    explanation="RSC runs solely on the server."
                )
            ],
            overall_accuracy_score=0.2,
            major_corrections=[
                MajorCorrection(
                    claim="React Server Components run in client browser DOM",
                    reason="Directly contradicts React documentation.",
                    contradicting_source="https://react.dev/reference/rsc",
                    suggested_remedy="State that RSC renders solely on the server."
                )
            ],
            minor_corrections=[],
            proceed_to_writing=False,
            human_approval_required=True
        ),
        MagicMock(prompt_tokens=100, completion_tokens=50)
    ))

    checker = FactCheckerAgent(provider=mock_provider)
    claims = [
        ClassifiedClaim(
            statement="React Server Components run in client browser DOM",
            claim_type="technical_fact",
            requires_research=True,
            context="Execution model"
        )
    ]
    empty_research = ResearchOutput(research_summary="Official specs", claims_researched=[])

    output, _ = await checker.verify(claims, empty_research, "RSC Execution")
    assert len(output.major_corrections) == 1
    assert output.human_approval_required is True
    assert output.proceed_to_writing is False


# ==============================================================================
# Scenario 5: Astro Zod Frontmatter & DevScrolls Quality Compliance
# ==============================================================================
def test_scenario_5_astro_zod_compliance():
    """Verify strict frontmatter schema compliance, banned word scrubbing, and emoji stripping."""
    # Frontmatter compliance
    fm = AstroFrontmatter(
        title="Why React Server Components Won't Save Your Architecture",
        description="A deep look into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        publishDate="2026-11-14",
        category="frontend",
        tags=["react", "performance"],
        heroImage="/rsc-hero.webp",
        heroImageAlt="Architecture diagram",
        draft=False,
        canonical="https://devscrolls.dev/articles/rsc-hero/"
    )
    assert len(fm.title) <= 70
    assert 100 <= len(fm.description) <= 160
    assert fm.category in ["frontend", "backend", "ai", "architecture", "interviews", "tutorials"]

    # Article validator enforcing banned words & heading emojis
    body = (
        "**React Server Components optimize data serialization.**\n\n"
        "## Clean Heading Without Emojis\n"
        "This is resilient and frictionless code without banned words."
    )
    is_valid, formatted, errors = article_validator.validate_and_format(
        title=fm.title,
        slug="rsc-hero",
        markdown_content=body,
        frontmatter_dict=fm.model_dump()
    )
    assert is_valid is True
    assert len(errors) == 0


# ==============================================================================
# Scenario 6: Astro Codebase Isolation & GitHub API Publishing
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_6_github_rest_api_isolation():
    """Verify that publishing is executed strictly via GitHub REST API without local file modification."""
    publisher = GitHubPublisher(token="ghp_mock_token")

    mock_resp_sha = MagicMock(status_code=404)
    mock_resp_put = MagicMock(
        status_code=201,
        json=MagicMock(return_value={"commit": {"sha": "sha_e2e_12345", "html_url": "https://github.com/..."}})
    )

    with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp_sha)), \
         patch("httpx.AsyncClient.put", AsyncMock(return_value=mock_resp_put)) as mock_put, \
         patch.object(publisher.publishing_repo, "create_publishing_job", AsyncMock()), \
         patch.object(publisher.publishing_repo, "update_status", AsyncMock()):

        success, res = await publisher.publish_article(
            slug="astro-5-deep-dive",
            title="Astro 5 Deep Dive",
            file_content="---\ntitle: Astro 5 Deep Dive\n---\n\nBody content"
        )

        assert success is True
        assert res["commit_sha"] == "sha_e2e_12345"
        call_kwargs = mock_put.call_args[1]
        assert call_kwargs["json"]["branch"] == "main"
        # Content must be valid base64
        decoded = base64.b64decode(call_kwargs["json"]["content"]).decode("utf-8")
        assert "Astro 5 Deep Dive" in decoded


# ==============================================================================
# Scenario 7: Crash Recovery on Server Restart
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_7_crash_recovery_resumption():
    """Verify that startup crash recovery resets stale processing jobs to queued."""
    stale_job = GenerationJob(
        id=str(uuid4()),
        conversation_id=str(uuid4()),
        current_stage="research",
        status="processing",
        retry_count=0
    )

    with patch("app.workers.recovery.job_queue.recover_stale_jobs", AsyncMock(return_value=[stale_job])), \
         patch("app.workers.recovery.job_processor.run_worker_cycle", AsyncMock()) as mock_cycle:

        recovered_count = await run_startup_recovery(timeout_minutes=30)
        assert recovered_count == 1
        mock_cycle.assert_awaited_once()


# ==============================================================================
# Scenario 8: Knowledge Feedback Loop
# ==============================================================================
@pytest.mark.asyncio
async def test_scenario_8_knowledge_feedback_loop():
    """Verify that publishing indexes knowledge and subsequent perspective analysis retrieves it."""
    # 1. Extraction from published post
    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        KnowledgeExtractionOutput(
            summary="Key insight",
            units=[
                KnowledgeUnit(
                    topic="Astro Content Layer",
                    knowledge_type="opinion",
                    statement="Content Layer turns static markdown collections into typed queries.",
                    context="Build time reduced significantly.",
                    tags=["astro"]
                )
            ]
        ),
        MagicMock()
    ))

    extractor = KnowledgeExtractor(provider=mock_provider)
    mock_entry = MagicMock(spec=PersonalKnowledge)
    mock_entry.topic = "Astro Content Layer"
    mock_entry.knowledge_type = "opinion"
    mock_entry.original_content = "Content Layer turns static markdown collections into typed queries."
    mock_entry.corrected_content = "Build time reduced significantly."
    mock_entry.metadata = {"tags": ["astro"]}

    with patch.object(extractor.knowledge_repo, "store_knowledge", AsyncMock(return_value=mock_entry)):
        saved = await extractor.extract_and_index("Markdown body", "Astro 5", "astro-5")
        assert len(saved) == 1

    # 2. Retrieval in future perspective analysis
    retriever = KnowledgeRetriever()
    with patch.object(retriever.knowledge_repo, "search_knowledge", AsyncMock(return_value=[mock_entry])):
        res = await retriever.retrieve_relevant_knowledge("Astro Content Layer")
        assert len(res.matching_units) == 1
        assert "Content Layer turns static markdown collections" in res.formatted_prompt_block
