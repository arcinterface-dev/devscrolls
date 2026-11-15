"""Agent 1: Personal Perspective Analyst.
Analyzes voice transcripts to extract author voice, claims, and outline without fabricating personal experiences.
"""
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.factory import get_agent_provider
from app.ai.provider_interface import UsageMetadata
from app.schemas.perspective import PerspectiveOutput
from app.storage.repositories import UsageRepository

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"
ASSETS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "knowledge_assets"

class PerspectiveAnalyst:
    """Agent that analyzes raw thoughts and extracts author voice, claims, and structure."""

    def __init__(self):
        self.provider = get_agent_provider("analyst")
        self.usage_repo = UsageRepository()
        self._system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        """Loads the specialized system prompt and injects author persona guidelines."""
        prompt_path = PROMPTS_DIR / "perspective_analyst.md"
        if prompt_path.exists():
            base_prompt = prompt_path.read_text(encoding="utf-8")
        else:
            base_prompt = (
                "You are the Personal Perspective Analyst for DevScrolls. "
                "Extract author perspective, claims, and outline without fabricating experiences."
            )

        # Append voice profile snippet if available
        voice_path = ASSETS_DIR / "VOICE_PROFILE.md"
        if voice_path.exists():
            voice_snippet = voice_path.read_text(encoding="utf-8")[:1500]
            base_prompt += f"\n\n## Author Voice Reference Snippet:\n{voice_snippet}"

        return base_prompt

    async def analyze(
        self,
        transcript: str,
        clarification_answers: Optional[Dict[str, str]] = None,
        previous_knowledge: Optional[List[Dict[str, Any]]] = None,
        job_id: Optional[UUID | str] = None
    ) -> tuple[PerspectiveOutput, UsageMetadata]:
        """Analyzes a confirmed transcript and produces a structured PerspectiveOutput.

        Args:
            transcript: The confirmed voice or text transcript from the author.
            clarification_answers: Optional answers to prior clarification questions.
            previous_knowledge: Optional related notes or past articles.
            job_id: Optional generation job ID for usage telemetry.

        Returns:
            tuple of (PerspectiveOutput, UsageMetadata)
        """
        logger.info(f"Running Perspective Analyst on transcript ({len(transcript)} chars)...")

        user_prompt = f"### Author Transcript:\n{transcript}\n"

        if clarification_answers:
            user_prompt += "\n### Additional Clarifications from Author:\n"
            for q, a in clarification_answers.items():
                user_prompt += f"- Q: {q}\n  A: {a}\n"

        if previous_knowledge:
            user_prompt += f"\n### Relevant Context from Knowledge Base:\n{str(previous_knowledge)[:1000]}\n"

        user_prompt += (
            "\nAnalyze this transcript thoroughly. Produce a complete PerspectiveOutput JSON object. "
            "Ensure the proposed_title is 70 characters or less. Headings must NOT contain emojis."
        )

        output, usage = await self.provider.generate_structured(
            system_prompt=self._system_prompt,
            user_prompt=user_prompt,
            response_schema=PerspectiveOutput,
            temperature=0.2
        )

        # Enforce editorial constraints on output
        if len(output.proposed_title) > 70:
            output.proposed_title = output.proposed_title[:67] + "..."

        # Strip emojis from outline headings if present
        for section in output.proposed_outline:
            section.heading = section.heading.encode("ascii", "ignore").decode().strip()

        logger.info(
            f"Perspective analysis complete for '{output.proposed_title}'. "
            f"Article type: {output.article_type}. Claims extracted: {len(output.claims)}. "
            f"Clarification needed: {len(output.clarification_questions) > 0}."
        )

        # Log usage to Supabase telemetry
        try:
            await self.usage_repo.log_usage(
                provider=self.provider.provider_name,
                model=usage.model,
                operation="perspective_analysis",
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                search_credits=0,
                estimated_cost=usage.estimated_cost,
                job_id=job_id
            )
        except Exception as e:
            logger.warning(f"Could not log usage telemetry in Supabase: {e}")

        return output, usage


perspective_analyst = PerspectiveAnalyst()
