"""
Unit and integration test suite for Agent 3: Fact Checker and Critical Reviewer (Phase 7).
Tests:
- Absolute protection of personal opinions and lived experiences from false contradictions.
- Verification of objective technical facts against research evidence.
- Major correction generation and human confirmation gate activation.
- Minor correction non-blocking advancement.
- Stage handler database updates and Telegram notification routing.
- Callback handlers for accepting/overriding major corrections.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.perspective import ClassifiedClaim
from app.schemas.research import ResearchOutput, ClaimResearch, ResearchSourceItem
from app.schemas.factcheck import (
    FactCheckOutput,
    ClaimVerification,
    ClaimVerificationStatus,
    MajorCorrection,
    MinorCorrection
)
from app.schemas.database import GenerationJob, JobStage, JobStatus
from app.ai.agents.fact_checker import FactCheckerAgent
from app.ai.agents.stage_handlers import handle_fact_check_stage
from app.telegram.callbacks import _handle_corr_accept, _handle_corr_override, _handle_corr_cancel


@pytest.fixture
def sample_research_output():
    """Provides a sample synthesized research output."""
    return ResearchOutput(
        research_summary="React Server Components run exclusively on the server.",
        claims_researched=[
            ClaimResearch(
                claim_id="c1",
                original_statement="React Server Components execute in the browser DOM",
                search_queries=["React Server Components execution model"],
                sources=[
                    ResearchSourceItem(
                        source_title="React Docs - Server Components",
                        source_url="https://react.dev/reference/rsc/server-components",
                        source_type="official_docs",
                        relevant_excerpt="Server Components never ship client-side JavaScript to the browser.",
                        reliability_score=1.0
                    )
                ],
                supporting_evidence=[],
                contradictory_evidence=["Official docs state RSC code never runs on the client."],
                research_verdict="Directly contradicted by React core documentation."
            )
        ],
        total_searches=1,
        credits_consumed=1,
        limitations=[]
    )


@pytest.mark.asyncio
async def test_opinion_and_experience_protection():
    """Verify that personal opinions and experiences cannot be marked CONTRADICTED or block the pipeline."""
    mock_provider = MagicMock()

    # Suppose the LLM accidentally tried to contradict an opinion
    mock_provider.generate_structured = AsyncMock(return_value=(
        FactCheckOutput(
            verifications=[
                ClaimVerification(
                    claim_text="I feel that GraphQL is overengineered for 90% of web apps",
                    status=ClaimVerificationStatus.CONTRADICTED,  # Model tried to contradict!
                    confidence_score=0.9,
                    evidence_sources=["https://graphql.org"],
                    explanation="Many companies find GraphQL beneficial."
                ),
                ClaimVerification(
                    claim_text="In our microservices cluster, Kafka added 300ms latency overhead",
                    status=ClaimVerificationStatus.CONTRADICTED,  # Model tried to contradict!
                    confidence_score=0.85,
                    evidence_sources=["https://kafka.apache.org"],
                    explanation="Kafka is high-throughput."
                )
            ],
            overall_accuracy_score=0.5,
            major_corrections=[
                MajorCorrection(
                    claim="I feel that GraphQL is overengineered for 90% of web apps",
                    reason="GraphQL has wide adoption",
                    contradicting_source="https://graphql.org",
                    suggested_remedy="Tone it down"
                )
            ],
            minor_corrections=[],
            proceed_to_writing=False,
            human_approval_required=True,
            explanation_for_author="Need to fix opinions."
        ),
        MagicMock(prompt_tokens=100, completion_tokens=50, total_tokens=150, estimated_cost=0.0, model="mock")
    ))

    agent = FactCheckerAgent(provider=mock_provider)

    claims = [
        ClassifiedClaim(
            statement="I feel that GraphQL is overengineered for 90% of web apps",
            claim_type="personal_opinion",
            requires_research=False,
            context="Architecture trade-off discussion"
        ),
        ClassifiedClaim(
            statement="In our microservices cluster, Kafka added 300ms latency overhead",
            claim_type="personal_experience",
            requires_research=False,
            context="Production war story"
        )
    ]

    empty_research = ResearchOutput(
        research_summary="Opinions and experience",
        claims_researched=[],
        total_searches=0,
        credits_consumed=0
    )

    output, _ = await agent.verify(claims, empty_research, "GraphQL vs REST")

    # Invariants must enforce protection:
    assert output.verifications[0].status == ClaimVerificationStatus.PERSONAL_OPINION
    assert output.verifications[1].status == ClaimVerificationStatus.PERSONAL_EXPERIENCE
    # Major correction against opinion must be stripped
    assert len(output.major_corrections) == 0
    assert output.human_approval_required is False
    assert output.proceed_to_writing is True


@pytest.mark.asyncio
async def test_major_technical_contradiction(sample_research_output):
    """Verify that an objective technical contradiction raises MajorCorrection and blocks pipeline."""
    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        FactCheckOutput(
            verifications=[
                ClaimVerification(
                    claim_text="React Server Components execute in the browser DOM",
                    status=ClaimVerificationStatus.CONTRADICTED,
                    confidence_score=0.99,
                    evidence_sources=["https://react.dev/reference/rsc/server-components"],
                    explanation="RSC never ships client code to the browser.",
                    suggested_revision="React Server Components execute strictly on the server or at build time."
                )
            ],
            overall_accuracy_score=0.2,
            major_corrections=[
                MajorCorrection(
                    claim="React Server Components execute in the browser DOM",
                    reason="RSC runs solely on the server; zero bundle shipped to browser.",
                    contradicting_source="https://react.dev/reference/rsc/server-components",
                    suggested_remedy="Clarify that RSC renders on the server and streams HTML/JSON to the client."
                )
            ],
            minor_corrections=[],
            proceed_to_writing=False,
            human_approval_required=True,
            explanation_for_author="RSC execution model requires correction to prevent technical misstatement."
        ),
        MagicMock(prompt_tokens=200, completion_tokens=100, total_tokens=300, estimated_cost=0.0, model="mock")
    ))

    agent = FactCheckerAgent(provider=mock_provider)

    claims = [
        ClassifiedClaim(
            statement="React Server Components execute in the browser DOM",
            claim_type="technical_fact",
            requires_research=True,
            context="Explaining RSC mechanics"
        )
    ]

    output, _ = await agent.verify(claims, sample_research_output, "Understanding React Server Components")

    assert len(output.major_corrections) == 1
    assert output.human_approval_required is True
    assert output.proceed_to_writing is False
    assert output.verifications[0].status == ClaimVerificationStatus.CONTRADICTED


@pytest.mark.asyncio
async def test_minor_correction_does_not_block():
    """Verify that minor nuances don't block writing."""
    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        FactCheckOutput(
            verifications=[
                ClaimVerification(
                    claim_text="useActionState was added in React 19",
                    status=ClaimVerificationStatus.VERIFIED,
                    confidence_score=0.95,
                    evidence_sources=["https://react.dev"],
                    explanation="Confirmed in React 19 changelog."
                )
            ],
            overall_accuracy_score=0.95,
            major_corrections=[],
            minor_corrections=[
                MinorCorrection(
                    claim="useActionState was added in React 19",
                    suggested_nuance="Formerly called useFormState in canary builds",
                    note="Helpful historical context for readers"
                )
            ],
            proceed_to_writing=True,
            human_approval_required=False,
            explanation_for_author="All facts verified; added slight nuance."
        ),
        MagicMock(prompt_tokens=150, completion_tokens=50, total_tokens=200, estimated_cost=0.0, model="mock")
    ))

    agent = FactCheckerAgent(provider=mock_provider)
    claims = [
        ClassifiedClaim(
            statement="useActionState was added in React 19",
            claim_type="technical_fact",
            requires_research=True,
            context="React 19 hooks"
        )
    ]
    empty_research = ResearchOutput(
        research_summary="Verified React 19 hooks.",
        claims_researched=[],
        total_searches=0,
        credits_consumed=0
    )

    output, _ = await agent.verify(claims, empty_research, "React 19 Action Hooks")
    assert output.proceed_to_writing is True
    assert output.human_approval_required is False
    assert len(output.minor_corrections) == 1


