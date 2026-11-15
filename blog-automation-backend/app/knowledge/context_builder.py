"""
Context Builder for Agent 4: Blog Writer.
Assembles author voice profiles, tone guidelines, editorial constraints,
and verified research evidence into a cohesive prompt context.
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.schemas.perspective import PerspectiveOutput
from app.schemas.research import ResearchOutput
from app.schemas.factcheck import FactCheckOutput

logger = logging.getLogger(__name__)

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent.parent / "knowledge_assets"


class ContextBuilder:
    """Assembles all relevant context assets for blog generation."""

    def __init__(self, knowledge_dir: Optional[Path] = None):
        self.knowledge_dir = knowledge_dir or KNOWLEDGE_DIR
        self._voice_profile: Optional[str] = None
        self._tone_and_voice: Optional[str] = None
        self._content_schema: Optional[str] = None

    def get_voice_profile(self) -> str:
        """Retrieves Santhanakrishnan's voice profile."""
        if self._voice_profile is None:
            path = self.knowledge_dir / "VOICE_PROFILE.md"
            if path.exists():
                self._voice_profile = path.read_text(encoding="utf-8")
            else:
                self._voice_profile = (
                    "Santhanakrishnan is a Senior Frontend Engineer. He writes directly to peer engineers, "
                    "focusing on real-world production pain, trade-off analysis, and runtime mechanics."
                )
        return self._voice_profile

    def get_tone_guidelines(self) -> str:
        """Retrieves tone and voice rules."""
        if self._tone_and_voice is None:
            path = self.knowledge_dir / "post-tone-and-voice.md"
            if path.exists():
                self._tone_and_voice = path.read_text(encoding="utf-8")
            else:
                self._tone_and_voice = (
                    "Use cold open downward spirals, BLUF thesis in first 150 words, "
                    "and epigrammatic parallel reversals."
                )
        return self._tone_and_voice

    def get_writing_sample(self, category: str = "frontend") -> str:
        """Retrieves a representative writing sample if available."""
        samples_dir = self.knowledge_dir / "writing_samples"
        if samples_dir.exists():
            for file in samples_dir.glob("*.md"):
                try:
                    content = file.read_text(encoding="utf-8")
                    if f'category: "{category}"' in content or f"category: '{category}'" in content:
                        return content[:2500]
                except Exception:
                    continue
            # Fallback to first file
            for file in samples_dir.glob("*.md"):
                return file.read_text(encoding="utf-8")[:2500]
        return ""

    def build_writer_prompt(
        self,
        perspective: PerspectiveOutput,
        research: ResearchOutput,
        factcheck: FactCheckOutput,
        target_category: Optional[str] = None
    ) -> str:
        """Constructs the comprehensive prompt for the Blog Writer Agent."""
        voice = self.get_voice_profile()[:2000]
        sample = self.get_writing_sample(target_category or "frontend")

        # Format verified claims & nuance
        verified_points = []
        for v in factcheck.verifications:
            if v.status.value in ["verified", "personal_opinion", "personal_exp"]:
                verified_points.append(f"• {v.claim_text} (Status: {v.status.value})")

        minor_nuances = [f"• {mc.claim}: {mc.suggested_nuance}" for mc in factcheck.minor_corrections]

        # Sources for contextual hyperlinking
        authoritative_sources = []
        for cr in research.claims_researched:
            for s in cr.sources[:2]:
                authoritative_sources.append(f"• [{s.source_title}]({s.source_url}) ({s.source_type})")

        prompt = f"""
### 1. AUTHOR PERSPECTIVE & CORE THESIS:
• Proposed Title: {perspective.proposed_title}
• Main Argument (BLUF): {perspective.main_argument}
• Target Audience: {perspective.target_audience}
• Format / Article Type: {perspective.article_type}
• Personal Voice & Viewpoint: {perspective.personal_perspective}

### 2. OUTLINE SECTIONS TO EXPAND:
"""
        for i, sec in enumerate(perspective.outline, 1):
            prompt += f"{i}. {sec.heading}\n"
            for pt in sec.key_points:
                prompt += f"   - {pt}\n"

        prompt += f"""
### 3. VERIFIED CLAIMS TO WEAVE INTO NARRATIVE:
{chr(10).join(verified_points) if verified_points else "None"}

### 4. TECHNICAL NUANCES & REFINEMENTS:
{chr(10).join(minor_nuances) if minor_nuances else "None"}

### 5. AUTHORITATIVE SOURCES TO CITE OR LINK:
{chr(10).join(authoritative_sources[:6]) if authoritative_sources else "None"}

### 6. AUTHOR VOICE EXCERPT:
{voice}
"""
        if sample:
            prompt += f"""
### 7. DEVSCROLLS STYLE REFERENCE SNIPPET:
```markdown
{sample[:1200]}
```
"""
        return prompt


context_builder = ContextBuilder()
