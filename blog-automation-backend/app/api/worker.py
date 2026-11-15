"""Internal Background Worker API Endpoint.
Exposes protected triggers to invoke worker cycles asynchronously.
"""
import logging
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, status
from pydantic import BaseModel
from app.config.settings import settings
from app.workers.job_processor import job_processor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/internal/worker", tags=["Worker"])

class WorkerTriggerResponse(BaseModel):
    status: str
    message: str

@router.post("/process", response_model=WorkerTriggerResponse)
async def trigger_worker_process(
    background_tasks: BackgroundTasks,
    x_internal_secret: str | None = Header(None)
):
    """Secure endpoint to trigger a background worker cycle.
    Validates X-Internal-Secret header to prevent unauthorized invocations.
    """
    expected_secret = settings.INTERNAL_API_SECRET
    if expected_secret and x_internal_secret != expected_secret:
        logger.warning("Rejected unauthorized worker trigger: invalid internal secret header.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal secret header"
        )

    logger.info("Internal worker cycle triggered via API.")
    background_tasks.add_task(job_processor.run_worker_cycle)

    return WorkerTriggerResponse(
        status="triggered",
        message="Background worker cycle dispatched asynchronously."
    )