@pytest.mark.asyncio
async def test_handle_fact_check_stage_clean():
    """Verify handle_fact_check_stage advances clean job to writing stage and alerts author."""
    job_id = str(uuid4())
    conv_id = str(uuid4())

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        current_stage="fact_check",
        status="processing",
        perspective_output={
            "proposed_title": "Understanding Event Loops",
            "claims": [
                {
                    "statement": "Microtasks run before macrotasks in the Node.js event loop tick",
                    "claim_type": "technical_fact",
                    "requires_research": True,
                    "context": "Async execution order"
                }
            ]
        },
        research_output={
            "research_summary": "Confirmed event loop tick execution semantics.",
            "claims_researched": [],
            "total_searches": 1,
            "credits_consumed": 1,
            "limitations": []
        }
    )

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    mock_db_claim = MagicMock()
    mock_db_claim.id = str(uuid4())
    mock_db_claim.claim_text = "Microtasks run before macrotasks in the Node.js event loop tick"

    clean_output = FactCheckOutput(
        verifications=[
            ClaimVerification(
                claim_text="Microtasks run before macrotasks in the Node.js event loop tick",
                status=ClaimVerificationStatus.VERIFIED,
                confidence_score=0.98,
                evidence_sources=["https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"],
                explanation="Confirmed by Node.js official docs."
            )
        ],
        overall_accuracy_score=0.98,
        major_corrections=[],
        minor_corrections=[],
        proceed_to_writing=True,
        human_approval_required=False
    )

    with patch("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.ai.agents.stage_handlers.claim_repo.get_claims_for_job", AsyncMock(return_value=[mock_db_claim])), \
         patch("app.ai.agents.stage_handlers.claim_repo.update_claim_verification", AsyncMock()) as mock_update_claim, \
         patch("app.ai.agents.stage_handlers.fact_checker.verify", AsyncMock(return_value=(clean_output, None))), \
         patch("app.ai.agents.stage_handlers.job_queue.advance_stage", AsyncMock()) as mock_advance, \
         patch("app.ai.agents.stage_handlers.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await handle_fact_check_stage(job)

        mock_update_claim.assert_awaited_once()
        mock_advance.assert_awaited_once_with(
            job_id=job_id,
            completed_stage="fact_check",
            next_stage="writing",
            stage_output=clean_output.model_dump()
        )
        mock_send_msg.assert_awaited_once()
        sent_text = mock_send_msg.call_args[1]["text"]
        assert "Fact Check Complete" in sent_text
        assert "98%" in sent_text


@pytest.mark.asyncio
async def test_handle_fact_check_stage_major_correction_pauses():
    """Verify handle_fact_check_stage pauses job when major correction detected."""
    job_id = str(uuid4())
    conv_id = str(uuid4())

    job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        current_stage="fact_check",
        status="processing",
        perspective_output={
            "proposed_title": "React Server Components",
            "claims": [
                {
                    "statement": "RSC runs on client",
                    "claim_type": "technical_fact",
                    "requires_research": True,
                    "context": "Execution context"
                }
            ]
        },
        research_output={
            "research_summary": "RSC runs on server only.",
            "claims_researched": [],
            "total_searches": 1,
            "credits_consumed": 1
        }
    )

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    contradicted_output = FactCheckOutput(
        verifications=[
            ClaimVerification(
                claim_text="RSC runs on client",
                status=ClaimVerificationStatus.CONTRADICTED,
                confidence_score=0.99,
                evidence_sources=["https://react.dev"],
                explanation="RSC runs only on server."
            )
        ],
        overall_accuracy_score=0.1,
        major_corrections=[
            MajorCorrection(
                claim="RSC runs on client",
                reason="Server Components never execute client side.",
                contradicting_source="https://react.dev",
                suggested_remedy="State that RSC executes on the server."
            )
        ],
        minor_corrections=[],
        proceed_to_writing=False,
        human_approval_required=True,
        explanation_for_author="Need confirmation on RSC execution model."
    )

    with patch("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.ai.agents.stage_handlers.claim_repo.get_claims_for_job", AsyncMock(return_value=[])), \
         patch("app.ai.agents.stage_handlers.fact_checker.verify", AsyncMock(return_value=(contradicted_output, None))), \
         patch("app.ai.agents.stage_handlers.job_queue.pause_for_user_action", AsyncMock()) as mock_pause, \
         patch("app.ai.agents.stage_handlers.conv_repo.update_status", AsyncMock()) as mock_conv_update, \
         patch("app.ai.agents.stage_handlers.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await handle_fact_check_stage(job)

        mock_pause.assert_awaited_once_with(
            job_id=job_id,
            status="awaiting_approval",
            reason="Awaiting review of 1 major technical corrections."
        )
        mock_conv_update.assert_awaited_once_with(conv_id, "active", "awaiting_approval")
        mock_send_msg.assert_awaited_once()
        assert "Technical Fact-Check Alert" in mock_send_msg.call_args[1]["text"]
        assert mock_send_msg.call_args[1]["reply_markup"] is not None


@pytest.mark.asyncio
async def test_correction_callbacks():
    """Verify corr_accept, corr_override, and corr_cancel callbacks."""
    job_id = str(uuid4())
    conv_id = str(uuid4())
    mock_job = MagicMock()
    mock_job.id = job_id
    mock_job.conversation_id = conv_id

    with patch("app.telegram.callbacks.job_repo.get_by_id", AsyncMock(return_value=mock_job)), \
         patch("app.telegram.callbacks.job_repo.update_stage_output", AsyncMock()) as mock_stage_update, \
         patch("app.telegram.callbacks.job_repo.set_job_status", AsyncMock()) as mock_status_update, \
         patch("app.telegram.callbacks.conv_repo.update_status", AsyncMock()) as mock_conv_update, \
         patch("app.telegram.callbacks.bot_client.answer_callback_query", AsyncMock()) as mock_answer, \
         patch("app.telegram.callbacks.bot_client.edit_message_text", AsyncMock()) as mock_edit_msg, \
         patch("app.workers.job_processor.job_processor.run_worker_cycle", AsyncMock()):

        # Test corr_accept
        await _handle_corr_accept("cb1", 1234, 5678, 5435882029, job_id)
        mock_stage_update.assert_awaited_with(job_id, "writing", {})
        mock_status_update.assert_awaited_with(job_id, "queued")
        assert "Corrections Accepted" in mock_edit_msg.call_args[1]["text"]

        # Test corr_override
        await _handle_corr_override("cb2", 1234, 5678, 5435882029, job_id)
        mock_status_update.assert_awaited_with(job_id, "queued")
        assert "Original Take Retained" in mock_edit_msg.call_args[1]["text"]

        # Test corr_cancel
        await _handle_corr_cancel("cb3", 1234, 5678, 5435882029, job_id)
        mock_status_update.assert_awaited_with(job_id, "cancelled")
        mock_conv_update.assert_awaited_with(conv_id, "cancelled", None)
        assert "Cancelled" in mock_edit_msg.call_args[1]["text"]
