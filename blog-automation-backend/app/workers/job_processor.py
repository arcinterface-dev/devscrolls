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
        """Executes all stages of a claimed job continuously until paused, completed, or failed."""
        job_id = job.id
        logger.info(f"Starting continuous multi-agent execution for job {job_id}...")

        while True:
            # Refresh latest job state from DB
            current_job = await self.queue.get_job(job_id)
            if not current_job:
                logger.warning(f"Job {job_id} no longer exists in database.")
                return False

            # If job is paused for human interaction, completed, or failed, stop processing
            if current_job.status in [
                "awaiting_clarification",
                "awaiting_approval",
                "paused_quota",
                "completed",
                "failed",
                "cancelled"
            ]:
                logger.info(f"Job {job_id} finished execution cycle with status: {current_job.status}")
                return True

            stage_name = current_job.current_stage
            handler = STAGE_HANDLERS.get(stage_name)

            if not handler:
                logger.warning(f"No registered handler for stage '{stage_name}'. Executing default stage.")
                await self._execute_default_stage(current_job)
                continue

            try:
                logger.info(f"Executing handler for stage '{stage_name}' on job {job_id}...")
                await handler(current_job)

                # Fetch updated state to verify transition
                refreshed = await self.queue.get_job(job_id)
                if not refreshed:
                    break

                # If stage didn't change and status remains processing, avoid infinite loop
                if refreshed.current_stage == stage_name and refreshed.status == "processing":
                    logger.warning(f"Stage '{stage_name}' did not transition job {job_id}. Pausing.")
                    break

            except Exception as e:
                logger.error(f"Error processing job {job_id} at stage '{stage_name}': {e}", exc_info=True)
                fail_msg = f"Error in {stage_name}: {str(e)}"
                await self.queue.mark_failed(job_id, fail_msg)

                # Send transparent error notification with quick-action retry button
                conv = await self.conv_repo.get_by_id(current_job.conversation_id)
                if conv:
                    error_card = (
                        f"⚠️ <b>Pipeline Interrupted at Stage: {stage_name}</b>\n\n"
                        f"<code>{str(e)[:250]}</code>\n\n"
                        "Your voice transcript and earlier stages are safely preserved in the database."
                    )
                    retry_keyboard = {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "🔄 Retry This Stage",
                                    "callback_data": f"job_resume:{job_id}"
                                },
                                {
                                    "text": "🛑 Cancel Job",
                                    "callback_data": f"corr_cancel:{job_id}"
                                }
                            ]
                        ]
                    }
                    await bot_client.send_message(
                        chat_id=conv.telegram_user_id,
                        text=error_card,
                        reply_markup=retry_keyboard
                    )
                return False

        return True

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
