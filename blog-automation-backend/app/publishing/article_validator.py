"""
Pre-Publish Article Validator for DevScrolls.
Ensures every blog post strictly conforms to Astro Content Collection schemas,
taxonomy enums, banned word restrictions, and formatting guardrails before being
committed to GitHub.
"""

import re
import yaml
import logging
from typing import Any, Dict, List, Tuple
from app.schemas.article import AstroFrontmatter

logger = logging.getLogger(__name__)

BANNED_WORDS = [
    "delve",
    "robust",
    "landscape",
    "in conclusion",
    "tapestry",
    "seamless",
    "game-changer",
]

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "]+",
    flags=re.UNICODE
)


class ArticleValidator:
    """Validates markdown and frontmatter prior to GitHub commit."""

    @staticmethod
    def validate_and_format(
        title: str,
        slug: str,
        markdown_content: str,
        frontmatter_dict: Dict[str, Any]
    ) -> Tuple[bool, str, List[str]]:
        """
        Validates article contents and builds the final formatted markdown file.

        Returns:
            Tuple of (is_valid, final_file_content, error_messages)
        """
        errors = []

        # 1. Frontmatter Schema Validation via Pydantic
        try:
            frontmatter = AstroFrontmatter.model_validate(frontmatter_dict)
        except Exception as e:
            errors.append(f"Frontmatter schema validation failed: {e}")
            return False, "", errors

        # 2. Title Length Check (<= 70 chars)
        if len(frontmatter.title) > 70:
            errors.append(f"Title exceeds 70 characters ({len(frontmatter.title)} chars)")

        # 3. Description Length Check (100 - 160 chars)
        desc_len = len(frontmatter.description)
        if desc_len < 100 or desc_len > 160:
            errors.append(f"Description length ({desc_len} chars) must be between 100 and 160 characters")

        # 4. Check for Banned Filler Words in Body
        lower_body = markdown_content.lower()
        for word in BANNED_WORDS:
            if re.search(r"\b" + re.escape(word) + r"\b", lower_body):
                errors.append(f"Banned filler word detected in body text: '{word}'")

        # 5. Check for Emojis in Headings
        lines = markdown_content.split("\n")
        for line_num, line in enumerate(lines, 1):
            if re.match(r"^#{1,6}\s+", line):
                if EMOJI_PATTERN.search(line):
                    errors.append(f"Emoji detected in heading at line {line_num}: '{line.strip()}'")

        # 6. Check for BLUF (Bolded statement in opening section)
        first_paragraphs = [l.strip() for l in lines if l.strip()][:3]
        has_bluf = any(p.startswith("**") and "**" in p[2:] for p in first_paragraphs)
        if not has_bluf:
            logger.warning("Article does not appear to feature a bolded BLUF in the opening paragraph.")

        if errors:
            return False, "", errors

        # 7. Construct Final Markdown with YAML Frontmatter
        fm_payload = frontmatter.model_dump(exclude_none=True)

        # Build clean YAML frontmatter
        yaml_header = yaml.dump(
            fm_payload,
            sort_keys=False,
            default_flow_style=False,
            allow_unicode=True
        ).strip()

        final_content = f"---\n{yaml_header}\n---\n\n{markdown_content.strip()}\n"
        return True, final_content, []


article_validator = ArticleValidator()
