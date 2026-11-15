"""
Agent 3: Fact Checker and Critical Reviewer.
Verifies claims extracted during Perspective Analysis against evidence gathered by the Research Agent.
Protects author opinions and personal anecdotes while catching objective factual contradictions.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.factory import get_agent_provider
from app.ai.provider_interface import AIProvider, UsageMetadata
from app.schemas.perspective import ClassifiedClaim
from app.schemas.research import ClaimResearch, ResearchOutput
from app.schemas.factcheck import (
    FactCheckOutput,
    ClaimVerification,
    ClaimVerificationStatus,
    MajorCorrection,
    MinorCorrection
)
from app.storage.repositories import UsageRepository

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"


class FactCheckerAgent:
    """
    Evaluates claims against authoritative evidence.
    Ensures technical veracity while upholding authorial voice.
    """

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_agent_provider("fact_checker")
        self.usage_repo = UsageRepository()
        self._system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = PROMPTS_DIR / "fact_checker.md"
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8")
        return (
            "You are a Senior Engineering Fact Checker. Protect author opinions and personal "
            "experiences. Ruthlessly verify objective technical facts against provided research."
        )

    async def verify(
        self,
        claims: List[ClassifiedClaim],
        research_output: ResearchOutput,
        article_title: str = "Draft Engineering Article",
        job_id: Optional[UUID | str] = None
    ) -> tuple[FactCheckOutput, UsageMetadata]:
        """
        Verify every classified claim against research evidence.

        Args:
            claims: The classified claims list from PerspectiveOutput.
            research_output: The complete research output from ResearchAgent.
            article_title: Working title of the article.
            job_id: Optional job UUID for usage tracking.

        Returns:
            tuple of (FactCheckOutput, UsageMetadata)
        """
        logger.info(f"Fact checking {len(claims)} claims for job {job_id or 'test'}...")

        # Prepare evidence context
        evidence_summary = {
            "summary": research_output.research_summary,
            "claims_researched": [
                {
                    "statement": cr.original_statement,
                    "verdict": cr.research_verdict,
                    "supporting": cr.supporting_evidence,
                    "contradictory": cr.contradictory_evidence,
                    "sources": [
                        {"title": s.source_title, "url": s.source_url, "type": s.source_type}
                        for s in cr.sources
                    ]
                }
                for cr in research_output.claims_researched
            ],
            "limitations": research_output.limitations
        }

        claims_payload = [
            {
                "statement": c.statement,
                "claim_type": c.claim_type,
                "requires_research": c.requires_research,
                "context": c.context
            }
            for c in claims
        ]

        user_prompt = (
            f"ARTICLE TITLE: {article_title}\n\n"
            f"AUTHOR'S CLAIMS TO VERIFY:\n"
            f"{json.dumps(claims_payload, indent=2)}\n\n"
            f"SYNTHESIZED RESEARCH EVIDENCE:\n"
            f"{json.dumps(evidence_summary, indent=2)}\n\n"
            "TASK:\n"
            "1. Evaluate each claim against the evidence.\n"
            "2. Ensure all claims with claim_type in ['personal_opinion', 'personal_experience'] "
            "are assigned status 'personal_opinion' or 'personal_exp' with confidence 1.0. NEVER mark them CONTRADICTED.\n"
            "3. For objective technical facts, check for accuracy or obsolescence.\n"
            "4. If a critical technical error will mislead engineers or damage credibility, add a MajorCorrection and set human_approval_required = True.\n"
            "5. If only minor terminology or version nuances are needed, add MinorCorrection.\n"
            "6. Formulate a collegial explanation_for_author if corrections are found."
        )

        output, usage = await self.provider.generate_structured(
            system_prompt=self._system_prompt,
            user_prompt=user_prompt,
            response_schema=FactCheckOutput,
            temperature=0.1
        )

        # Enforce protective invariants in Python layer:
        for verif in output.verifications:
            matching_claim = next((c for c in claims if c.statement == verif.claim_text), None)
            if matching_claim:
                if matching_claim.claim_type in ["personal_opinion", "personal_experience"]:
                    if verif.status == ClaimVerificationStatus.CONTRADICTED:
                        verif.status = (
                            ClaimVerificationStatus.PERSONAL_OPINION
                            if matching_claim.claim_type == "personal_opinion"
                            else ClaimVerificationStatus.PERSONAL_EXPERIENCE
                        )
                        verif.confidence_score = 1.0
                        verif.explanation = f"Protected {matching_claim.claim_type}; immune to external contradiction."

        # Filter out any major corrections accidentally raised against personal opinions or experiences
        safe_major_corrections = []
        for mc in output.major_corrections:
            matching_claim = next((c for c in claims if c.statement == mc.claim), None)
            if matching_claim and matching_claim.claim_type in ["personal_opinion", "personal_experience"]:
                continue
            safe_major_corrections.append(mc)

        output.major_corrections = safe_major_corrections
        if output.major_corrections:
            output.human_approval_required = True
            output.proceed_to_writing = False
        else:
            output.human_approval_required = False
            output.proceed_to_writing = True

        # Log usage if job_id provided
        if job_id and usage:
            try:
                await self.usage_repo.log_usage(
                    job_id=job_id,
                    stage="fact_check",
                    model=usage.model,
                    prompt_tokens=usage.prompt_tokens,
                    completion_tokens=usage.completion_tokens,
                    estimated_cost=usage.estimated_cost
                )
            except Exception as e:
                logger.warning(f"Could not log fact check usage: {e}")

        return output, usage


fact_checker = FactCheckerAgent()
