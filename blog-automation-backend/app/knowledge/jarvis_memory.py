"""Jarvis Living Blog Micro-Memory Assembler.
Combines Tier 1 (Author Persona), Tier 2 (Living Blog Catalog from llms.txt),
and Tier 3 (Private Learned Facts from Supabase) into an ultra-compact ~2,000 token context.
Zero vector database, zero extra monthly costs, 100% recall.
"""
import logging
from pathlib import Path
from typing import List, Optional

from app.schemas.database import PersonalKnowledge
from app.storage.repositories.knowledge_repo import KnowledgeRepository

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if not (REPO_ROOT / "public").exists() and (REPO_ROOT / "myblog" / "public").exists():
    REPO_ROOT = REPO_ROOT / "myblog"

KNOWLEDGE_ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "knowledge_assets"


class JarvisMemoryContext:
    """Assembles all 3 tiers of author memory into a coherent prompt context."""

    def __init__(self):
        self.knowledge_repo = KnowledgeRepository()
        self._cached_llms_txt: Optional[str] = None
        self._cached_voice_profile: Optional[str] = None

    def get_tier1_author_persona(self) -> str:
        """Tier 1: Static Core Persona, Stances & Voice."""
        if not self._cached_voice_profile:
            voice_file = KNOWLEDGE_ASSETS_DIR / "VOICE_PROFILE.md"
            if voice_file.exists():
                self._cached_voice_profile = voice_file.read_text(encoding="utf-8")[:1800]
            else:
                self._cached_voice_profile = (
                    "Santhanakrishnan ('Sandy') is a Senior Frontend & Full-Stack Architect with 7+ years "
                    "of production engineering experience. He writes with zero AI fluff, focusing on real-world "
                    "production pain, V8 runtime mechanics, trade-off analysis, sub-50ms LCP, and zero-egress browser tools."
                )
        return self._cached_voice_profile

    def get_tier2_living_blog_catalog(self) -> str:
        """Tier 2: Complete Living Blog Catalog (Articles, Tools, Games from public/llms.txt)."""
        if not self._cached_llms_txt:
            llms_path = REPO_ROOT / "public" / "llms.txt"
            if llms_path.exists():
                try:
                    self._cached_llms_txt = llms_path.read_text(encoding="utf-8")
                except Exception as e:
                    logger.warning(f"Could not read public/llms.txt: {e}")
            if not self._cached_llms_txt:
                self._cached_llms_txt = (
                    "DevScrolls published articles include: AbortController HTTP cancellations, "
                    "AI Rewired My Brain, Remote Jobs Reality, JSON Formatter JQ engine, DailyScroll, "
                    "20-Minute Angular Interview, Berribot AI Interview, MERN AI Bot Interview, "
                    "Gemini Interview Prep, Whiteboard Reality Check, Frontend in 2026, and Python GenAI Interview. "
                    "Tools: ATS Scroll, PII Scrubber, JWT Inspector, JSON Formatter, DailyScroll. "
                    "Games: SketchQL (multiplayer tech draw & guess)."
                )
        return self._cached_llms_txt

    async def get_tier3_atomic_facts(self) -> str:
        """Tier 3: Learned Atomic Facts & Preferences from Supabase."""
        try:
            entries: List[PersonalKnowledge] = await self.knowledge_repo.list_recent_knowledge(limit=50)
            if not entries:
                return "No custom preferences or permanent rules saved yet."

            lines = []
            for item in entries:
                corrected = item.corrected_content or item.original_content
                k_type = item.knowledge_type or "note"
                lines.append(f"• [{k_type.upper()}] {item.topic}: {corrected}")
            return "\n".join(lines)
        except Exception as e:
            logger.warning(f"Could not retrieve Tier 3 facts from Supabase: {e}")
            return "No custom preferences loaded."

    async def build_jarvis_system_prompt(self) -> str:
        """Builds the complete Jarvis system prompt with all 3 memory tiers (~2,200 tokens)."""
        tier1 = self.get_tier1_author_persona()
        tier2 = self.get_tier2_living_blog_catalog()
        tier3 = await self.get_tier3_atomic_facts()

        prompt = f"""You are ScrollBot Jarvis, the personal AI chief of staff, engineering partner, and living blog companion for Santhanakrishnan ('Sandy').
DevScrolls (https://devscrolls.dev) is Sandy's engineering blog, developer tools suite, and remote job board.

=== TIER 1: WHO SANDY IS (AUTHOR PERSONA & PHILOSOPHY) ===
{tier1}

=== TIER 2: OUR LIVING BLOG (PUBLISHED ARTICLES, TOOLS & GAMES) ===
You have full knowledge of all published DevScrolls articles, tools, and games:
{tier2}

=== TIER 3: OUR PRIVATE MEMORY LEDGER (RULES & PREFERENCES) ===
Permanent rules, architectural decisions, and personal preferences Sandy has taught you:
{tier3}

=== YOUR CONVERSATIONAL GUIDELINES ===
1. Tone: Peer-to-peer senior software architect. Direct, insightful, candid, and warm. Address Sandy naturally.
2. Cross-referencing: Whenever Sandy discusses an engineering topic, proactively connect it to past articles you wrote together on DevScrolls when relevant (e.g., 'Just like in your AbortController article...').
3. Proactive Thinking: If Sandy shares a new problem or bug story, evaluate whether it's worth turning into a new blog post, a developer tool, or an arcade game.
4. No Fluff: Skip generic boilerplate ('I hope this helps!', 'As an AI...'). Answer with high technical signal.
5. Living Blog: Speak about DevScrolls as 'our blog', 'our tools', and 'our platform'.
"""
        return prompt


jarvis_memory = JarvisMemoryContext()
