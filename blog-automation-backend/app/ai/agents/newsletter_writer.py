"""
Email Newsletter Writer for DevScrolls.
Generates high-engagement, conversational newsletters promoting published articles
for delivery via Kit (ConvertKit).
Adheres strictly to the DevScrolls Newsletter Framework:
  - Subject line <= 50 chars, punchy and conversational.
  - The "Reply Ask": Questions designed to spark direct replies and preserve inbox deliverability.
  - Peer-to-peer developer voice, zero corporate filler words.
  - Clean HTML layout with clear CTA button to canonical URL.
"""

import json
import logging
from typing import Any, Dict, Optional
from app.ai.factory import AIFactory
from app.config.settings import settings

logger = logging.getLogger(__name__)

NEWSLETTER_SYSTEM_PROMPT = """You are Sandy Krish (Senior Frontend & Full-Stack Architect, creator of DevScrolls at https://devscrolls.dev).
You are writing a personal, authentic newsletter directly to your subscribers (senior engineers, technical leads, and full-stack developers).

CRITICAL REQUIREMENTS & CONSTRAINTS:

1. PERSONA & AUTHENTIC VOICE (MANDATORY):
   - Write in Sandy's first-person voice ("I", "my", "we" when referring to real engineering work).
   - Greeting: MUST start with "Hey there," or "Hey fellow engineers,". NEVER say "Hey team," or corporate filler.
   - Sign-off: MUST conclude with:
     <p>&mdash; Sandy Krish, DevScrolls</p>
     NEVER sign off as "DevScrolls Team", "Best, DevScrolls Team", or generic titles.
   - Tone: A candid note from a smart senior colleague over coffee. Share the real engineering discovery, what caught you off guard, or why you took the time to investigate and write this piece.

2. STRICT TRUTHFULNESS & ZERO HALLUCINATION (MANDATORY):
   - You MUST explicitly introduce the EXACT article title: "{title}"
   - You MUST reference the article's real core premise and description: "{description}"
   - NEVER hallucinate or invent problems, terms, or metaphors (like "socket bleed" or fabricated metrics) that are not present in the article excerpt or author's transcript.
   - Ground every single point, bullet, and takeaway strictly in what the article actually proves and explains.

3. STRUCTURE & FLOW:
   - Opening: 1-2 short, punchy paragraphs sharing the real-world friction or misconception that sparked the article.
   - Core Takeaway Teaser: 3 concise bullet points highlighting what the reader will learn (the architectural mechanism, the underlying engine behavior, the production fix).
   - The "Reply" Ask: A thoughtful, specific question inviting direct replies (e.g. "Have you hit this in your stack? Hit reply and let me know.").
   - CTA Button:
     <div style="margin: 28px 0; text-align: center;">
       <a href="{canonical_url}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Read the Full Breakdown &rarr;</a>
     </div>

4. THE SUBJECT LINE:
   - Punchy, curiosity-driven, peer-to-peer (max 50 characters).
   - Looks like an email from a smart colleague.
   - BANNED FILLER WORDS: delve, robust, landscape, in conclusion, tapestry, seamless, game-changer, unlock.

5. JSON OUTPUT FORMAT:
   Return ONLY a valid JSON object with these keys:
   {
     "subject": "Email subject line (<=50 chars)",
     "preview_text": "Email preview preheader (<=80 chars)",
     "html_content": "Full HTML email body",
     "plain_text": "Plain text version for Telegram copy"
   }
"""

class NewsletterWriter:
    """Generates email newsletter drafts for DevScrolls articles."""

    def __init__(self):
        self.provider = AIFactory.create_provider()

    async def generate_newsletter(
        self,
        title: str,
        content: str,
        canonical_url: str,
        description: Optional[str] = None,
        author_name: str = "Sandy"
    ) -> Dict[str, Any]:
        """Generates a complete newsletter campaign (subject + HTML body + plain text)."""
        prompt = f"""Write a personal newsletter announcement from {author_name} for this new DevScrolls article:

Article Title: {title}
Article Description: {description or 'Production architecture and runtime trade-offs.'}
Canonical URL: {canonical_url}

Article Content Excerpt (use ONLY real facts, code mechanisms, and trade-offs from this text):
{content[:3500]}

Respond ONLY with the JSON object containing 'subject', 'preview_text', 'html_content', and 'plain_text'."""

        system_prompt = (
            NEWSLETTER_SYSTEM_PROMPT
            .replace("{canonical_url}", canonical_url)
            .replace("{title}", title)
            .replace("{description}", description or "")
            .replace("{author_name}", author_name)
        )

        try:
            raw, _ = await self.provider.generate_text(
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=0.7
            )
            raw = raw.strip()
            if raw.startswith("```"):
                lines = raw.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()

            parsed = json.loads(raw)
            return {
                "subject": parsed.get("subject", f"New on DevScrolls: {title}"),
                "preview_text": parsed.get("preview_text", ""),
                "html_content": parsed.get("html_content", ""),
                "plain_text": parsed.get("plain_text", "")
            }
        except Exception as e:
            logger.error(f"Error generating newsletter with AI: {e}", exc_info=True)
            # Fallback newsletter adhering strictly to author persona and exact title
            subject = f"New on DevScrolls: {title[:40]}"
            html = f"""
            <p>Hey there,</p>
            <p>I just published a deep dive on <strong>"{title}"</strong> over at DevScrolls.</p>
            <p>{description or "In this piece, I break down the production mechanics, runtime trade-offs, and benchmarks you need to know."}</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="{canonical_url}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Read the Full Breakdown &rarr;</a>
            </div>
            <p>Have you encountered this challenge in your stack? Hit reply and let me know.</p>
            <p>&mdash; Sandy Krish, DevScrolls</p>
            """
            plain = f"Hey there,\n\nI just published a deep dive on \"{title}\" over at DevScrolls.\n\nRead the full post here: {canonical_url}\n\nHave you hit this challenge? Hit reply and let me know!\n\n-- Sandy Krish, DevScrolls"
            return {
                "subject": subject,
                "preview_text": f"Production trade-offs and architecture breakdown for {title[:40]}",
                "html_content": html,
                "plain_text": plain
            }


newsletter_writer = NewsletterWriter()
