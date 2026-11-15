"""Repository for managing background generation jobs and state machine tracking.
Supports atomic job claiming (FOR UPDATE SKIP LOCKED) to tolerate Render cold-starts and retries.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.schemas.database import GenerationJob, JobStage, JobStatus
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class JobRepository(BaseRepository):
    def __init__(self):
        super().__init__("generation_jobs")

    async def create_job(self, conversation_id: UUID | str) -> GenerationJob:
        """Enqueues a new generation job in 'queued' status."""
        payload = {
            "conversation_id": self._uuid_str(conversation_id),
            "status": "queued",
            "current_stage": "perspective_analysis",
            "retry_count": 0
        }
        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to create generation job for conversation: {conversation_id}")

        logger.info(f"Enqueued generation job {response.data[0]['id']}")
        return GenerationJob.model_validate(response.data[0])

    async def get_by_id(self, job_id: UUID | str) -> Optional[GenerationJob]:
        """Fetch job by ID."""
        response = self._table().select("*").eq("id", self._uuid_str(job_id)).execute()
        if response.data and len(response.data) > 0:
            return GenerationJob.model_validate(response.data[0])
        return None

    async def get_active_job_for_conversation(
        self,
        conversation_id: UUID | str
    ) -> Optional[GenerationJob]:
        """Fetch currently active/queued job for a conversation."""
        response = (
            self._table()
            .select("*")
            .eq("conversation_id", self._uuid_str(conversation_id))
            .in_("status", ["queued", "processing", "awaiting_clarification", "awaiting_approval"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return GenerationJob.model_validate(response.data[0])
        return None

    async def claim_next_job(self, stale_minutes: int = 30) -> Optional[GenerationJob]:
        """Atomically claims the next pending job from the queue.
        First attempts to use the Postgres RPC `claim_next_job`. If unavailable,
        falls back to a filtered update with optimistic locking.
        """
        client = self._get_client()

        # Try RPC first
        try:
            rpc_res = client.schema("automation").rpc(
                "claim_next_job",
                {"p_stale_minutes": stale_minutes}
            ).execute()

            if rpc_res.data and len(rpc_res.data) > 0:
                claimed = rpc_res.data[0]
                logger.info(f"RPC claimed job {claimed.get('id')}")
                return GenerationJob.model_validate(claimed)
        except Exception as e:
            logger.debug(f"RPC claim_next_job not available, using fallback: {e}")

        # Fallback query
        now_iso = datetime.now(timezone.utc).isoformat()
        queued = (
            self._table()
            .select("id")
            .eq("status", "queued")
            .order("created_at", desc=False)
            .limit(1)
            .execute()
        )

        if queued.data and len(queued.data) > 0:
            candidate_id = queued.data[0]["id"]
            claim_res = (
                self._table()
                .update({
                    "status": "processing",
                    "claimed_at": now_iso
                })
                .eq("id", candidate_id)
                .eq("status", "queued")  # Atomic CAS
                .execute()
            )
            if claim_res.data and len(claim_res.data) > 0:
                logger.info(f"Fallback claimed job {candidate_id}")
                return GenerationJob.model_validate(claim_res.data[0])

        return None

    async def update_stage_output(
        self,
        job_id: UUID | str,
        stage: JobStage,
        output_payload: Dict[str, Any]
    ) -> Optional[GenerationJob]:
        """Persists the intermediate output of an agent and advances the stage."""
        field_map = {
            "perspective_analysis": "perspective_output",
            "research": "research_output",
            "fact_check": "factcheck_output",
        }
        update_data: Dict[str, Any] = {"current_stage": stage}
        if stage in field_map:
            update_data[field_map[stage]] = output_payload

        response = (
            self._table()
            .update(update_data)
            .eq("id", self._uuid_str(job_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return GenerationJob.model_validate(response.data[0])
        return None

    async def set_job_status(
        self,
        job_id: UUID | str,
        status: JobStatus,
        error_message: Optional[str] = None
    ) -> Optional[GenerationJob]:
        """Updates the status of a job (e.g. 'completed', 'failed', 'paused_quota')."""
        payload: Dict[str, Any] = {"status": status}
        if error_message is not None:
            payload["error_message"] = error_message
        if status in ["completed", "failed", "cancelled"]:
            payload["completed_at"] = datetime.now(timezone.utc).isoformat()

        response = (
            self._table()
            .update(payload)
            .eq("id", self._uuid_str(job_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return GenerationJob.model_validate(response.data[0])
        return None

    async def recover_stale_jobs(self, timeout_minutes: int = 30) -> List[GenerationJob]:
        """Scans for jobs left in 'processing' status longer than timeout_minutes
        (e.g. due to server restart or cold start) and resets them to 'queued'.
        """
        response = (
            self._table()
            .select("*")
            .eq("status", "processing")
            .execute()
        )
        recovered = []
        now = datetime.now(timezone.utc)

        if response.data:
            for item in response.data:
                claimed_at_str = item.get("claimed_at")
                if not claimed_at_str:
                    continue
                # Handle ISO datetime parsing
                claimed_dt = datetime.fromisoformat(claimed_at_str.replace("Z", "+00:00"))
                elapsed = (now - claimed_dt).total_seconds() / 60.0
                if elapsed > timeout_minutes:
                    logger.warning(f"Recovering stale job {item['id']} (elapsed {elapsed:.1f} mins)")
                    reset_res = (
                        self._table()
                        .update({"status": "queued", "claimed_at": None})
                        .eq("id", item["id"])
                        .execute()
                    )
                    if reset_res.data:
                        recovered.append(GenerationJob.model_validate(reset_res.data[0]))

        return recovered

