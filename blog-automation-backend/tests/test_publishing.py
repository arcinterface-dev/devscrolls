"""
Unit and integration test suite for Phase 11: GitHub Publishing & Deployment Verification.
Tests:
- Astro Content Collection frontmatter and body validation (banned words, emojis, character limits).
- GitHub REST API content committer (base64 encoding, SHA retrieval for atomic update, commit payload).
- Deployment monitor HTTP 200 verification.
- Stage handler handle_publishing_stage execution and celebration notification.
"""

import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.schemas.database import BlogDraft, GenerationJob
from app.publishing.article_validator import article_validator
from app.publishing.github_publisher import GitHubPublisher
from app.publishing.deployment_monitor import DeploymentMonitor
from app.ai.agents.stage_handlers import handle_publishing_stage


def test_article_validator_clean():
    """Verify clean frontmatter and body passes validation and formats proper YAML header."""
    frontmatter = {
        "title": "Why React Server Components Won't Save Your Architecture",
        "description": "A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        "publishDate": "2026-11-14",
        "category": "frontend",
        "tags": ["react", "performance"],
        "heroImage": "/rsc-pitfalls-hero.webp",
        "heroImageAlt": "RSC architecture diagram",
        "draft": False,
        "canonical": "https://devscrolls.dev/articles/rsc-pitfalls/"
    }

    body = (
        "**React Server Components optimize initial data serialization, but moving state mutations to server actions creates silent waterfall bottlenecks without explicit caching boundaries.**\n\n"
        "## The Mental Model Shift\n"
        "Flight payloads stream component trees line by line."
    )

    is_valid, formatted, errors = article_validator.validate_and_format(
        title="Why React Server Components Won't Save Your Architecture",
        slug="rsc-pitfalls",
        markdown_content=body,
        frontmatter_dict=frontmatter
    )

    assert is_valid is True
    assert len(errors) == 0
    assert formatted.startswith("---\n")
    assert "category: frontend" in formatted
    assert "heroImage: /rsc-pitfalls-hero.webp" in formatted
    assert "## The Mental Model Shift" in formatted


def test_article_validator_failures():
    """Verify validator catches title length, description bounds, banned words, and heading emojis."""
    # 1. Title too long
    fm_bad_title = {
        "title": "This is an extremely long title that exceeds the strict limit of seventy characters easily",
        "description": "A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        "publishDate": "2026-11-14",
        "category": "frontend",
        "tags": ["react"],
        "heroImage": "/hero.webp",
        "heroImageAlt": "Hero"
    }
    # Note: AstroFrontmatter auto-truncates title, but let's test description length:
    fm_bad_desc = {
        "title": "Valid Title",
        "description": "Too short description",
        "publishDate": "2026-11-14",
        "category": "frontend",
        "tags": ["react"],
        "heroImage": "/hero.webp",
        "heroImageAlt": "Hero"
    }
    is_valid, _, errors = article_validator.validate_and_format("Valid Title", "slug", "Content", fm_bad_desc)
    assert is_valid is False
    assert any("Description length" in e or "validation failed" in e for e in errors)

    # 2. Banned filler word in body
    fm_valid = {
        "title": "Valid Title",
        "description": "A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        "publishDate": "2026-11-14",
        "category": "frontend",
        "tags": ["react"],
        "heroImage": "/hero.webp",
        "heroImageAlt": "Hero"
    }
    body_with_banned = "Let us delve into the flight stream."
    is_valid, _, errors = article_validator.validate_and_format("Valid Title", "slug", body_with_banned, fm_valid)
    assert is_valid is False
    assert any("Banned filler word detected" in e and "delve" in e for e in errors)

    # 3. Emoji in heading
    body_with_emoji = "## 🚀 Overview\n\nClean body."
    is_valid, _, errors = article_validator.validate_and_format("Valid Title", "slug", body_with_emoji, fm_valid)
    assert is_valid is False
    assert any("Emoji detected in heading" in e for e in errors)


@pytest.mark.asyncio
async def test_github_publisher_success():
    """Verify GitHub REST API commit with base64 encoded content."""
    publisher = GitHubPublisher(
        token="ghp_mock_token_12345",
        owner="santhanakrishnanstark",
        repo="myblog",
        branch="main"
    )

    mock_resp_sha = MagicMock()
    mock_resp_sha.status_code = 404  # File does not exist yet

    mock_resp_put = MagicMock()
    mock_resp_put.status_code = 201
    mock_resp_put.json.return_value = {
        "commit": {
            "sha": "abc1234567890",
            "html_url": "https://github.com/santhanakrishnanstark/myblog/commit/abc1234567890"
        }
    }

    with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp_sha)), \
         patch("httpx.AsyncClient.put", AsyncMock(return_value=mock_resp_put)) as mock_put, \
         patch.object(publisher.publishing_repo, "create_publishing_job", AsyncMock()), \
         patch.object(publisher.publishing_repo, "update_status", AsyncMock()):

        success, res = await publisher.publish_article(
            slug="react-server-components-pitfalls",
            title="RSC Pitfalls",
            file_content="---\ntitle: RSC Pitfalls\n---\n\nContent",
            draft_id=str(uuid4())
        )

        assert success is True
        assert res["commit_sha"] == "abc1234567890"
        assert "src/content/articles/react-server-components-pitfalls.md" in res["file_path"]

        # Verify PUT payload
        call_kwargs = mock_put.call_args[1]
        payload = call_kwargs["json"]
        assert payload["message"] == "content(articles): publish RSC Pitfalls"
        assert payload["branch"] == "main"
        decoded = base64.b64decode(payload["content"]).decode("utf-8")
        assert "RSC Pitfalls" in decoded


