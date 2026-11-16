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

NEWSLETTER_SYSTEM_PROMPT = """You are the personal newsletter editor for DevScrolls (https://devscrolls.dev).
Your audience is senior software engineers, frontend architects, and full-stack developers.
Write a concise, engaging email newsletter announcing a new article.

EDITORIAL RULES:
1. THE SUBJECT LINE:
   - Punchy, curiosity-driven, peer-to-peer (max 50 characters).
   - Looks like an email from a smart colleague, not marketing spam.
   - Good: "Why we killed React Context" or "The Postgres query that took down prod"
   - Bad: "Check out our latest insightful blog post on..."

2. THE OPENING (Coffee-chat tone):
   - 2-3 short paragraphs explaining the real-world friction or engineering challenge that sparked this article.
   - Be transparent, candid, and direct.

3. THE VALUE TEASER:
   - 3 bullet points summarizing what they will take away (mental models, benchmarks, architecture fix).

4. THE "REPLY" ASK:
   - Mandatory: Ask a specific, thoughtful question inviting readers to hit reply directly (e.g. "Have you hit this bottleneck in your microfrontends? Hit reply and let me know how you solved it.").

5. HTML STRUCTURE:
   - Output valid, clean email HTML formatted with <p>, <strong>, <ul>, <li>, and a clean styled button:
     <div style="margin: 28px 0; text-align: center;">
       <a href="{canonical_url}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Read the Full Breakdown &rarr;</a>
     </div>

6. JSON OUTPUT FORMAT:
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
        canonical_url: str
    ) -> Dict[str, Any]:
        """Generates a complete newsletter campaign (subject + HTML body + plain text)."""
        prompt = f"""Generate a newsletter announcement for this new DevScrolls article:

Article Title: {title}
Canonical URL: {canonical_url}

Article Content Excerpt:
{content[:3500]}

Respond ONLY with the JSON object containing 'subject', 'preview_text', 'html_content', and 'plain_text'."""

        system_prompt = NEWSLETTER_SYSTEM_PROMPT.replace("{canonical_url}", canonical_url)

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
            # Fallback newsletter
            subject = f"New on DevScrolls: {title[:40]}"
            html = f"""
            <p>Hey there,</p>
            <p>We just published a deep dive on <strong>{title}</strong> over at DevScrolls.</p>
            <p>In this piece, we break down the production mechanics, trade-offs, and benchmarks you need to know.</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="{canonical_url}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Read the Full Breakdown &rarr;</a>
            </div>
            <p>Have you encountered this challenge in your stack? Hit reply and let me know.</p>
            <p>&mdash; Sandy</p>
            """
            plain = f"Hey there,\n\nWe just published a deep dive on {title}.\n\nRead the full post here: {canonical_url}\n\nHave you hit this challenge? Hit reply and let me know!\n\n-- Sandy"
            return {
                "subject": subject,
                "preview_text": f"Production trade-offs and architecture breakdown for {title[:40]}",
                "html_content": html,
                "plain_text": plain
            }


newsletter_writer = NewsletterWriter()
