"""Persistent Job Queue Interface for DevScrolls Blog Automation.
Wraps Supabase atomic job queue operations with high-level domain methods.
Designed to withstand server restarts, timeouts, and Render free-tier sleep cycles.
"""
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.config.limits import JOB_STALE_TIMEOUT_MINUTES
from app.schemas.database import GenerationJob, JobStage, JobStatus
from app.storage.repositories import ConversationRepository, JobRepository

logger = logging.getLogger(__name__)

class JobQueue:
    """High-level domain interface for queuing and claiming asynchronous AI jobs."""

    def __init__(self):
        self.job_repo = JobRepository()
        self.conv_repo = ConversationRepository()

    async def enqueue(self, conversation_id: UUID | str) -> GenerationJob:
        """Enqueues a new article generation job in 'queued' status."""
        logger.info(f"Enqueuing generation job for conversation: {conversation_id}")
        return await self.job_repo.create_job(conversation_id)

    async def claim_next(self, stale_minutes: int = JOB_STALE_TIMEOUT_MINUTES) -> Optional[GenerationJob]:
        """Atomically claims the next pending job using PostgreSQL FOR UPDATE SKIP LOCKED.
        Also re-claims any abandoned jobs that were processing before a cold-start/restart.
        """
        job = await self.job_repo.claim_next_job(stale_minutes=stale_minutes)
        if job:
            logger.info(f"Claimed job {job.id} (stage: {job.current_stage})")
        return job

    async def get_job(self, job_id: UUID | str) -> Optional[GenerationJob]:
        """Fetches job by ID."""
        return await self.job_repo.get_by_id(job_id)

    async def advance_stage(
        self,
        job_id: UUID | str,
        completed_stage: JobStage,
        next_stage: JobStage,
        stage_output: Dict[str, Any]
    ) -> Optional[GenerationJob]:
        """Saves the output of the completed stage and sets the job to the next stage."""
        logger.info(f"Advancing job {job_id}: {completed_stage} -> {next_stage}")
        # Save output for the completed stage
        await self.job_repo.update_stage_output(
            job_id=job_id,
            stage=completed_stage,
            output_payload=stage_output
        )
        # Advance current_stage to next_stage
        return await self.job_repo.update_stage_output(
            job_id=job_id,
            stage=next_stage,
            output_payload={}
        )

    async def pause_for_user_action(
        self,
        job_id: UUID | str,
        status: JobStatus,  # 'awaiting_clarification' | 'awaiting_approval'
        reason: Optional[str] = None
    ) -> Optional[GenerationJob]:
        """Pauses job execution while waiting for human interaction in Telegram."""
        logger.info(f"Pausing job {job_id} with status '{status}': {reason}")
        return await self.job_repo.set_job_status(job_id=job_id, status=status, error_message=reason)

    async def mark_paused_quota(
        self,
        job_id: UUID | str,
        details: str
    ) -> Optional[GenerationJob]:
        """Pauses a job safely when free-tier rate limits or budget ceilings are hit."""
        logger.warning(f"Job {job_id} paused due to quota ceiling: {details}")
        return await self.job_repo.set_job_status(job_id=job_id, status="paused_quota", error_message=details)

    async def mark_failed(
        self,
        job_id: UUID | str,
        error_message: str
    ) -> Optional[GenerationJob]:
        """Marks a job as failed after exhausting retries."""
        logger.error(f"Job {job_id} failed: {error_message}")
        return await self.job_repo.set_job_status(job_id=job_id, status="failed", error_message=error_message)

    async def mark_completed(self, job_id: UUID | str) -> Optional[GenerationJob]:
        """Marks a job as fully completed."""
        logger.info(f"Job {job_id} completed successfully.")
        return await self.job_repo.set_job_status(job_id=job_id, status="completed")

    async def recover_stale_jobs(self, timeout_minutes: int = JOB_STALE_TIMEOUT_MINUTES) -> List[GenerationJob]:
        """Scans for abandoned processing jobs after server restart and resets them to 'queued'."""
        return await self.job_repo.recover_stale_jobs(timeout_minutes=timeout_minutes)


job_queue = JobQueue()
