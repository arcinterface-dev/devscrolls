"""Base repository providing standardized access to Supabase client, schema scoping,
and JSON/UUID serialization helpers.
"""
import logging
from typing import Any, Dict, Optional
from uuid import UUID
from app.storage.database import get_supabase

logger = logging.getLogger(__name__)

class BaseRepository:
    """Base class for all Supabase repositories operating in the 'automation' schema."""

    def __init__(self, table_name: str):
        self.table_name = table_name

    def _get_client(self):
        client = get_supabase()
        if client is None:
            raise RuntimeError(
                "Supabase client is not available. Please verify SUPABASE_URL and "
                "SUPABASE_SERVICE_KEY in .env."
            )
        return client

    def _table(self):
        """Returns the PostgREST table builder, scoped to schema 'automation'."""
        return self._get_client().schema("automation").from_(self.table_name)

    @staticmethod
    def _uuid_str(val: UUID | str | None) -> Optional[str]:
        if val is None:
            return None
        return str(val)

    @staticmethod
    def _clean_payload(data: Dict[str, Any]) -> Dict[str, Any]:
        """Converts UUID objects and datetimes to ISO strings for Supabase JSON serialization."""
        clean = {}
        for k, v in data.items():
            if isinstance(v, UUID):
                clean[k] = str(v)
            elif hasattr(v, "isoformat"):
                clean[k] = v.isoformat()
            else:
                clean[k] = v
        return clean

