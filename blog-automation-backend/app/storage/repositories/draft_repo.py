"""Repository for managing blog drafts and immutable version history.
"""
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.schemas.database import BlogDraft, DraftStatus, DraftVersion
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class DraftRepository(BaseRepository):
    def __init__(self):
        super().__init__("blog_drafts")

    async def create_draft(
        self,
        conversation_id: UUID | str,
        title: str,
        slug: str,
        content: str,
        frontmatter: Dict[str, Any],
        job_id: Optional[UUID | str] = None,
        description: Optional[str] = None,
        seo_metadata: Optional[Dict[str, Any]] = None
    ) -> BlogDraft:
        """Creates initial draft (v1) and records its version history."""
        payload = {
            "conversation_id": self._uuid_str(conversation_id),
            "job_id": self._uuid_str(job_id),
            "title": title,
            "slug": slug,
            "description": description or frontmatter.get("description"),
            "content": content,
            "frontmatter": frontmatter,
            "seo_metadata": seo_metadata or {},
            "status": "pending_review",
            "current_version": 1
        }

        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to create draft record for slug: {slug}")

        draft = BlogDraft.model_validate(response.data[0])

        # Record initial version in draft_versions
        version_payload = {
            "draft_id": str(draft.id),
            "version_number": 1,
            "content": content,
            "frontmatter": frontmatter,
            "revision_reason": "Initial generation from confirmed transcript"
        }
        self._get_client().schema("automation").from_("draft_versions").insert(version_payload).execute()

        logger.info(f"Created draft {draft.id} (v1) for slug: {slug}")
        return draft

    async def get_by_id(self, draft_id: UUID | str) -> Optional[BlogDraft]:
        """Fetch draft by ID."""
        response = self._table().select("*").eq("id", self._uuid_str(draft_id)).execute()
        if response.data and len(response.data) > 0:
            return BlogDraft.model_validate(response.data[0])
        return None

    async def get_by_slug(self, slug: str) -> Optional[BlogDraft]:
        """Fetch draft by URL slug."""
        response = self._table().select("*").eq("slug", slug).execute()
        if response.data and len(response.data) > 0:
            return BlogDraft.model_validate(response.data[0])
        return None

    async def check_slug_exists(self, slug: str) -> bool:
        """Checks if a slug already exists in blog_drafts."""
        draft = await self.get_by_slug(slug)
        return draft is not None

    async def get_latest_draft_for_conversation(self, conversation_id: UUID | str) -> Optional[BlogDraft]:
        """Fetch the most recent draft associated with a conversation."""
        response = (
            self._table()
            .select("*")
            .eq("conversation_id", self._uuid_str(conversation_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return BlogDraft.model_validate(response.data[0])
        return None

    async def create_revision(
        self,
        draft_id: UUID | str,
        new_content: str,
        new_frontmatter: Dict[str, Any],
        revision_reason: str
    ) -> BlogDraft:
        """Increments version counter, updates draft, and saves immutable version record."""
        current = await self.get_by_id(draft_id)
        if not current:
            raise ValueError(f"Draft {draft_id} not found.")

        next_version = current.current_version + 1

        # 1. Update draft table
        update_payload = {
            "content": new_content,
            "frontmatter": new_frontmatter,
            "description": new_frontmatter.get("description", current.description),
            "current_version": next_version,
            "status": "pending_review"
        }
        response = self._table().update(update_payload).eq("id", self._uuid_str(draft_id)).execute()
        if not response.data:
            raise RuntimeError(f"Failed to update draft {draft_id}")

        updated_draft = BlogDraft.model_validate(response.data[0])

        # 2. Insert into draft_versions
        version_payload = {
            "draft_id": self._uuid_str(draft_id),
            "version_number": next_version,
            "content": new_content,
            "frontmatter": new_frontmatter,
            "revision_reason": revision_reason
        }
        self._get_client().schema("automation").from_("draft_versions").insert(version_payload).execute()

        logger.info(f"Created revision v{next_version} for draft {draft_id}: {revision_reason}")
        return updated_draft

    async def update_status(self, draft_id: UUID | str, status: DraftStatus) -> Optional[BlogDraft]:
        """Updates draft lifecycle status (e.g. 'approved', 'published', 'rejected')."""
        response = (
            self._table()
            .update({"status": status})
            .eq("id", self._uuid_str(draft_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return BlogDraft.model_validate(response.data[0])
        return None

    async def get_versions(self, draft_id: UUID | str) -> List[DraftVersion]:
        """Fetch all historical versions for a draft in chronological order."""
        response = (
            self._get_client()
            .schema("automation")
            .from_("draft_versions")
            .select("*")
            .eq("draft_id", self._uuid_str(draft_id))
            .order("version_number", desc=False)
            .execute()
        )
        if response.data:
            return [DraftVersion.model_validate(v) for v in response.data]
        return []

