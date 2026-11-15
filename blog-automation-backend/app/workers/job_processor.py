"""Background Job Processor for DevScrolls Blog Automation.
Coordinates sequential execution of the 4-agent pipeline:
  Stage 1: Perspective Analysis (Phase 5)
  Stage 2: Technical Research via Tavily (Phase 6)
  Stage 3: Fact-Check Verification Ledger (Phase 7)
  Stage 4: Article Drafting & Editorial Pass (Phase 8)
  Stage 5: User Review & Telegram Approval Card (Phase 10)
"""
import asyncio
import logging
from typing import Any, Callable, Dict, Optional
from uuid import UUID

from app.config.limits import MAX_GENERATION_ATTEMPTS
from app.schemas.database import GenerationJob, JobStage
from app.storage.repositories import ConversationRepository, InputSessionRepository
from app.telegram.bot_client import bot_client
from app.workers.job_queue import job_queue

logger = logging.getLogger(__name__)

# Registry of stage handler functions. Agents register themselves here as phases are implemented.
STAGE_HANDLERS: Dict[str, Callable[[GenerationJob], Any]] = {}

def register_stage_handler(stage_name: str, handler: Callable[[GenerationJob], Any]):
    """Registers an agent or pipeline handler for a specific stage."""
    STAGE_HANDLERS[stage_name] = handler
    logger.debug(f"Registered stage handler for: {stage_name}")


class JobProcessor:
    """Processes generation jobs step-by-step through the 4-agent pipeline."""

    def __init__(self):
        self.queue = job_queue
        self.conv_repo = ConversationRepository()
        self.session_repo = InputSessionRepository()

    async def _notify_user(self, job: GenerationJob, message_text: str) -> None:
        """Sends an informative progress update to the author in Telegram."""
        try:
            conv = await self.conv_repo.get_by_id(job.conversation_id)
            if conv:
                await bot_client.send_message(
                    chat_id=conv.telegram_user_id,
                    text=message_text
                )
        except Exception as e:
            logger.warning(f"Failed to send Telegram progress notification for job {job.id}: {e}")

    async def process_single_job(self, job: GenerationJob) -> bool:
        """Executes the current stage of a claimed job.
        Returns True if the job progressed or finished, False if failed.
        """
        logger.info(f"Processing job {job.id} at stage: {job.current_stage}")

        stage_name = job.current_stage

        # Check if a custom agent handler is registered for this stage
        handler = STAGE_HANDLERS.get(stage_name)

        try:
            if handler:
                logger.info(f"Executing registered handler for stage: {stage_name}")
                await handler(job)
            else:
                # Default built-in stage progression (stub for Phase 4)
                await self._execute_default_stage(job)

            return True

        except Exception as e:
            logger.error(f"Error processing job {job.id} at stage {stage_name}: {e}", exc_info=True)
            new_retries = job.retry_count + 1

            if new_retries < MAX_GENERATION_ATTEMPTS:
                logger.info(f"Retrying job {job.id} (attempt {new_retries}/{MAX_GENERATION_ATTEMPTS})...")
                # Increment retry count and reset to queued
                await self.queue.job_repo._table().update({
                    "status": "queued",
                    "retry_count": new_retries,
                    "claimed_at": None,
                    "error_message": f"Retry {new_retries}: {str(e)[:150]}"
                }).eq("id", str(job.id)).execute()
            else:
                # Mark as permanently failed
                fail_msg = f"Failed after {MAX_GENERATION_ATTEMPTS} attempts: {str(e)}"
                await self.queue.mark_failed(job.id, fail_msg)
                await self._notify_user(
                    job,
                    f"❌ <b>Generation Paused</b>\n\n"
                    f"The blog generation encountered an issue: <code>{str(e)[:200]}</code>\n\n"
                    "Our team has preserved your transcript. Type /status to review."
                )

            return False

    async def _execute_default_stage(self, job: GenerationJob) -> None:
        """Default stage executor when agents are stubbed or during Phase 4 validation."""
        stage = job.current_stage

        if stage == "perspective_analysis":
            # Milestone notification
            await self._notify_user(
                job,
                "🔍 <b>Agent 1: Perspective Analysis</b>\n\n"
                "Extracting your personal tone, technical claims, and observations..."
            )
            # Advance to research
            await self.queue.advance_stage(
                job_id=job.id,
                completed_stage="perspective_analysis",
                next_stage="research",
                stage_output={"status": "stage_initialized", "claims_count": 0}
            )

        elif stage == "research":
            await self._notify_user(
                job,
                "🌐 <b>Agent 2: Technical Research</b>\n\n"
                "Querying Tavily for authoritative documentation and official specifications..."
            )
            await self.queue.advance_stage(
                job_id=job.id,
                completed_stage="research",
                next_stage="fact_check",
                stage_output={"status": "stage_initialized", "sources_found": 0}
            )

        elif stage == "fact_check":
            await self._notify_user(
                job,
                "🛡️ <b>Agent 3: Fact Verification</b>\n\n"
                "Cross-referencing claims against evidence and building the verification ledger..."
            )
            await self.queue.advance_stage(
                job_id=job.id,
                completed_stage="fact_check",
                next_stage="writing",
                stage_output={"status": "stage_initialized", "verified_claims": 0}
            )

        elif stage == "writing":
            await self._notify_user(
                job,
                "✍️ <b>Agent 4: Blog Writer & Editorial Review</b>\n\n"
                "Drafting the complete article in your personal DevScrolls style with BLUF layout and code snippets..."
            )
            await self.queue.advance_stage(
                job_id=job.id,
                completed_stage="writing",
                next_stage="editorial_review",
                stage_output={"status": "stage_initialized"}
            )

        elif stage == "editorial_review":
            await self.queue.advance_stage(
                job_id=job.id,
                completed_stage="editorial_review",
                next_stage="user_review",
                stage_output={"status": "stage_initialized"}
            )

        elif stage == "user_review":
            # Final review stage reached
            await self.queue.pause_for_user_action(
                job_id=job.id,
                status="awaiting_approval",
                reason="Waiting for author approval in Telegram"
            )
            await self._notify_user(
                job,
                "🎉 <b>Article Draft Complete!</b>\n\n"
                "Your draft has been generated and validated against your Astro schema. "
                "Use /drafts or check your review card to inspect and approve."
            )

    async def run_worker_cycle(self, max_jobs: int = 5) -> int:
        """Runs a single worker cycle claiming and processing pending jobs.
        Returns the number of jobs processed.
        """
        processed_count = 0
        for _ in range(max_jobs):
            job = await self.queue.claim_next()
            if not job:
                break
            await self.process_single_job(job)
            processed_count += 1
            # Brief yield to keep async I/O responsive
            await asyncio.sleep(0.1)

        return processed_count


job_processor = JobProcessor()
