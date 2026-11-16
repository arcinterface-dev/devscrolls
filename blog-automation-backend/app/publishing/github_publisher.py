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
from app.storage.repositories import DraftRepository, PublishingRepository

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
        raw_owner = owner or settings.GITHUB_REPO_OWNER
        raw_repo = repo or settings.GITHUB_REPO_NAME

        # Defensive fallback: never allow placeholder or non-existent repo to cause 404
        if not raw_owner or str(raw_owner).strip().lower() in ["santhanakrishnanstark", "your-github-username"]:
            raw_owner = "arcinterface-dev"
        if not raw_repo or str(raw_repo).strip().lower() in ["myblog", "your-repo-name"]:
            raw_repo = "devscrolls"

        self.token = token or settings.GITHUB_TOKEN
        self.owner = raw_owner
        self.repo = raw_repo
        self.branch = branch or settings.GITHUB_BRANCH or "main"
        self.publishing_repo = PublishingRepository()
        self.draft_repo = DraftRepository()
        self.api_base = "https://api.github.com"
        logger.info(f"GitHubPublisher configured for repo '{self.owner}/{self.repo}' on branch '{self.branch}'")

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
        file_info = await self._get_existing_file(path)
        return file_info[1] if file_info else None

    async def _get_existing_file(self, path: str) -> Optional[Tuple[str, str]]:
        """Checks if a file already exists at path to retrieve its (content, sha)."""
        if not self.token:
            return None

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{path}"
        params = {"ref": self.branch}

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(url, headers=self._get_headers(), params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    sha = data.get("sha")
                    encoded = data.get("content", "")
                    decoded = base64.b64decode(encoded.replace("\n", "")).decode("utf-8")
                    return decoded, sha
                elif resp.status_code == 404:
                    return None
                else:
                    logger.warning(f"Unexpected response checking existing file {path}: {resp.status_code}")
                    return None
            except Exception as e:
                logger.error(f"Error checking file at {path}: {e}")
                return None

    async def _commit_file(
        self,
        path: str,
        content: str,
        commit_message: str,
        sha: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """Commits or updates an arbitrary file at path on GitHub."""
        if not self.token:
            return False, {"error": "No GitHub token configured"}

        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
        payload: Dict[str, Any] = {
            "message": commit_message,
            "content": encoded_content,
            "branch": self.branch
        }
        if sha:
            payload["sha"] = sha

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.put(url, headers=self._get_headers(), json=payload)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    commit_sha = data.get("commit", {}).get("sha", "")
                    return True, {"commit_sha": commit_sha}
                else:
                    return False, {"error": resp.text[:200]}
            except Exception as e:
                return False, {"error": str(e)}

    async def sync_ai_manifests(
        self,
        slug: str,
        title: str,
        description: str
    ) -> None:
        """Automatically synchronizes public/llms.txt and public/llms-full.txt on GitHub."""
        try:
            canonical_url = f"{settings.BASE_BLOG_URL}/articles/{slug}/"

            # 1. Update public/llms.txt
            llms_res = await self._get_existing_file("public/llms.txt")
            if llms_res:
                content, sha = llms_res
                if f"/articles/{slug}/" not in content:
                    new_line = f"- [{title}]({canonical_url}): {description}\n"
                    updated_llms = content.rstrip() + "\n" + new_line
                    await self._commit_file(
                        path="public/llms.txt",
                        content=updated_llms,
                        commit_message=f"docs(geo): register {slug} in llms.txt",
                        sha=sha
                    )
                    logger.info(f"Auto-synced {slug} to public/llms.txt on GitHub")

            # 2. Update public/llms-full.txt
            full_res = await self._get_existing_file("public/llms-full.txt")
            if full_res:
                content, sha = full_res
                if f"/articles/{slug}/" not in content:
                    full_entry = (
                        f"\n### \"{title}\"\n"
                        f"- **URL**: {canonical_url}\n"
                        f"- **Summary**: {description}\n"
                        f"- **Key Takeaway**: Explains how to properly tear down in-flight network sockets via AbortController.\n"
                    )
                    if "## 4. Citation and Attribution Guidelines" in content:
                        parts = content.split("## 4. Citation and Attribution Guidelines")
                        updated_full = parts[0].rstrip() + "\n" + full_entry + "\n---\n\n## 4. Citation and Attribution Guidelines" + parts[1]
                    else:
                        updated_full = content.rstrip() + "\n" + full_entry

                    await self._commit_file(
                        path="public/llms-full.txt",
                        content=updated_full,
                        commit_message=f"docs(geo): register {slug} in llms-full.txt",
                        sha=sha
                    )
                    logger.info(f"Auto-synced {slug} to public/llms-full.txt on GitHub")
        except Exception as e:
            logger.warning(f"Could not auto-sync AI manifests: {e}")

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
        logger.info(f"Submitting GitHub commit via PUT {url} on branch {self.branch}")

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

                    # Auto-sync public/llms.txt and public/llms-full.txt on GitHub
                    try:
                        import asyncio
                        draft_obj = await self.draft_repo.get_by_id(draft_id) if draft_id else None
                        desc = (draft_obj.description if draft_obj else "") or title
                        asyncio.create_task(self.sync_ai_manifests(slug=slug, title=title, description=desc))
                    except Exception as e:
                        logger.warning(f"Manifest auto-sync dispatch failed: {e}")

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
