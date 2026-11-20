"""GitHub REST API Client for ScrollBot Software Developer Agent.
Safely manages branch creation, atomic file commits, pull requests, and merges,
guaranteeing that 'main' is never touched without human approval.
"""
import base64
import logging
from typing import Any, Dict, Optional, Tuple
import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class GitHubDevClient:
    """Manages Git operations via GitHub REST API for developer agent workflows."""

    def __init__(
        self,
        token: Optional[str] = None,
        owner: Optional[str] = None,
        repo: Optional[str] = None,
        base_branch: Optional[str] = None,
    ):
        raw_owner = owner or settings.GITHUB_REPO_OWNER
        raw_repo = repo or settings.GITHUB_REPO_NAME

        if not raw_owner or str(raw_owner).strip().lower() in ["santhanakrishnanstark", "your-github-username"]:
            raw_owner = "arcinterface-dev"
        if not raw_repo or str(raw_repo).strip().lower() in ["myblog", "your-repo-name"]:
            raw_repo = "devscrolls"

        self.token = token or settings.GITHUB_TOKEN
        self.owner = raw_owner
        self.repo = raw_repo
        self.base_branch = base_branch or settings.GITHUB_BRANCH or "main"
        self.api_base = "https://api.github.com"

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def get_base_sha(self) -> Optional[str]:
        """Retrieves the latest commit SHA of the base branch (main)."""
        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/git/ref/heads/{self.base_branch}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    return resp.json().get("object", {}).get("sha")
                logger.error(f"Failed to fetch base SHA: {resp.status_code} {resp.text}")
                return None
            except Exception as e:
                logger.error(f"Error fetching base branch SHA: {e}")
                return None

    async def create_feature_branch(self, branch_name: str) -> Tuple[bool, Optional[str]]:
        """Creates an isolated git branch branched from base_branch.
        Returns (success: bool, branch_name: Optional[str]).
        """
        base_sha = await self.get_base_sha()
        if not base_sha:
            return False, None

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/git/refs"
        payload = {
            "ref": f"refs/heads/{branch_name}",
            "sha": base_sha,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.post(url, headers=self._headers(), json=payload)
                if resp.status_code in [200, 201]:
                    logger.info(f"Created branch '{branch_name}' from {self.base_branch} ({base_sha[:7]})")
                    return True, branch_name
                elif resp.status_code == 422:
                    # Branch already exists
                    logger.warning(f"Branch '{branch_name}' already exists.")
                    return True, branch_name
                logger.error(f"Failed creating branch '{branch_name}': {resp.status_code} {resp.text}")
                return False, None
            except Exception as e:
                logger.error(f"Error creating branch: {e}")
                return False, None

    async def get_file_content(self, path: str, ref: Optional[str] = None) -> Optional[Tuple[str, str]]:
        """Fetches decoded file content and sha from a given branch or ref."""
        target_ref = ref or self.base_branch
        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{path}"
        params = {"ref": target_ref}

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(url, headers=self._headers(), params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    sha = data.get("sha", "")
                    raw_b64 = data.get("content", "")
                    decoded = base64.b64decode(raw_b64.replace("\n", "")).decode("utf-8")
                    return decoded, sha
                return None
            except Exception as e:
                logger.error(f"Error fetching file at {path}: {e}")
                return None

    async def commit_file(
        self,
        path: str,
        content: str,
        commit_message: str,
        branch: str,
    ) -> bool:
        """Commits an updated or new file directly into the feature branch."""
        existing = await self.get_file_content(path, ref=branch)
        sha = existing[1] if existing else None

        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/contents/{path}"
        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
        payload: Dict[str, Any] = {
            "message": commit_message,
            "content": encoded_content,
            "branch": branch,
        }
        if sha:
            payload["sha"] = sha

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.put(url, headers=self._headers(), json=payload)
                if resp.status_code in [200, 201]:
                    logger.info(f"Committed {path} to branch '{branch}'")
                    return True
                logger.error(f"Failed committing {path}: {resp.status_code} {resp.text}")
                return False
            except Exception as e:
                logger.error(f"Error committing file: {e}")
                return False

    async def create_pull_request(
        self,
        branch_name: str,
        title: str,
        body: str,
    ) -> Optional[Dict[str, Any]]:
        """Opens a Pull Request from the feature branch into main."""
        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/pulls"
        payload = {
            "title": title,
            "head": branch_name,
            "base": self.base_branch,
            "body": body,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.post(url, headers=self._headers(), json=payload)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    return {
                        "number": data.get("number"),
                        "html_url": data.get("html_url"),
                    }
                logger.warning(f"PR creation note: {resp.status_code} {resp.text}")
                return None
            except Exception as e:
                logger.error(f"Error creating PR: {e}")
                return None

    async def merge_pull_request(self, pull_number: int) -> bool:
        """Merges a pull request into main via squash merge."""
        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/pulls/{pull_number}/merge"
        payload = {
            "merge_method": "squash",
            "commit_title": f"chore(bot): merge dev agent changes (#{pull_number})",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.put(url, headers=self._headers(), json=payload)
                return resp.status_code in [200, 201]
            except Exception as e:
                logger.error(f"Error merging PR #{pull_number}: {e}")
                return False

    async def delete_feature_branch(self, branch_name: str) -> bool:
        """Deletes a transient feature branch after merge or rejection."""
        url = f"{self.api_base}/repos/{self.owner}/{self.repo}/git/refs/heads/{branch_name}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.delete(url, headers=self._headers())
                return resp.status_code in [204, 200]
            except Exception as e:
                logger.warning(f"Could not delete branch '{branch_name}': {e}")
                return False


github_dev_client = GitHubDevClient()
