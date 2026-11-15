"""
Unit and integration test suite for Phase 12: Personal Knowledge Library.
Tests:
- Extraction of reusable opinions, war stories, and architectural stances from articles.
- Persistence into automation.personal_knowledge.
- Topic-based search and prompt block formatting for agent injection.
- End-to-end integration: Stage 1 retrieval and Stage 5 post-publish indexing.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.knowledge import KnowledgeExtractionOutput, KnowledgeUnit
from app.schemas.database import PersonalKnowledge, BlogDraft, GenerationJob
from app.knowledge.knowledge_extractor import KnowledgeExtractor
from app.knowledge.retrieval import KnowledgeRetriever
from app.ai.agents.stage_handlers import handle_perspective_analysis_stage, handle_publishing_stage


@pytest.mark.asyncio
async def test_knowledge_extractor_extract_and_index():
    """Verify KnowledgeExtractor extracts units and saves them via KnowledgeRepository."""
    mock_provider = MagicMock()
    mock_provider.generate_structured = AsyncMock(return_value=(
        KnowledgeExtractionOutput(
            summary="Key lessons from server actions in production.",
            units=[
                KnowledgeUnit(
                    topic="React Server Actions",
                    knowledge_type="opinion",
                    statement="Server actions should not be used as generic REST API replacements.",
                    context="They couple UI lifecycle directly to server mutation endpoints.",
                    tags=["react", "architecture"]
                ),
                KnowledgeUnit(
                    topic="Kafka Microservices",
                    knowledge_type="experience",
                    statement="Cold-start latency doubled until dedicated connection pooling was deployed.",
                    context="During the Q3 2025 migration incident.",
                    tags=["kafka", "performance"]
                )
            ]
        ),
        MagicMock(prompt_tokens=200, completion_tokens=100)
    ))

    extractor = KnowledgeExtractor(provider=mock_provider)

    mock_pk = MagicMock(spec=PersonalKnowledge)
    mock_pk.id = uuid4()
    mock_pk.topic = "React Server Actions"

    with patch.object(extractor.knowledge_repo, "store_knowledge", AsyncMock(return_value=mock_pk)) as mock_store:
        results = await extractor.extract_and_index(
            markdown_content="**BLUF.**\n\nArticle content about server actions and Kafka.",
            title="React Server Actions in Production",
            slug="react-server-actions-prod"
        )

        assert len(results) == 2
        assert mock_store.await_count == 2
        first_call = mock_store.call_args_list[0][1]
        assert first_call["topic"] == "React Server Actions"
        assert first_call["knowledge_type"] == "opinion"


@pytest.mark.asyncio
async def test_knowledge_retriever_formatting():
    """Verify KnowledgeRetriever searches repository and formats clean prompt block."""
    retriever = KnowledgeRetriever()

    mock_entry = MagicMock(spec=PersonalKnowledge)
    mock_entry.topic = "React Server Components"
    mock_entry.knowledge_type = "opinion"
    mock_entry.original_content = "Server components are a data serialization protocol, not an HTML renderer."
    mock_entry.corrected_content = "They emit flight data streams line by line."
    mock_entry.metadata = {"tags": ["react", "rsc"]}

    with patch.object(retriever.knowledge_repo, "search_knowledge", AsyncMock(return_value=[mock_entry])):
        res = await retriever.retrieve_relevant_knowledge("React Server Components")

        assert len(res.matching_units) == 1
        assert res.matching_units[0].topic == "React Server Components"
        assert "AUTHOR'S HISTORICAL PERSPECTIVE" in res.formatted_prompt_block
        assert "Server components are a data serialization protocol" in res.formatted_prompt_block


@pytest.mark.asyncio
async def test_handle_perspective_stage_knowledge_integration():
    """Verify handle_perspective_analysis_stage queries knowledge and passes it to analyst."""
    conv_id = str(uuid4())
    job_id = str(uuid4())

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    mock_session = MagicMock()
    mock_session.effective_transcript = "I've been thinking about React server components and how people misunderstand them."

    mock_job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        current_stage="perspective_analysis",
        status="processing"
    )

    mock_output = MagicMock()
    mock_output.clarification_questions = []
    mock_output.proposed_title = "RSC Mental Model"
    mock_output.article_type = "frontend"
    mock_output.target_audience = "Senior Engineers"
    mock_output.claims = []
    mock_output.model_dump.return_value = {"proposed_title": "RSC Mental Model"}

    mock_knowledge_ctx = MagicMock()
    mock_knowledge_ctx.matching_units = [
        KnowledgeUnit(
            topic="RSC",
            knowledge_type="opinion",
            statement="Flight protocol",
            context="Stream lines",
            tags=[]
        )
    ]

    with patch("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.ai.agents.stage_handlers.session_repo.get_latest_session", AsyncMock(return_value=mock_session)), \
         patch("app.knowledge.retrieval.knowledge_retriever.retrieve_relevant_knowledge", AsyncMock(return_value=mock_knowledge_ctx)) as mock_retrieve, \
         patch("app.ai.agents.stage_handlers.perspective_analyst.analyze", AsyncMock(return_value=(mock_output, None))) as mock_analyze, \
         patch("app.ai.agents.stage_handlers.job_queue.advance_stage", AsyncMock()), \
         patch("app.ai.agents.stage_handlers.bot_client.send_message", AsyncMock()):

        await handle_perspective_analysis_stage(mock_job)

        mock_retrieve.assert_awaited_once()
        mock_analyze.assert_awaited_once()
        call_kwargs = mock_analyze.call_args[1]
        assert call_kwargs["previous_knowledge"] is not None
        assert call_kwargs["previous_knowledge"][0]["topic"] == "RSC"
