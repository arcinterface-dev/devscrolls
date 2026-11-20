"""ScrollBot Software Developer Agent.
Performs scoped code planning, patch generation, and strictly 1-shot auto-fix
under hard token budgets (max 10k total ceiling).
"""
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

from app.ai.factory import get_ai_provider
from app.ai.provider_interface import AIProvider, UsageMetadata
from app.schemas.dev_task import DevTaskPlan, RiskLevel

logger = logging.getLogger(__name__)

# Repository root path for local inspections
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
# Fallback check
if not (REPO_ROOT / "src").exists() and (REPO_ROOT / "myblog" / "src").exists():
    REPO_ROOT = REPO_ROOT / "myblog"

# Hard token budget constants
MAX_PLAN_INPUT_TOKENS = 2000
MAX_PLAN_OUTPUT_TOKENS = 800
MAX_CODE_INPUT_TOKENS = 4000
MAX_CODE_OUTPUT_TOKENS = 1500
MAX_FIX_INPUT_TOKENS = 2000
MAX_FIX_OUTPUT_TOKENS = 1000
HARD_TASK_TOKEN_CEILING = 10000


class PlanStructuredOutput(BaseModel):
    target_files: List[str] = Field(description="Exact file paths to edit, e.g. ['src/components/Header.astro']")
    action_summary: str = Field(description="Bullet points describing the change")
    diff_preview: str = Field(description="Brief code snippet or unified diff preview")
    risk_level: RiskLevel = Field(default="Low")


class CodeFileEdit(BaseModel):
    filepath: str
    updated_content: str


class CodeGenerationOutput(BaseModel):
    files: List[CodeFileEdit]
    summary_of_changes: str


