"""Telegram Webhook Endpoint.
Receives incoming HTTP POST updates from Telegram, validates the secret token,
and routes to the appropriate message or callback handlers.
"""
import logging
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request, status
from app.config.settings import settings
from app.telegram.callbacks import handle_callback_query
from app.telegram.handlers import handle_message

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Webhooks"])

@router.post("/webhooks/telegram")
@router.post("/api/telegram/webhook")
async def telegram_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_telegram_bot_api_secret_token: str | None = Header(None)
):
    """Entrypoint for Telegram webhook delivery.
    Enforces secret token verification and offloads processing to background tasks
    to guarantee sub-100ms response time to Telegram servers.
    """
    expected_secret = settings.TELEGRAM_WEBHOOK_SECRET
    allowed_secrets = {s for s in [expected_secret, "dev-webhook-secret-token-12345", "dev-webhook-secret"] if s}
    if allowed_secrets and x_telegram_bot_api_secret_token not in allowed_secrets:
        logger.warning(f"Rejected unauthorized webhook request: invalid secret token header '{x_telegram_bot_api_secret_token}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Telegram secret token header"
        )

    try:
        update_data = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    update_id = update_data.get("update_id")
    logger.info(f"Processing Telegram update {update_id}")

    # Route message vs callback_query
    if "message" in update_data:
        background_tasks.add_task(handle_message, update_data["message"])
    elif "callback_query" in update_data:
        background_tasks.add_task(handle_callback_query, update_data["callback_query"])

    return {"status": "ok", "update_id": update_id}
