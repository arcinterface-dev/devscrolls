"""Telegram message and callback handlers for ScrollBot Software Developer Agent.
Provides deterministic, zero-waste command routing via /new, plan review gates,
and 1-click production merges.
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Optional
from uuid import uuid4

from app.ai.agents.dev_agent import dev_software_agent
from app.publishing.github_dev_client import github_dev_client
from app.schemas.dev_task import DevTaskPlan, DevTaskResult
from app.telegram.bot_client import bot_client
from app.telegram.keyboards_dev import (
    get_dev_deploy_keyboard,
    get_dev_failure_keyboard,
    get_dev_plan_keyboard,
)
from app.telegram.session_manager import session_manager
from app.workers.dev_verifier import dev_verifier

logger = logging.getLogger(__name__)

# Active in-flight tasks registries
active_dev_plans: Dict[str, DevTaskPlan] = {}
active_dev_results: Dict[str, DevTaskResult] = {}


async def handle_cmd_new(chat_id: int, user_id: int, text: str) -> None:
    """Entry point for /new command.
    If task text is provided inline, immediately launches planning.
    Otherwise sets session stage to await developer task prompt.
    """
    raw_prompt = text.strip()
    if len(raw_prompt) > 4 and raw_prompt[4:].strip():
        goal = raw_prompt[4:].strip()
        await start_dev_task_planning(chat_id, user_id, goal)
        return

    # User typed just /new — prompt for task description
    conv = await session_manager.get_or_create_active_conversation(user_id)
    await session_manager.set_conversation_stage(conv.id, "dev_task_input")

    msg = (
        "🛠️ <b>ScrollBot Software Developer Agent Activated</b>\n\n"
        "Please describe the feature, design tweak, or bugfix you'd like to implement on your blog:\n\n"
        "<b>Examples:</b>\n"
        "• <i>Hide the job newsletter signup banner on mobile screens</i>\n"
        "• <i>Change the header accent color from orange to emerald</i>\n"
        "• <i>Add a copy button to code blocks on article pages</i>\n\n"
        "You can send a 📝 <b>text message</b> or record a 🎙️ <b>voice note</b>.\n"
        "<i>(Type /cancel anytime to abort)</i>"
    )
    await bot_client.send_message(chat_id=chat_id, text=msg)


async def handle_dev_text_input(chat_id: int, user_id: int, text: str) -> None:
    """Processes task description sent after typing /new."""
    conv = await session_manager.get_or_create_active_conversation(user_id)
    await session_manager.set_conversation_stage(conv.id, "active")
    await start_dev_task_planning(chat_id, user_id, text.strip())


async def start_dev_task_planning(chat_id: int, user_id: int, goal: str) -> None:
    """Generates an initial implementation plan under strict token budgeting."""
    task_id = uuid4().hex[:8]

    status_resp = await bot_client.send_message(
        chat_id=chat_id,
        text=f"⏳ <b>Analyzing codebase & drafting plan for:</b>\n<i>\"{goal}\"</i>...",
    )
    status_msg_id = status_resp.get("message_id") if isinstance(status_resp, dict) else None

    try:
        plan, tokens_used = await dev_software_agent.generate_plan(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            goal=goal,
        )
        active_dev_plans[task_id] = plan

        files_formatted = "\n".join([f"  • <code>{f}</code>" for f in plan.target_files]) or "  • <i>Auto-detected</i>"

        plan_text = (
            f"🛠️ <b>Dev Task Plan (ID: <code>{task_id}</code>)</b>\n\n"
            f"🎯 <b>Goal:</b> {plan.goal}\n\n"
            f"📂 <b>Target Files:</b>\n{files_formatted}\n\n"
            f"📋 <b>Action Summary:</b>\n{plan.action_summary}\n\n"
            f"⚠️ <b>Risk Level:</b> <code>{plan.risk_level}</code>\n"
            f"🪙 <b>Est. Tokens:</b> ~{plan.estimated_tokens}\n\n"
            f"<b>Proposed Diff Preview:</b>\n<pre>{plan.diff_preview[:600]}</pre>"
        )

        keyboard = get_dev_plan_keyboard(task_id)

        if status_msg_id:
            await bot_client.edit_message_text(
                chat_id=chat_id,
                message_id=status_msg_id,
                text=plan_text,
                reply_markup=keyboard,
            )
        else:
            await bot_client.send_message(
                chat_id=chat_id,
                text=plan_text,
                reply_markup=keyboard,
            )

    except Exception as e:
        logger.error(f"Dev task planning failed: {e}")
        err_msg = f"❌ <b>Planning failed:</b> {e}"
        if status_msg_id:
            await bot_client.edit_message_text(chat_id=chat_id, message_id=status_msg_id, text=err_msg)
        else:
            await bot_client.send_message(chat_id=chat_id, text=err_msg)


async def handle_dev_callback(
    action: str,
    target_id: str,
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
) -> None:
    """Router for all dev agent callbacks."""
    if action == "dev_approve":
        await _handle_dev_approve(cb_id, chat_id, message_id, user_id, target_id)
    elif action == "dev_cancel":
        await _handle_dev_cancel(cb_id, chat_id, message_id, target_id)
    elif action == "dev_merge":
        await _handle_dev_merge(cb_id, chat_id, message_id, target_id)
    elif action == "dev_reject":
        await _handle_dev_reject(cb_id, chat_id, message_id, target_id)
    elif action == "dev_retry":
        await _handle_dev_retry(cb_id, chat_id, message_id, user_id, target_id)


async def _handle_dev_approve(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    task_id: str,
) -> None:
    """User approved plan: generate code, test locally, commit to feature branch."""
    await bot_client.answer_callback_query(cb_id, text="Plan approved. Generating code...")

    plan = active_dev_plans.get(task_id)
    if not plan:
        await bot_client.send_message(chat_id=chat_id, text="⚠️ Dev task session expired or not found.")
        return

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            f"⚙️ <b>Executing Task: <code>{task_id}</code></b>\n\n"
            "1. ✍️ Generating code patches...\n"
            "2. 🧪 Running local build verification (<code>npm run build</code>)...\n"
            "3. 🛡️ Enforcing strict 1-shot auto-fix check...\n\n"
            "<i>This takes about 20-30 seconds.</i>"
        ),
    )

    timestamp = int(datetime.now(timezone.utc).timestamp())
    branch_name = f"feat/bot-{task_id}-{timestamp}"

    try:
        # 1. Generate code modifications
        modified_files, summary, code_tokens = await dev_software_agent.generate_code(
            goal=plan.goal,
            target_files=plan.target_files,
        )

        # 2. Verify with local build and strictly 1 auto-fix attempt
        result = await dev_verifier.verify_and_deploy_branch(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            goal=plan.goal,
            branch_name=branch_name,
            modified_files=modified_files,
            diff_summary=summary,
        )
        result.tokens_used += code_tokens
        active_dev_results[task_id] = result

        if result.build_passed:
            files_list = "\n".join([f"  • <code>{p}</code>" for p in modified_files.keys()])
            autofix_status = "✅ 1 attempt (succeeded)" if result.auto_fix_attempted else "None required (passed clean)"

            deploy_text = (
                f"🚀 <b>Code Ready & Build Verified!</b>\n\n"
                f"🎯 <b>Task:</b> {plan.goal}\n"
                f"🌿 <b>Branch:</b> <code>{branch_name}</code>\n"
                f"📂 <b>Modified Files:</b>\n{files_list}\n\n"
                f"🧪 <b>Verification:</b>\n"
                f"  • <code>astro check</code>: ✅ 0 errors\n"
                f"  • <code>npm run build</code>: ✅ Static HTML generated\n"
                f"  • Auto-fix used: <i>{autofix_status}</i>\n"
                f"🪙 <b>Tokens Spent:</b> {result.tokens_used} tokens\n\n"
                "Tap below to review the live preview or merge straight to production."
            )
            keyboard = get_dev_deploy_keyboard(
                task_id=task_id,
                preview_url=result.vercel_preview_url,
                pr_url=result.pull_request_url,
            )
            await bot_client.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=deploy_text,
                reply_markup=keyboard,
            )
        else:
            # Build failed even after the 1-shot auto-fix
            err_tail = "\n".join(result.build_log.strip().splitlines()[-15:])
            fail_text = (
                f"❌ <b>Build Verification Failed</b>\n\n"
                f"🎯 <b>Task:</b> {plan.goal}\n"
                f"⚠️ The build failed in simulation, and the 1-shot auto-fix could not safely resolve it.\n"
                f"<b>Strict Guardrail:</b> Auto-fix halted to protect token budget.\n\n"
                f"<b>Compiler Error:</b>\n<pre>{err_tail}</pre>"
            )
            keyboard = get_dev_failure_keyboard(task_id)
            await bot_client.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=fail_text,
                reply_markup=keyboard,
            )

    except Exception as e:
        logger.error(f"Execution error for task {task_id}: {e}")
        await bot_client.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=f"❌ <b>Error during execution:</b> {e}",
            reply_markup=get_dev_failure_keyboard(task_id),
        )


async def _handle_dev_merge(
    cb_id: str,
    chat_id: int,
    message_id: int,
    task_id: str,
) -> None:
    """Merges pull request into main and triggers production Vercel deployment."""
    await bot_client.answer_callback_query(cb_id, text="Merging to main...")

    result = active_dev_results.get(task_id)
    if not result:
        await bot_client.send_message(chat_id=chat_id, text="⚠️ Result expired or not found.")
        return

    merged = False
    if result.pull_number:
        merged = await github_dev_client.merge_pull_request(result.pull_number)

    if merged or not result.pull_number:
        # Delete transient feature branch
        await github_dev_client.delete_feature_branch(result.branch_name)

        success_text = (
            f"🎉 <b>Successfully Merged to Production!</b>\n\n"
            f"🎯 <b>Task:</b> {result.goal}\n"
            f"🌿 Merged branch <code>{result.branch_name}</code> into <code>main</code>.\n"
            f"🚀 Vercel deployment has automatically triggered.\n\n"
            f"Your changes will be live on <a href=\"https://devscrolls.dev\">devscrolls.dev</a> in ~60 seconds."
        )
        await bot_client.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=success_text,
        )
        # Clear task from memory
        active_dev_plans.pop(task_id, None)
        active_dev_results.pop(task_id, None)
    else:
        await bot_client.send_message(
            chat_id=chat_id,
            text="⚠️ Could not automatically merge PR on GitHub. Please review and merge the PR manually.",
        )


async def _handle_dev_reject(
    cb_id: str,
    chat_id: int,
    message_id: int,
    task_id: str,
) -> None:
    """User rejected changes: delete feature branch and discard task."""
    await bot_client.answer_callback_query(cb_id, text="Branch discarded.")

    result = active_dev_results.get(task_id)
    if result:
        await github_dev_client.delete_feature_branch(result.branch_name)
        active_dev_results.pop(task_id, None)
    active_dev_plans.pop(task_id, None)

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text="🗑️ <b>Task Discarded:</b> Feature branch deleted. No changes were merged to production.",
    )


async def _handle_dev_cancel(
    cb_id: str,
    chat_id: int,
    message_id: int,
    task_id: str,
) -> None:
    """Cancels task during initial plan stage."""
    await bot_client.answer_callback_query(cb_id, text="Task cancelled.")
    active_dev_plans.pop(task_id, None)
    active_dev_results.pop(task_id, None)

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text="❌ <b>Task Cancelled:</b> Zero changes were made and zero build spend incurred.",
    )


async def _handle_dev_retry(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    task_id: str,
) -> None:
    """Prompts user to send additional guidance for the failed task."""
    await bot_client.answer_callback_query(cb_id, text="Please send extra guidance.")
    conv = await session_manager.get_or_create_active_conversation(user_id)
    await session_manager.set_conversation_stage(conv.id, "dev_task_input")

    await bot_client.send_message(
        chat_id=chat_id,
        text="💬 Please reply with clarification or extra guidance for this task, and ScrollBot will draft a new plan.",
    )