class DevSoftwareEngineerAgent:
    """Agent that plans and writes targeted code updates for the DevScrolls blog."""

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or get_ai_provider("gemini")

    def _read_local_file(self, rel_path: str) -> Optional[str]:
        """Safely reads a local file from the repository if present."""
        clean_path = rel_path.lstrip("/\\")
        target = REPO_ROOT / clean_path
        if target.exists() and target.is_file():
            try:
                return target.read_text(encoding="utf-8")
            except Exception as e:
                logger.warning(f"Could not read local file {target}: {e}")
        return None

    def _truncate_code_context(self, code: str, max_chars: int = 4000) -> str:
        """Truncates long code files to keep token costs strictly within budget."""
        if len(code) <= max_chars:
            return code
        return code[:max_chars] + "\n\n/* ... [Remainder truncated for token efficiency] ... */"

    async def generate_plan(
        self,
        task_id: str,
        user_id: int,
        chat_id: int,
        goal: str,
        remote_file_fetcher=None,
    ) -> Tuple[DevTaskPlan, int]:
        """Generates a scoped implementation plan for the given goal."""
        system_prompt = (
            "You are a Senior Full-Stack & Astro Architect for the DevScrolls engineering blog. "
            "DevScrolls is built with Astro 7, React 19, Tailwind CSS, and TypeScript. "
            "Analyze the user's task and identify the MINIMAL set of files (1 or 2 at most) to touch. "
            "Keep the action summary concise and risk assessment realistic. "
            "Available components include: src/components/Header.astro, Footer.astro, "
            "NewsletterForm.astro, Card.astro, ThemeToggle.astro, ArcadeHub.tsx, "
            "src/layouts/BaseLayout.astro, ArticleLayout.astro, and src/styles/global.css."
        )

        user_prompt = (
            f"Goal: {goal}\n\n"
            "Identify the exact file to modify and outline the precise changes needed. "
            "Do NOT invent imaginary components or rewrite unrelated files."
        )

        try:
            structured, usage = await self.provider.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=PlanStructuredOutput,
                temperature=0.2,
                max_tokens=MAX_PLAN_OUTPUT_TOKENS,
            )
            tokens_used = usage.input_tokens + usage.output_tokens
        except Exception as e:
            logger.warning(f"Structured plan generation fallback: {e}")
            structured = PlanStructuredOutput(
                target_files=["src/components/Header.astro"],
                action_summary=f"Implement change for: {goal}",
                diff_preview="CSS and layout update",
                risk_level="Low",
            )
            tokens_used = 800

        plan = DevTaskPlan(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            goal=goal,
            target_files=structured.target_files,
            action_summary=structured.action_summary,
            diff_preview=structured.diff_preview,
            risk_level=structured.risk_level,
            estimated_tokens=tokens_used + 2500,
            status="awaiting_approval",
        )
        return plan, tokens_used

    async def generate_code(
        self,
        goal: str,
        target_files: List[str],
        remote_file_fetcher=None,
    ) -> Tuple[Dict[str, str], str, int]:
        """Produces updated complete file contents for each target file.
        Returns: (modified_files_dict, summary, tokens_used).
        """
        file_contexts = {}
        for fpath in target_files:
            content = self._read_local_file(fpath)
            if not content and remote_file_fetcher:
                fetched = await remote_file_fetcher(fpath)
                if fetched:
                    content = fetched[0]
            if content:
                file_contexts[fpath] = self._truncate_code_context(content)

        system_prompt = (
            "You are a Senior Astro and TypeScript Engineer. "
            "You write production-ready, clean, error-free Astro, React, and CSS code. "
            "Modify the provided file(s) to fulfill the user's goal. "
            "Output the COMPLETE file content for each modified file so it can be committed directly. "
            "Never use placeholder comments like '// rest of code stays the same'."
        )

        context_str = "\n\n".join(
            [f"--- FILE: {p} ---\n{c}" for p, c in file_contexts.items()]
        )

        user_prompt = (
            f"Goal: {goal}\n\n"
            f"Existing Code Context:\n{context_str}\n\n"
            "Return the full updated content for each file that needs changes."
        )

        try:
            structured, usage = await self.provider.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=CodeGenerationOutput,
                temperature=0.1,
                max_tokens=MAX_CODE_OUTPUT_TOKENS,
            )
            tokens_used = usage.input_tokens + usage.output_tokens
            modified_files = {item.filepath: item.updated_content for item in structured.files}
            summary = structured.summary_of_changes
            return modified_files, summary, tokens_used
        except Exception as e:
            logger.error(f"Code generation error: {e}")
            raise RuntimeError(f"Failed to generate code patch: {e}")

    async def run_one_shot_autofix(
        self,
        goal: str,
        filepath: str,
        buggy_code: str,
        error_log: str,
    ) -> Tuple[Optional[str], int]:
        """Strictly 1-shot auto-fix attempt.
        Takes ONLY the last 20 lines of compiler errors and the buggy code.
        Returns (fixed_code, tokens_used).
        """
        # Truncate error log to last 20 lines to protect token budget
        error_lines = error_log.strip().splitlines()
        tail_errors = "\n".join(error_lines[-20:])

        system_prompt = (
            "You are an Astro and TypeScript build fixer. "
            "An Astro build or TypeScript check failed. "
            "Given the compiler error and the buggy file, fix the exact error. "
            "Return ONLY the complete fixed file content inside a markdown code block."
        )

        user_prompt = (
            f"Goal: {goal}\n"
            f"File: {filepath}\n\n"
            f"Compiler Error:\n```\n{tail_errors}\n```\n\n"
            f"Buggy Code:\n```\n{self._truncate_code_context(buggy_code, max_chars=3500)}\n```\n\n"
            "Output the complete corrected file."
        )

        try:
            raw_text, usage = await self.provider.generate_text(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.1,
                max_tokens=MAX_FIX_OUTPUT_TOKENS,
            )
            tokens_used = usage.input_tokens + usage.output_tokens

            # Extract code block if present
            code_match = re.search(r"```(?:astro|typescript|tsx|jsx|css|html)?\n(.*?)```", raw_text, re.DOTALL)
            fixed_code = code_match.group(1).strip() if code_match else raw_text.strip()
            return fixed_code, tokens_used
        except Exception as e:
            logger.error(f"Auto-fix failed: {e}")
            return None, 500


dev_software_agent = DevSoftwareEngineerAgent()