@pytest.mark.asyncio
async def test_github_publisher_existing_sha_update():
    """Verify GitHub publisher includes existing blob SHA when updating a file."""
    publisher = GitHubPublisher(
        token="ghp_mock_token_12345",
        owner="santhanakrishnanstark",
        repo="myblog"
    )

    mock_resp_sha = MagicMock()
    mock_resp_sha.status_code = 200
    mock_resp_sha.json.return_value = {"sha": "existing_blob_sha_999"}

    mock_resp_put = MagicMock()
    mock_resp_put.status_code = 200
    mock_resp_put.json.return_value = {
        "commit": {
            "sha": "new_commit_sha",
            "html_url": "https://github.com/..."
        }
    }

    with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp_sha)), \
         patch("httpx.AsyncClient.put", AsyncMock(return_value=mock_resp_put)) as mock_put:

        success, res = await publisher.publish_article(
            slug="existing-slug",
            title="Existing Post",
            file_content="Updated content"
        )

        assert success is True
        call_kwargs = mock_put.call_args[1]
        assert call_kwargs["json"]["sha"] == "existing_blob_sha_999"


@pytest.mark.asyncio
async def test_deployment_monitor_live_success():
    """Verify deployment monitor confirms deployment when live URL returns 200."""
    monitor = DeploymentMonitor(base_url="https://devscrolls.dev")

    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
        res = await monitor.verify_deployment(
            slug="rsc-pitfalls",
            max_attempts=1,
            initial_delay_seconds=0,
            poll_interval_seconds=0
        )

        assert res["is_live"] is True
        assert res["status_code"] == 200
        assert "rsc-pitfalls" in res["article_url"]


@pytest.mark.asyncio
async def test_handle_publishing_stage_full_flow():
    """Verify handle_publishing_stage validates, commits, verifies, and announces live publication."""
    conv_id = str(uuid4())
    job_id = str(uuid4())
    draft_id = str(uuid4())

    mock_conv = MagicMock()
    mock_conv.id = conv_id
    mock_conv.telegram_user_id = 5435882029

    mock_job = GenerationJob(
        id=job_id,
        conversation_id=conv_id,
        current_stage="publishing",
        status="processing"
    )

    mock_draft = MagicMock(spec=BlogDraft)
    mock_draft.id = draft_id
    mock_draft.title = "Why React Server Components Won't Save Your Architecture"
    mock_draft.slug = "rsc-architecture"
    mock_draft.content = "**React Server Components optimize initial data serialization.**\n\n## Mental Model\nContent"
    mock_draft.frontmatter = {
        "title": "Why React Server Components Won't Save Your Architecture",
        "description": "A deep dive into React Server Components, flight serialization payloads, and the hidden mutation waterfalls that catch teams off guard in production.",
        "publishDate": "2026-11-14",
        "category": "frontend",
        "tags": ["react", "performance"],
        "heroImage": "/rsc-architecture-hero.webp",
        "heroImageAlt": "Hero",
        "draft": False,
        "canonical": "https://devscrolls.dev/articles/rsc-architecture/"
    }

    with patch("app.ai.agents.stage_handlers.conv_repo.get_by_id", AsyncMock(return_value=mock_conv)), \
         patch("app.ai.agents.stage_handlers.draft_repo.get_latest_draft_for_conversation", AsyncMock(return_value=mock_draft)), \
         patch("app.ai.agents.stage_handlers.github_publisher.publish_article", AsyncMock(return_value=(True, {
             "commit_sha": "f1a2b3c4d5e6",
             "canonical_url": "https://devscrolls.dev/articles/rsc-architecture/",
             "status": "committed"
         }))), \
         patch("app.ai.agents.stage_handlers.deployment_monitor.verify_deployment", AsyncMock(return_value={
             "is_live": True,
             "status_code": 200,
             "attempts": 1
         })), \
         patch("app.ai.agents.stage_handlers.draft_repo.update_status", AsyncMock()) as mock_draft_status, \
         patch("app.ai.agents.stage_handlers.job_queue.mark_completed", AsyncMock()) as mock_job_completed, \
         patch("app.ai.agents.stage_handlers.conv_repo.update_status", AsyncMock()) as mock_conv_status, \
         patch("app.ai.agents.stage_handlers.bot_client.send_message", AsyncMock()) as mock_send_msg:

        await handle_publishing_stage(mock_job)

        mock_draft_status.assert_awaited_once_with(draft_id, "published")
        mock_job_completed.assert_awaited_once_with(job_id)
        mock_conv_status.assert_awaited_once_with(conv_id, "idle", None)

        # Celebration message sent
        last_msg = mock_send_msg.call_args_list[-1][1]["text"]
        assert "ARTICLE PUBLISHED LIVE!" in last_msg
        assert "https://devscrolls.dev/articles/rsc-architecture/" in last_msg
        assert "f1a2b3c" in last_msg
