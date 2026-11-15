"""Repository for managing authorized Telegram users.
"""
import logging
from typing import Optional
from app.config.settings import settings
from app.schemas.database import TelegramUser
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("telegram_users")

    async def get_by_telegram_id(self, telegram_user_id: int) -> Optional[TelegramUser]:
        """Fetch user by numeric Telegram user ID."""
        response = self._table().select("*").eq("telegram_user_id", telegram_user_id).execute()
        if response.data and len(response.data) > 0:
            return TelegramUser.model_validate(response.data[0])
        return None

    async def get_or_create_user(
        self,
        telegram_user_id: int,
        username: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> TelegramUser:
        """Fetch existing user or create a new user record.
        Auto-authorizes if the user ID is in AUTHORIZED_TELEGRAM_USER_IDS.
        """
        existing = await self.get_by_telegram_id(telegram_user_id)
        if existing:
            # Update username if changed
            if existing.username != username or existing.display_name != display_name:
                self._table().update({
                    "username": username,
                    "display_name": display_name
                }).eq("telegram_user_id", telegram_user_id).execute()
                existing.username = username
                existing.display_name = display_name
            return existing

        is_authorized = telegram_user_id in settings.AUTHORIZED_TELEGRAM_USER_IDS

        payload = {
            "telegram_user_id": telegram_user_id,
            "username": username,
            "display_name": display_name,
            "is_authorized": is_authorized
        }

        response = self._table().insert(payload).execute()
        if not response.data:
            raise RuntimeError(f"Failed to create user record for telegram_id: {telegram_user_id}")

        logger.info(f"Created new TelegramUser record: {telegram_user_id} (authorized={is_authorized})")
        return TelegramUser.model_validate(response.data[0])

    async def is_authorized(self, telegram_user_id: int) -> bool:
        """Fast check if the Telegram user is authorized to interact with the bot."""
        # Check settings allowlist first (O(1))
        if telegram_user_id in settings.AUTHORIZED_TELEGRAM_USER_IDS:
            return True
        user = await self.get_by_telegram_id(telegram_user_id)
        return user.is_authorized if user else False

