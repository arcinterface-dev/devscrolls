"""Repository for tracking GitHub commits and GitHub Pages deployment verification.
"""
import logging
from typing import Optional
from uuid import UUID
from app.schemas.database import PublishingJob, PublishingStatus
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class PublishingRepository(BaseRepository):
    def __init__(self):
        super().__init__("publishing_jobs")

    async def create_publishing_job(self, draft_id: UUID | str) -> PublishingJob:
        """Creates a pending publishing job."""
        payload = {
            "draft_id": self._uuid_str(draft_id),
            "status": "pending",
            "retry_count": 0
        }
        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to create publishing job for draft: {draft_id}")

        return PublishingJob.model_validate(response.data[0])

    async def get_by_id(self, job_id: UUID | str) -> Optional[PublishingJob]:
        """Fetch publishing job by ID."""
        response = self._table().select("*").eq("id", self._uuid_str(job_id)).execute()
        if response.data and len(response.data) > 0:
            return PublishingJob.model_validate(response.data[0])
        return None

    async def get_by_draft_id(self, draft_id: UUID | str) -> Optional[PublishingJob]:
        """Fetch the most recent publishing job for a draft."""
        response = (
            self._table()
            .select("*")
            .eq("draft_id", self._uuid_str(draft_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return PublishingJob.model_validate(response.data[0])
        return None

    async def update_status(
        self,
        job_id: UUID | str,
        status: PublishingStatus,
        github_commit_sha: Optional[str] = None,
        github_file_path: Optional[str] = None,
        published_url: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Optional[PublishingJob]:
        """Updates the status and metadata of a publishing job."""
        payload = {"status": status}
        if github_commit_sha is not None:
            payload["github_commit_sha"] = github_commit_sha
        if github_file_path is not None:
            payload["github_file_path"] = github_file_path
        if published_url is not None:
            payload["published_url"] = published_url
        if error_message is not None:
            payload["error_message"] = error_message

        response = (
            self._table()
            .update(payload)
            .eq("id", self._uuid_str(job_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return PublishingJob.model_validate(response.data[0])
        return None

