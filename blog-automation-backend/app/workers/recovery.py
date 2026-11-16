"""Startup and Crash Recovery System for DevScrolls Blog Automation.
Ensures zero data loss when Render free-tier containers sleep, restart, or cold-start.
"""
import logging
from typing import List
from app.config.limits import JOB_STALE_TIMEOUT_MINUTES
from app.schemas.database import GenerationJob
from app.workers.job_queue import job_queue

logger = logging.getLogger(__name__)

async def run_startup_recovery(timeout_minutes: int = 0) -> List[GenerationJob]:
    """Scans for jobs left in 'processing' status prior to a server restart or timeout.
    Resets them to 'queued' while preserving all intermediate agent outputs so processing
    resumes from the exact interrupted stage.
    """
    logger.info(f"Running startup job recovery check (stale timeout: {timeout_minutes}m)...")
    try:
        recovered = await job_queue.recover_stale_jobs(timeout_minutes=timeout_minutes)
        if recovered:
            logger.warning(
                f"Recovered {len(recovered)} interrupted jobs from prior server shutdown: "
                f"{[str(j.id) for j in recovered]}"
            )
        else:
            logger.info("Startup recovery complete: no abandoned jobs detected.")
        return recovered
    except Exception as e:
        logger.error(f"Error executing startup job recovery: {e}", exc_info=True)
        return []
