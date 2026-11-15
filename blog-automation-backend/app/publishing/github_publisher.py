"""
GitHub REST API Publisher for DevScrolls.
Directly commits approved articles to `src/content/articles/<slug>.md` via the
GitHub Contents API, preserving total filesystem isolation for the Astro blog.
"""

import base64
import logging
from typing import Any, Dict, Optional, Tuple
from uuid import UUID
import httpx

from app.config.settings import settings
from app.schemas.database import BlogDraft, PublishingJob
from app.storage.repositories import PublishingRepository

logger = logging.getLogger(__name__)


class GitHubPublisher:
    """Manages git commits to the DevScrolls blog repository via GitHub REST API."""

    def __init__(
        self,
        token: Optional[str] = None,
        owner: Optional[str] = None,
        repo: Optional[str] = None,
        branch: Optional[str] = None
    ):
        self.token = token or settings.GITHUB_TOKEN
        self.owner = owner or settings.GITHUB_REPO_OWNER
        self.repo = repo or settings.GITHUB_REPO_NAME
        self.branch = branch or settings.GITHUB_BRANCH
        self.publishing_repo = PublishingRepository()
        self.api_base = "https://api.github.com"

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def _get_existing_file_sha(self, path: str) -> Optional[str]:
        """Checks if a file already exists at path to retrieve its blob SHA."""
        if not self.token:
            return None

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{path}"
        params = {"ref": self.branch}

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(url, headers=self._get_headers(), params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("sha")
                elif resp.status_code == 404:
                    return None
                else:
                    logger.warning(f"Unexpected response checking existing file {path}: {resp.status_code}")
                    return None
            except Exception as e:
                logger.error(f"Error checking file SHA at {path}: {e}")
                return None

    async def publish_article(
        self,
        slug: str,
        title: str,
        file_content: str,
        draft_id: Optional[UUID | str] = None,
        commit_message: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Commits an article to `src/content/articles/{slug}.md` on GitHub.

        Returns:
            Tuple of (success: bool, result_payload: dict)
        """
        target_path = f"src/content/articles/{slug}.md"
        canonical_url = f"{settings.BASE_BLOG_URL}/articles/{slug}/"

        if not self.token:
            err_msg = "GitHub token (GITHUB_TOKEN) is not configured in backend settings."
            logger.error(err_msg)
            return False, {"error": err_msg, "path": target_path}

        # Create tracking job in Supabase
        pub_job: Optional[PublishingJob] = None
        if draft_id:
            try:
                pub_job = await self.publishing_repo.create_publishing_job(draft_id)
            except Exception as e:
                logger.warning(f"Could not create publishing job record: {e}")

        # Check if file already exists to get SHA for atomic update
        existing_sha = await self._get_existing_file_sha(target_path)

        # Base64 encode the markdown file content
        encoded_content = base64.b64encode(file_content.encode("utf-8")).decode("utf-8")

        msg = commit_message or f"content(articles): publish {title}"

        payload: Dict[str, Any] = {
            "message": msg,
            "content": encoded_content,
            "branch": self.branch
        }
        if existing_sha:
            payload["sha"] = existing_sha
            logger.info(f"Updating existing file at {target_path} (sha: {existing_sha})")
        else:
            logger.info(f"Creating new article at {target_path}")

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{target_path}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.put(url, headers=self._get_headers(), json=payload)

                if resp.status_code in [200, 201]:
                    data = resp.json()
                    commit_sha = data.get("commit", {}).get("sha", "")
                    html_url = data.get("commit", {}).get("html_url", "")

                    logger.info(f"Successfully committed {target_path} to GitHub: commit {commit_sha}")

                    # Update publishing record
                    if pub_job:
                        await self.publishing_repo.update_status(
                            job_id=pub_job.id,
                            status="verified",
                            github_commit_sha=commit_sha,
                            github_file_path=target_path,
                            published_url=canonical_url
                        )

                    return True, {
                        "commit_sha": commit_sha,
                        "commit_url": html_url,
                        "file_path": target_path,
                        "canonical_url": canonical_url,
                        "status": "committed"
                    }
                else:
                    err_text = resp.text[:300]
                    logger.error(f"GitHub API error ({resp.status_code}): {err_text}")
                    if pub_job:
                        await self.publishing_repo.update_status(
                            job_id=pub_job.id,
                            status="failed",
                            error_message=f"GitHub API {resp.status_code}: {err_text}"
                        )
                    return False, {
                        "error": f"GitHub API error {resp.status_code}: {err_text}",
                        "path": target_path
                    }

            except Exception as e:
                logger.error(f"Failed to commit article to GitHub: {e}", exc_info=True)
                if pub_job:
                    await self.publishing_repo.update_status(
                        job_id=pub_job.id,
                        status="failed",
                        error_message=str(e)
                    )
                return False, {"error": str(e), "path": target_path}


github_publisher = GitHubPublisher()
