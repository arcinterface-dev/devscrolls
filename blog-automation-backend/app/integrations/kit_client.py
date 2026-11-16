"""
Kit (formerly ConvertKit) REST API Client.
Provides subscriber queries and automated Broadcast Draft generation for DevScrolls newsletter issues.
Documentation: https://developers.kit.com/
"""

import logging
from typing import Any, Dict, Optional
import httpx
from app.config.settings import settings

logger = logging.getLogger(__name__)


class KitClient:
    """Client for Kit (ConvertKit) REST API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None
    ):
        self.api_key = (api_key or settings.KIT_API_KEY or "").strip()
        raw_secret = api_secret or settings.KIT_API_SECRET or ""
        self.api_secret = raw_secret.strip() if raw_secret.strip() else "tjKJdAp4kMrlXlLCehRdJAX1d50x9DXOS-Ob_UnFW7Q"
        self.v3_base = "https://api.convertkit.com/v3"

    @property
    def is_configured(self) -> bool:
        """Returns True if at least an API secret or key is available."""
        return bool(self.api_secret or self.api_key)

    async def get_subscriber_count(self) -> Dict[str, Any]:
        """
        Retrieves total active subscriber count from Kit.
        Returns:
            dict with 'configured', 'total_subscribers', and optional 'error'.
        """
        if not self.is_configured:
            return {
                "configured": False,
                "total_subscribers": 0,
                "message": "Kit API Secret is not configured in environment."
            }

        secret = self.api_secret or self.api_key
        url = f"{self.v3_base}/subscribers"
        params = {"api_secret": secret}

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    total = data.get("total_subscribers", 0)
                    return {
                        "configured": True,
                        "total_subscribers": total,
                        "page": data.get("page", 1),
                        "total_pages": data.get("total_pages", 1)
                    }
                else:
                    logger.warning(f"Kit API returned status {resp.status_code}: {resp.text[:200]}")
                    return {
                        "configured": True,
                        "total_subscribers": 0,
                        "error": f"Kit API HTTP {resp.status_code}: {resp.text[:150]}"
                    }
            except Exception as e:
                logger.error(f"Error connecting to Kit API: {e}", exc_info=True)
                return {
                    "configured": True,
                    "total_subscribers": 0,
                    "error": str(e)
                }

    async def create_broadcast_draft(
        self,
        subject: str,
        content: str,
        description: Optional[str] = None,
        public: bool = True
    ) -> Dict[str, Any]:
        """
        Creates a new Broadcast draft in Kit for all confirmed subscribers.

        Args:
            subject: Newsletter subject line.
            content: HTML body of the email.
            description: Optional internal note / description.
            public: Whether the broadcast web archive is public.

        Returns:
            dict with 'success', 'broadcast_id', 'subject', or 'error'.
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Kit API Secret is not configured. Add KIT_API_SECRET in your settings."
            }

        secret = self.api_secret or self.api_key
        url = f"{self.v3_base}/broadcasts"
        payload = {
            "api_secret": secret,
            "subject": subject,
            "content": content,
            "description": description or f"DevScrolls: {subject}",
            "public": public
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    broadcast = data.get("broadcast", {})
                    b_id = broadcast.get("id")
                    logger.info(f"Successfully created Kit broadcast draft ID {b_id}: '{subject}'")
                    return {
                        "success": True,
                        "broadcast_id": b_id,
                        "subject": broadcast.get("subject", subject),
                        "status": broadcast.get("status", "draft"),
                        "created_at": broadcast.get("created_at")
                    }
                else:
                    err_msg = f"Kit API error ({resp.status_code}): {resp.text[:250]}"
                    logger.error(err_msg)
                    return {"success": False, "error": err_msg}
            except Exception as e:
                logger.error(f"Exception creating Kit broadcast: {e}", exc_info=True)
                return {"success": False, "error": str(e)}


kit_client = KitClient()
