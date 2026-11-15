"""
Central AI Blog Pipeline Orchestrator.
Manages the end-to-end multi-agent lifecycle across:
  Agent 1: Personal Perspective Analyst (perspective_analysis)
  Agent 2: Technical Research Agent via Tavily (research)
  Agent 3: Fact Checker & Critical Reviewer (fact_check)
  Agent 4: Blog Writer & Editorial Agent (writing, editorial_review)

Enforces human confirmation gates, idempotent stage resumption, crash recovery,
and quota ceiling safeguards.
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.config.limits import (
    DAILY_TOKEN_BUDGET_GEMINI,
    MONTHLY_TAVILY_CREDIT_BUDGET,
    MAX_GENERATION_ATTEMPTS
)
from app.schemas.database import GenerationJob, JobStage, JobStatus
from app.storage.repositories import (
    ConversationRepository,
    DraftRepository,
    JobRepository,
    UsageRepository
)
from app.telegram.bot_client import bot_client
from app.workers.job_processor import STAGE_HANDLERS
from app.workers.job_queue import job_queue

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Central orchestrator coordinating state transitions, agent execution,
    and human confirmation gates across the 4-agent blog generation pipeline.
    """

    def __init__(self):
        self.queue = job_queue
        self.job_repo = JobRepository()
        self.conv_repo = ConversationRepository()
        self.draft_repo = DraftRepository()
        self.usage_repo = UsageRepository()

    async def execute_job(self, job_id: UUID | str) -> Dict[str, Any]:
        """
        Executes a job step-by-step through available stages until completed,
        paused for human action, or failed.
        """
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        logger.info(f"Orchestrator starting execution for job {job.id} at stage: {job.current_stage}")

        while True:
            # Refresh job state
            job = await self.job_repo.get_by_id(job_id)
            if not job:
                break

            # Stop if paused or completed
            if job.status in ["awaiting_clarification", "awaiting_approval", "paused_quota", "completed", "failed", "cancelled"]:
                logger.info(f"Job {job.id} stopped at status '{job.status}' (stage: {job.current_stage}).")
                return {
                    "job_id": str(job.id),
                    "status": job.status,
                    "current_stage": job.current_stage,
                    "completed": job.status == "completed"
                }

            stage_name = job.current_stage
            handler = STAGE_HANDLERS.get(stage_name)

            if not handler:
                logger.warning(f"No registered handler found for stage: {stage_name}")
                break

            try:
                logger.info(f"Orchestrator invoking handler for stage '{stage_name}' on job {job.id}...")
                await handler(job)

                # Fetch updated job to see if it transitioned or paused
                updated_job = await self.job_repo.get_by_id(job_id)
                if not updated_job:
                    break

                # If stage did not change or job paused, stop the continuous loop
                if updated_job.current_stage == stage_name or updated_job.status != "processing":
                    return {
                        "job_id": str(updated_job.id),
                        "status": updated_job.status,
                        "current_stage": updated_job.current_stage,
                        "completed": updated_job.status == "completed"
                    }

            except Exception as e:
                logger.error(f"Orchestrator error executing stage '{stage_name}' on job {job.id}: {e}", exc_info=True)
                new_retries = job.retry_count + 1

                if new_retries < MAX_GENERATION_ATTEMPTS:
                    logger.info(f"Retrying job {job.id} (attempt {new_retries}/{MAX_GENERATION_ATTEMPTS})...")
                    await self.job_repo.set_job_status(job.id, "queued", f"Retry {new_retries}: {str(e)[:150]}")
                else:
                    fail_msg = f"Failed after {MAX_GENERATION_ATTEMPTS} attempts: {str(e)}"
                    await self.queue.mark_failed(job.id, fail_msg)
                    conv = await self.conv_repo.get_by_id(job.conversation_id)
                    if conv:
                        await bot_client.send_message(
                            chat_id=conv.telegram_user_id,
                            text=f"❌ <b>Pipeline Halted</b>\n\nAn error occurred: <code>{str(e)[:200]}</code>\n\nYour transcript and intermediate work are safely preserved."
                        )

                return {
                    "job_id": str(job.id),
                    "status": "failed" if new_retries >= MAX_GENERATION_ATTEMPTS else "queued",
                    "current_stage": stage_name,
                    "error": str(e)
                }

        return {
            "job_id": str(job_id),
            "status": "unknown",
            "current_stage": getattr(job, "current_stage", "unknown")
        }

    async def resume_from_clarification(
        self,
        job_id: UUID | str,
        answers: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Resumes a job paused at Stage 1 awaiting clarification answers.
        Appends answers to context and advances directly to technical research.
        """
        job = await self.job_repo.get_by_id(job_id)
        if not job or job.status != "awaiting_clarification":
            raise ValueError(f"Job {job_id} is not awaiting clarification.")

        logger.info(f"Resuming job {job.id} from clarification answers...")

        # Update perspective output with clarification answers
        persp_data = job.perspective_output or {}
        persp_data["clarification_answers"] = answers

        # Advance to research stage and set to processing
        await self.queue.advance_stage(
            job_id=job.id,
            completed_stage="perspective_analysis",
            next_stage="research",
            stage_output=persp_data
        )
        await self.job_repo.set_job_status(job.id, "processing")
        await self.conv_repo.update_status(job.conversation_id, "active", "generation_processing")

        # Continue pipeline execution
        return await self.execute_job(job.id)

    async def resume_from_major_correction(
        self,
        job_id: UUID | str,
        action: str  # 'accept' | 'override'
    ) -> Dict[str, Any]:
        """
        Resumes a job paused at Stage 3 awaiting fact-check correction approval.
        """
        job = await self.job_repo.get_by_id(job_id)
        if not job or job.status != "awaiting_approval":
            raise ValueError(f"Job {job_id} is not awaiting fact-check approval.")

        logger.info(f"Resuming job {job.id} after correction action: {action}...")

        # Record author's decision in factcheck_output
        fc_data = job.factcheck_output or {}
        fc_data["author_correction_decision"] = action

        # Advance to writing stage
        await self.queue.advance_stage(
            job_id=job.id,
            completed_stage="fact_check",
            next_stage="writing",
            stage_output=fc_data
        )
        await self.job_repo.set_job_status(job.id, "processing")
        await self.conv_repo.update_status(job.conversation_id, "active", "generation_processing")

        return await self.execute_job(job.id)

    async def get_pipeline_summary(self, job_id: UUID | str) -> Dict[str, Any]:
        """Returns a consolidated summary of pipeline progress and token telemetry."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found.")

        # Check completed stages
        stages_completed = []
        if job.perspective_output:
            stages_completed.append("perspective_analysis")
        if job.research_output:
            stages_completed.append("research")
        if job.factcheck_output:
            stages_completed.append("fact_check")
        if job.current_stage in ["editorial_review", "completed"]:
            stages_completed.append("writing")

        # Get latest draft if any
        draft = await self.draft_repo.get_by_slug(
            (job.perspective_output or {}).get("proposed_title", "").lower().replace(" ", "-")[:40]
        )

        return {
            "job_id": str(job.id),
            "current_stage": job.current_stage,
            "status": job.status,
            "stages_completed": stages_completed,
            "retry_count": job.retry_count,
            "has_draft": draft is not None,
            "created_at": str(job.created_at)
        }


pipeline_orchestrator = PipelineOrchestrator()
