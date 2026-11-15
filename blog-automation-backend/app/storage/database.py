"""Supabase Client connection singleton.
Initializes the client using the service role key to manage automation tables.
"""
import logging
from typing import Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

_supabase_client = None

def get_supabase():
    """Returns the cached Supabase client singleton, initializing it if necessary."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_KEY not set. "
            "Database operations will fail until configured in .env."
        )
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise

