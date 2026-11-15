"""Repository for managing the Fact-Check Claim Verification Ledger and retrieved Research Sources.
"""
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.schemas.database import ArticleClaim, ResearchSource, VerificationStatus
from app.storage.repositories.base_repo import BaseRepository

logger = logging.getLogger(__name__)

class ClaimRepository(BaseRepository):
    def __init__(self):
        super().__init__("article_claims")

    async def insert_claims(
        self,
        job_id: UUID | str,
        claims: List[Dict[str, Any]]
    ) -> List[ArticleClaim]:
        """Batch inserts classified claims extracted by the Perspective Analyst."""
        if not claims:
            return []

        payloads = []
        for c in claims:
            p = {
                "job_id": self._uuid_str(job_id),
                "claim_text": c["claim_text"],
                "original_statement": c.get("original_statement", c["claim_text"]),
                "claim_type": c.get("claim_type", "technical_fact"),
                "verification_status": c.get("verification_status", "HYPOTHESIS"),
                "suggested_correction": c.get("suggested_correction"),
                "confidence": c.get("confidence"),
                "explanation": c.get("explanation")
            }
            payloads.append(p)

        response = self._table().insert(payloads).execute()
        if response.data:
            return [ArticleClaim.model_validate(item) for item in response.data]
        return []

    async def update_claim_verification(
        self,
        claim_id: UUID | str,
        status: VerificationStatus,
        suggested_correction: Optional[str] = None,
        confidence: Optional[float] = None,
        explanation: Optional[str] = None
    ) -> Optional[ArticleClaim]:
        """Updates a claim with its post-research fact-check verdict."""
        payload: Dict[str, Any] = {"verification_status": status}
        if suggested_correction is not None:
            payload["suggested_correction"] = suggested_correction
        if confidence is not None:
            payload["confidence"] = confidence
        if explanation is not None:
            payload["explanation"] = explanation

        response = (
            self._table()
            .update(payload)
            .eq("id", self._uuid_str(claim_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            return ArticleClaim.model_validate(response.data[0])
        return None

    async def get_claims_for_job(self, job_id: UUID | str) -> List[ArticleClaim]:
        """Fetch all claims for a given generation job."""
        response = (
            self._table()
            .select("*")
            .eq("job_id", self._uuid_str(job_id))
            .order("created_at", desc=False)
            .execute()
        )
        if response.data:
            return [ArticleClaim.model_validate(item) for item in response.data]
        return []

    async def insert_research_sources(
        self,
        job_id: UUID | str,
        sources: List[Dict[str, Any]]
    ) -> List[ResearchSource]:
        """Batch inserts external research sources retrieved via Tavily."""
        if not sources:
            return []

        payloads = []
        for s in sources:
            p = {
                "job_id": self._uuid_str(job_id),
                "claim_id": self._uuid_str(s.get("claim_id")),
                "source_title": s["source_title"],
                "source_url": s["source_url"],
                "source_type": s.get("source_type", "other"),
                "publication_date": s.get("publication_date"),
                "relevant_excerpt": s.get("relevant_excerpt"),
                "reliability_score": s.get("reliability_score")
            }
            payloads.append(p)

        sources_table = self._get_client().schema("automation").from_("research_sources")
        response = sources_table.insert(payloads).execute()
        if response.data:
            return [ResearchSource.model_validate(item) for item in response.data]
        return []

    async def get_sources_for_job(self, job_id: UUID | str) -> List[ResearchSource]:
        """Fetch all research sources for a generation job."""
        sources_table = self._get_client().schema("automation").from_("research_sources")
        response = (
            sources_table
            .select("*")
            .eq("job_id", self._uuid_str(job_id))
            .order("retrieved_at", desc=False)
            .execute()
        )
        if response.data:
            return [ResearchSource.model_validate(item) for item in response.data]
        return []

