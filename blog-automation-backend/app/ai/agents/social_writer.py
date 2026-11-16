"""
Social Media Post Generator (LinkedIn Open-Loop Strategy).
Generates high-engagement, curiosity-driven LinkedIn posts for published DevScrolls articles.
Strictly follows the Open-Loop Pattern:
  1. Hook: Bold, personal statement fitting above the mobile "see more" fold.
  2. Staccato Downward Spiral / Problem Pivot: Sharp, punchy lines.
  3. Teaser Bullets: Creates irresistible curiosity WITHOUT revealing answers or spoiling takeaways.
  4. Canonical Link: Exact URL to devscrolls.dev.
  5. Zero filler words, max 2 hashtags.
"""

import logging
from typing import Dict, Any, Optional
from app.ai.factory import AIFactory
from app.config.settings import settings

logger = logging.getLogger(__name__)

LINKEDIN_SYSTEM_PROMPT = """You are Sandy Krish (Senior Frontend & Full-Stack Architect, creator of DevScrolls at https://devscrolls.dev).
Your goal is to write a high-converting, authentic LinkedIn post promoting your newly published engineering deep dive.

CRITICAL RULES (OPEN-LOOP PATTERN & AUTHENTIC VOICE):
1. AUTHOR PERSONA & PERSONAL TOUCH (MANDATORY):
   - Write strictly in Sandy's first-person authentic practitioner voice ("I", "my", "we" when speaking about real engineering systems).
   - Cold open with your own real debugging discovery, confession, or production frustration.
   - Example: "I spent hours wondering why our backend was still taking traffic after a fast client resolve. The culprit? We trusted Promise.any() to clean up after itself."
   - Never write like an anonymous marketer, corporate PR, or textbook bot.

2. STRICT TRUTHFULNESS & ZERO HALLUCINATION (MANDATORY):
   - Ground all teasers strictly in the provided article title, description, and excerpt.
   - NEVER invent imaginary metrics, fake teammate quotes, or non-existent tools/libraries.
   - Keep technical claims 100% faithful to the real article.

3. THE HOOK (First 2-3 lines):
   - Must fit ABOVE the mobile "see more" fold (under 160 characters before line breaks).
   - Cold open with a bold, uncomfortable personal confession, counter-intuitive insight, or engineering dilemma.

4. THE PROBLEM REFRAME (Staccato cadence):
   - Short, punchy, single-sentence paragraphs.
   - "At first I thought X. But the real problem? Y."

5. CURIOSITY-DRIVEN TEASERS (Do NOT give away the answer!):
   - Use 3-4 bullet points teasing key discoveries WITHOUT explaining the solution.
   - NEVER list answers or tutorial steps. The goal is to sell the click to the article.

6. THE CANONICAL LINK & CALL TO ACTION:
   - Include the exact article URL: {canonical_url}
   - Epigrammatic high-utility CTA (e.g., "Full breakdown with architecture benchmarks and code:").

7. FORMATTING & GUARDRAILS:
   - Use clean line breaks for mobile scannability.
   - BANNED FILLER WORDS: delve, robust, landscape, in conclusion, tapestry, seamless, game-changer, unlock, paradigm.
   - NO HASHTAG STUFFING: Max 2 relevant tags at the very bottom (e.g. #softwareengineering #webdev).
   - Zero emojis in corporate/buzzword ways; maximum 2-3 minimal emojis total.
"""

class SocialWriter:
    """Generates promotional LinkedIn content for DevScrolls articles."""

    def __init__(self):
        self.provider = AIFactory.create_provider()

    async def generate_linkedin_post(
        self,
        title: str,
        content: str,
        canonical_url: str,
        tags: Optional[list] = None
    ) -> str:
        """Generates an open-loop LinkedIn post promoting the article."""
        prompt = f"""Write a LinkedIn post promoting this article:

Article Title: {title}
Article Canonical URL: {canonical_url}
Tags: {', '.join(tags) if tags else 'Engineering'}

Article Content Excerpt:
{content[:3000]}

Generate the complete LinkedIn post now following the Open-Loop rules."""

        system_prompt = LINKEDIN_SYSTEM_PROMPT.replace("{canonical_url}", canonical_url)

        try:
            text_result, _ = await self.provider.generate_text(
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=0.7
            )
            # Ensure canonical link is present
            post_text = text_result.strip()
            if canonical_url not in post_text:
                post_text += f"\n\nRead the full post here:\n{canonical_url}"
            return post_text
        except Exception as e:
            logger.error(f"Error generating LinkedIn post: {e}", exc_info=True)
            # Fallback template
            return (
                f"I just published a deep dive on \"{title}\" over at DevScrolls.\n\n"
                "In this article, I tear apart the runtime mechanics, production pitfalls, and real-world benchmarks.\n\n"
                f"Read the full engineering breakdown:\n{canonical_url}\n\n"
                "#softwareengineering #webdev"
            )


social_writer = SocialWriter()
