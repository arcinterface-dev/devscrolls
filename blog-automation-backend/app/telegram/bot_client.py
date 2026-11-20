"""Lightweight asynchronous Telegram Bot API client using httpx.
Provides clean wrappers for message delivery, inline keyboards, callback answers, and audio downloads.
"""
import logging
from typing import Any, Dict, Optional
import httpx
from app.config.settings import settings

logger = logging.getLogger(__name__)

class TelegramBotClient:
    """Async client communicating directly with Telegram Bot API."""

    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token or settings.TELEGRAM_BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        self.file_base_url = f"https://api.telegram.org/file/bot{self.bot_token}"

    def _ensure_token(self):
        if not self.bot_token:
            raise ValueError(
                "TELEGRAM_BOT_TOKEN is not configured in settings or environment. "
                "Please add it to .env."
            )

    async def send_message(
        self,
        chat_id: int | str,
        text: str,
        reply_markup: Optional[Dict[str, Any]] = None,
        parse_mode: str = "HTML"
    ) -> Dict[str, Any]:
        """Sends a text message with optional inline keyboard markup."""
        self._ensure_token()
        url = f"{self.base_url}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            data = res.json()
            if not data.get("ok"):
                logger.error(f"Telegram sendMessage failed: {data}")
                err_desc = data.get("description", "")
                if "parse entities" in err_desc or "start tag" in err_desc or "entity" in err_desc:
                    import re
                    logger.warning("Telegram HTML entity error; retrying sendMessage in plain text mode...")
                    payload_plain = payload.copy()
                    payload_plain.pop("parse_mode", None)
                    payload_plain["text"] = re.sub(r"<[^>]+>", "", text)
                    retry_res = await client.post(url, json=payload_plain)
                    return retry_res.json()
            return data

    async def edit_message_text(
        self,
        chat_id: int | str,
        message_id: int,
        text: str,
        reply_markup: Optional[Dict[str, Any]] = None,
        parse_mode: str = "HTML"
    ) -> Dict[str, Any]:
        """Edits an existing bot message text and keyboard."""
        self._ensure_token()
        url = f"{self.base_url}/editMessageText"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            data = res.json()
            if not data.get("ok"):
                logger.error(f"Telegram editMessageText failed: {data}")
                err_desc = data.get("description", "")
                if "parse entities" in err_desc or "start tag" in err_desc or "entity" in err_desc:
                    import re
                    logger.warning("Telegram HTML entity error; retrying editMessageText in plain text mode...")
                    payload_plain = payload.copy()
                    payload_plain.pop("parse_mode", None)
                    payload_plain["text"] = re.sub(r"<[^>]+>", "", text)
                    retry_res = await client.post(url, json=payload_plain)
                    return retry_res.json()
            return data

    async def answer_callback_query(
        self,
        callback_query_id: str,
        text: Optional[str] = None,
        show_alert: bool = False
    ) -> Dict[str, Any]:
        """Acknowledges a callback query from an inline button click."""
        self._ensure_token()
        url = f"{self.base_url}/answerCallbackQuery"
        payload: Dict[str, Any] = {"callback_query_id": callback_query_id}
        if text:
            payload["text"] = text
            payload["show_alert"] = show_alert

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            return res.json()

    async def send_chat_action(self, chat_id: int | str, action: str = "typing") -> Dict[str, Any]:
        """Broadcasts a chat action (e.g. 'typing', 'record_voice')."""
        self._ensure_token()
        url = f"{self.base_url}/sendChatAction"
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(url, json={"chat_id": chat_id, "action": action})
            return res.json()

    async def get_file_path(self, file_id: str) -> Optional[str]:
        """Retrieves the file download path from Telegram."""
        self._ensure_token()
        url = f"{self.base_url}/getFile"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={"file_id": file_id})
            data = res.json()
            if data.get("ok"):
                return data["result"].get("file_path")
            logger.error(f"Failed to get file info for {file_id}: {data}")
            return None

    async def download_file(self, file_path: str) -> bytes:
        """Downloads raw bytes of a file (e.g. voice recording OGG audio)."""
        self._ensure_token()
        url = f"{self.file_base_url}/{file_path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url)
            res.raise_for_status()
            return res.content

    async def set_webhook(self, webhook_url: str, secret_token: Optional[str] = None) -> Dict[str, Any]:
        """Configures the Telegram webhook endpoint."""
        self._ensure_token()
        url = f"{self.base_url}/setWebhook"
        payload = {
            "url": webhook_url,
            "allowed_updates": ["message", "callback_query"]
        }
        if secret_token:
            payload["secret_token"] = secret_token

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            return res.json()

    async def delete_webhook(self) -> Dict[str, Any]:
        """Deletes the current webhook configuration."""
        self._ensure_token()
        url = f"{self.base_url}/deleteWebhook"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url)
            return res.json()

    async def set_my_commands(self, commands: list[dict[str, str]]) -> Dict[str, Any]:
        """Registers the bot command autocomplete menu with Telegram."""
        self._ensure_token()
        url = f"{self.base_url}/setMyCommands"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json={"commands": commands})
            data = res.json()
            if data.get("ok"):
                logger.info(f"Registered {len(commands)} commands with Telegram menu.")
            else:
                logger.warning(f"Failed to register Telegram menu commands: {data}")
            return data


# Shared singleton instance
bot_client = TelegramBotClient()

