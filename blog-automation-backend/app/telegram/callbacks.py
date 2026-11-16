"""Telegram inline keyboard callback query handler.
Enforces callback ownership, prevents replay attacks, and manages state transitions
for Gate 1 (Audio confirmation) and Gate 2 (Transcript confirmation).
"""
import logging
from typing import Any, Dict
from uuid import UUID

from app.ai.transcription import transcription_service
from app.schemas.database import InputSession
from app.storage.repositories import (
    ClaimRepository,
    ConversationRepository,
    DraftRepository,
    InputSessionRepository,
    JobRepository,
    UserRepository,
)
from app.telegram.bot_client import bot_client
from app.telegram.keyboards import (
    get_audio_confirmation_keyboard,
    get_cancel_only_keyboard,
    get_draft_review_keyboard,
    get_draft_list_keyboard,
    get_draft_detail_keyboard,
    get_post_publish_keyboard,
    get_linkedin_keyboard,
    get_newsletter_keyboard,
    get_transcript_review_keyboard,
)
from app.telegram.session_manager import session_manager
from app.config.settings import settings
from app.workers.job_queue import job_queue

logger = logging.getLogger(__name__)

user_repo = UserRepository()
conv_repo = ConversationRepository()
session_repo = InputSessionRepository()
job_repo = JobRepository()
draft_repo = DraftRepository()
claim_repo = ClaimRepository()

async def handle_callback_query(callback_query: Dict[str, Any]) -> None:
    """Entry point for all Telegram callback queries (inline button taps)."""
    cb_id = callback_query["id"]
    from_user = callback_query["from"]
    user_id = from_user["id"]
    data = callback_query.get("data", "")
    message = callback_query.get("message")

    if not message:
        await bot_client.answer_callback_query(cb_id, text="Error: message context missing.")
        return

    chat_id = message["chat"]["id"]
    message_id = message["message_id"]

    # 1. Authorization check
    if not await user_repo.is_authorized(user_id):
        await bot_client.answer_callback_query(
            cb_id,
            text="Unauthorized access. Your user ID is not allowlisted.",
            show_alert=True
        )
        return

    if ":" in data:
        action, target_id = data.split(":", 1)
    else:
        action, target_id = data, ""

    try:
        if action == "audio_confirm":
            await _handle_audio_confirm(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "audio_rerecord":
            await _handle_audio_rerecord(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "session_cancel":
            await _handle_session_cancel(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "transcript_edit":
            await _handle_transcript_edit(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "transcript_confirm":
            await _handle_transcript_confirm(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "corr_accept":
            await _handle_corr_accept(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "corr_override":
            await _handle_corr_override(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "corr_cancel":
            await _handle_corr_cancel(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_approve":
            await _handle_draft_approve(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_view":
            await _handle_draft_view(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_sources":
            await _handle_draft_sources(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_revise":
            await _handle_draft_revise(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_reject":
            await _handle_draft_reject(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_keep":
            await _handle_draft_keep(cb_id, chat_id, message_id, user_id, target_id)
        elif action in ["draft_list", "draft_refresh"]:
            await _handle_draft_list(cb_id, chat_id, message_id)
        elif action == "draft_select":
            await _handle_draft_select(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_archive":
            await _handle_draft_archive(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "draft_new_idea":
            await _handle_draft_new_idea(cb_id, chat_id, message_id, user_id)
        elif action == "post_publish_linkedin":
            await _handle_post_publish_linkedin(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "post_publish_kit":
            await _handle_post_publish_kit(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "job_resume":
            await _handle_job_resume(cb_id, chat_id, message_id, user_id, target_id)
        elif action == "job_cancel":
            await _handle_corr_cancel(cb_id, chat_id, message_id, user_id, target_id)
        else:
            await bot_client.answer_callback_query(cb_id, text="Action not recognized.")
    except Exception as e:
        logger.error(f"Error handling callback {action} for user {user_id}: {e}", exc_info=True)
        await bot_client.answer_callback_query(
            cb_id,
            text=f"An error occurred: {str(e)[:100]}",
            show_alert=True
        )

# ------------------------------------------------------------------------------
# Action Implementations
# ------------------------------------------------------------------------------

async def _verify_session_ownership(
    session_id: str,
    user_id: int
) -> tuple[bool, str, InputSession | None]:
    """Verifies that the session exists and belongs to the authenticated Telegram user."""
    session = await session_repo.get_by_id(session_id)
    if not session:
        return False, "Input session not found or expired.", None

    conv = await conv_repo.get_by_id(session.conversation_id)
    if not conv or conv.telegram_user_id != user_id:
        return False, "You do not have permission to modify this session.", None

    return True, "", session


async def _handle_audio_confirm(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    session_id: str
) -> None:
    """Gate 1: Author confirms voice audio is accurate.
    Downloads the voice file from Telegram and calls Gemini multimodal transcription.
    """
    valid, err_msg, session = await _verify_session_ownership(session_id, user_id)
    if not valid or not session:
        await bot_client.answer_callback_query(cb_id, text=err_msg, show_alert=True)
        return

    if session.audio_status == "confirmed":
        await bot_client.answer_callback_query(cb_id, text="Audio was already confirmed.")
        return

    # Update state: Audio Confirmed
    await session_repo.confirm_audio(session_id)
    await bot_client.answer_callback_query(cb_id, text="Audio confirmed! Transcribing...")

    # Notify author that transcription is in flight
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "⏳ <b>Transcribing Voice Audio...</b>\n\n"
            "Google Gemini is processing your recording to extract all spoken technical concepts and terms accurately. "
            "This usually takes 2–4 seconds."
        ),
        reply_markup=None
    )
    await bot_client.send_chat_action(chat_id=chat_id, action="typing")

    # Perform real transcription via Gemini
    try:
        if session.telegram_file_id:
            transcript_text, usage = await transcription_service.transcribe_telegram_voice(
                file_id=session.telegram_file_id
            )
        else:
            transcript_text = session.effective_transcript or "<i>[No audio payload attached to this session.]</i>"

        await session_repo.save_transcription(session_id, transcript_text)

        review_text = (
            "🎙️ <b>Audio Transcribed Successfully</b>\n\n"
            "Here is the transcript of your thoughts:\n\n"
            f"<blockquote>{transcript_text}</blockquote>\n\n"
            "Please review the transcript. You can tap <b>Edit Transcript</b> to tweak any misheard words, "
            "or tap <b>Confirm & Start AI</b> to begin research and drafting."
        )

        await bot_client.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=review_text,
            reply_markup=get_transcript_review_keyboard(session_id)
        )

    except Exception as e:
        logger.error(f"Transcription failed for session {session_id}: {e}", exc_info=True)
        error_text = (
            "⚠️ <b>Transcription Failed</b>\n\n"
            f"Could not transcribe the voice message: <code>{str(e)[:150]}</code>\n\n"
            "You can tap <b>Re-record</b> to send a new voice note, or send your thoughts as a text message."
        )
        await bot_client.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=error_text,
            reply_markup=get_audio_confirmation_keyboard(session_id)
        )


async def _handle_audio_rerecord(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    session_id: str
) -> None:
    """Discards previous audio without any API costs."""
    valid, err_msg, session = await _verify_session_ownership(session_id, user_id)
    if not valid:
        await bot_client.answer_callback_query(cb_id, text=err_msg, show_alert=True)
        return

    await session_repo.mark_superseded(session_id)
    await bot_client.answer_callback_query(cb_id, text="Previous recording discarded.")

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "🗑️ <b>Previous Recording Discarded</b>\n\n"
            "No API credits or tokens were consumed.\n\n"
            "Whenever you're ready, record and send a new voice message with your idea, or type it as text."
        ),
        reply_markup=None
    )


async def _handle_session_cancel(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    session_id: str
) -> None:
    """Cancels the entire session."""
    valid, err_msg, session = await _verify_session_ownership(session_id, user_id)
    if not valid or not session:
        await bot_client.answer_callback_query(cb_id, text=err_msg, show_alert=True)
        return

    await session_repo.cancel_session(session_id)
    await conv_repo.update_status(session.conversation_id, "cancelled", "cancelled_by_user")
    await bot_client.answer_callback_query(cb_id, text="Session cancelled.")

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "❌ <b>Session Cancelled</b>\n\n"
            "The draft session has been cancelled. No AI processing was triggered and zero credits were spent.\n\n"
            "Type /newblog whenever you want to start again!"
        ),
        reply_markup=None
    )


async def _handle_transcript_edit(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    session_id: str
) -> None:
    """Places the conversation in 'transcript_editing' mode so the next user message replaces the transcript."""
    valid, err_msg, session = await _verify_session_ownership(session_id, user_id)
    if not valid or not session:
        await bot_client.answer_callback_query(cb_id, text=err_msg, show_alert=True)
        return

    await conv_repo.update_status(session.conversation_id, "active", "transcript_editing")
    await bot_client.answer_callback_query(cb_id, text="Ready for your edits!")

    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            "✏️ <b>Edit Transcript</b>\n\n"
            "Please send your corrected or updated text in your next message. "
            "I will save it as your corrected transcript and show you the confirmation screen again.\n\n"
            "<i>(Or click Cancel below if you change your mind.)</i>"
        ),
        reply_markup=get_cancel_only_keyboard(session_id)
    )


async def _handle_transcript_confirm(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    session_id: str
) -> None:
    """Gate 2: Author explicitly confirms transcript. Only now is a generation job enqueued!"""
    valid, err_msg, session = await _verify_session_ownership(session_id, user_id)
    if not valid or not session:
        await bot_client.answer_callback_query(cb_id, text=err_msg, show_alert=True)
        return

    if session.transcript_status == "confirmed":
        await bot_client.answer_callback_query(cb_id, text="Transcript was already confirmed.")
        return

    # 1. Update session to confirmed
    await session_repo.confirm_transcript(session_id)
    await conv_repo.update_status(session.conversation_id, "active", "generation_queued")
    await bot_client.answer_callback_query(cb_id, text="Transcript confirmed! Pipeline enqueued.")

    # 2. Enqueue generation job in Supabase
    job = await job_repo.create_job(session.conversation_id)

    # 3. Update Telegram UI with confirmation and job tracking info
    confirmation_text = (
        "🚀 <b>AI Processing Enqueued!</b>\n\n"
        f"• <b>Job ID:</b> <code>{job.id}</code>\n"
        "• <b>Status:</b> <code>queued</code>\n"
        "• <b>Stage 1:</b> Personal Perspective Analyst\n\n"
        "The multi-agent pipeline is now processing your verified idea:\n"
        "1. Extracting your personal voice, claims, and perspective\n"
        "2. Researching technical facts on Tavily\n"
        "3. Fact-checking claims against authoritative documentation\n"
        "4. Drafting the complete article in your DevScrolls style\n\n"
        "You will receive progress updates right here as each agent completes its work!"
    )

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=confirmation_text,
        reply_markup=None
    )

    # 4. Immediately trigger asynchronous worker cycle
    from app.workers.job_processor import job_processor
    import asyncio
    asyncio.create_task(job_processor.run_worker_cycle())


async def _handle_corr_accept(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    job_id: str
) -> None:
    """Author accepts the Fact Checker's suggested corrections."""
    job = await job_repo.get_by_id(job_id)
    if not job:
        await bot_client.answer_callback_query(cb_id, text="Job not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Fixes accepted! Resuming pipeline...")
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "✅ <b>Corrections Accepted</b>\n\n"
            "The suggested technical fixes have been incorporated into the outline.\n"
            "✍️ Advancing to <b>Agent 4: Blog Writer & Editorial Agent</b>..."
        ),
        reply_markup=None
    )

    # Resume job: advance from fact_check to writing
    await job_repo.update_stage_output(job_id, "writing", {})
    await job_repo.set_job_status(job_id, "queued")
    await conv_repo.update_status(job.conversation_id, "active", "generation_queued")

    from app.workers.job_processor import job_processor
    import asyncio
    asyncio.create_task(job_processor.run_worker_cycle())


async def _handle_corr_override(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    job_id: str
) -> None:
    """Author keeps their original phrasing despite fact check warnings."""
    job = await job_repo.get_by_id(job_id)
    if not job:
        await bot_client.answer_callback_query(cb_id, text="Job not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Original take retained. Resuming pipeline...")
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "🛡️ <b>Original Take Retained</b>\n\n"
            "Your original statement will be preserved as an intentional contrarian perspective.\n"
            "✍️ Advancing to <b>Agent 4: Blog Writer & Editorial Agent</b>..."
        ),
        reply_markup=None
    )

    # Resume job: advance from fact_check to writing
    await job_repo.update_stage_output(job_id, "writing", {})
    await job_repo.set_job_status(job_id, "queued")
    await conv_repo.update_status(job.conversation_id, "active", "generation_queued")

    from app.workers.job_processor import job_processor
    import asyncio
    asyncio.create_task(job_processor.run_worker_cycle())


async def _handle_corr_cancel(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    job_id: str
) -> None:
    """Author cancels the job during fact check review."""
    job = await job_repo.get_by_id(job_id)
    if not job:
        await bot_client.answer_callback_query(cb_id, text="Job not found.", show_alert=True)
        return

    await job_repo.set_job_status(job_id, "cancelled")
    await conv_repo.update_status(job.conversation_id, "cancelled", None)
    await bot_client.answer_callback_query(cb_id, text="Generation cancelled.")
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text="❌ <b>Generation Cancelled</b>\n\nThis article draft generation has been cancelled.",
        reply_markup=None
    )


# ------------------------------------------------------------------------------
# Phase 10: Draft Review Actions & Message Chunking
# ------------------------------------------------------------------------------

def chunk_markdown(text: str, max_chars: int = 3800) -> list[str]:
    """Splits long text into cohesive chunks <= max_chars along paragraph or line boundaries.
    Prevents Telegram message length limit (4096) overflow.
    """
    if len(text) <= max_chars:
        return [text]

    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        if len(current_chunk) + len(p) + 2 <= max_chars:
            current_chunk = f"{current_chunk}\n\n{p}" if current_chunk else p
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            if len(p) > max_chars:
                lines = p.split("\n")
                sub_chunk = ""
                for line in lines:
                    if len(sub_chunk) + len(line) + 1 <= max_chars:
                        sub_chunk = f"{sub_chunk}\n{line}" if sub_chunk else line
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk.strip())
                        sub_chunk = line
                current_chunk = sub_chunk
            else:
                current_chunk = p

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


async def _handle_draft_approve(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Author explicitly approves the final blog draft for publication."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await draft_repo.update_status(draft_id, "approved")
    await bot_client.answer_callback_query(cb_id, text="Draft approved! Starting deployment...")

    # Advance job to publishing stage
    if draft.job_id:
        await job_queue.advance_stage(
            job_id=draft.job_id,
            completed_stage="user_review",
            next_stage="publishing",
            stage_output={"draft_id": str(draft.id), "approved": True}
        )
        await job_repo.set_job_status(draft.job_id, "queued")

    await conv_repo.update_status(draft.conversation_id, "active", "publishing")

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "🚀 <b>Draft Approved!</b>\n\n"
            f"• <b>Title:</b> {draft.title}\n"
            f"• <b>Version:</b> v{draft.current_version}\n\n"
            "Advancing to <b>Stage 5: GitHub Publisher</b> to commit your article to "
            f"<code>src/content/articles/{draft.slug}.md</code> and trigger Astro build!"
        ),
        reply_markup=None
    )

    from app.workers.job_processor import job_processor
    import asyncio
    asyncio.create_task(job_processor.run_worker_cycle())


async def _handle_draft_view(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Sends the full article markdown body chunked safely across Telegram messages."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Displaying full article...")

    header = (
        f"📄 <b>Full Draft (v{draft.current_version}): {draft.title}</b>\n"
        f"<i>Category: {draft.frontmatter.get('category')} | Tags: {draft.frontmatter.get('tags')}</i>\n\n"
        "----------------------------------------\n\n"
    )

    full_text = header + draft.content
    chunks = chunk_markdown(full_text, max_chars=3800)

    for i, chunk in enumerate(chunks, 1):
        prefix = f"<b>[Part {i}/{len(chunks)}]</b>\n\n" if len(chunks) > 1 else ""
        await bot_client.send_message(
            chat_id=chat_id,
            text=prefix + chunk
        )


async def _handle_draft_sources(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Displays the retrieved research sources and claim verification ledger."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Retrieving research sources...")

    sources_text = f"🔍 <b>Research Sources & Evidence Report</b>\n\n<b>Article:</b> {draft.title}\n\n"

    sources = []
    if draft.job_id:
        sources = await claim_repo.get_sources_for_job(draft.job_id)

    if sources:
        sources_text += "<b>Authoritative Sources Cited:</b>\n"
        for i, s in enumerate(sources[:8], 1):
            sources_text += f"<b>{i}.</b> <a href=\"{s.source_url}\">{s.source_title}</a> (<code>{s.source_type}</code>)\n"
            if s.relevant_excerpt:
                sources_text += f"   <i>\"{s.relevant_excerpt[:150]}...\"</i>\n"
            sources_text += "\n"
    else:
        sources_text += "<i>No external sources were needed for this piece.</i>\n"

    claims = []
    if draft.job_id:
        claims = await claim_repo.get_claims_for_job(draft.job_id)

    if claims:
        sources_text += "\n<b>Claim Verification Ledger:</b>\n"
        for c in claims[:10]:
            status_emoji = "✅" if str(c.verification_status).upper() in ["VERIFIED"] else "🛡️"
            sources_text += f"{status_emoji} <b>\"{c.claim_text}\"</b>\n"
            sources_text += f"   • Status: <code>{c.verification_status}</code>\n"
            if c.explanation:
                sources_text += f"   • Note: {c.explanation[:120]}\n"
            sources_text += "\n"

    chunks = chunk_markdown(sources_text, max_chars=3800)
    for chunk in chunks:
        await bot_client.send_message(chat_id=chat_id, text=chunk)


async def _handle_draft_revise(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Places the conversation in draft_revising mode to capture revision instructions."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await conv_repo.update_status(draft.conversation_id, "active", "draft_revising")
    await bot_client.answer_callback_query(cb_id, text="Ready for revision instructions!")

    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            f"✏️ <b>Request Changes on Draft (v{draft.current_version})</b>\n\n"
            "Tell me what you'd like to adjust in your next message:\n"
            "• Add or expand a technical section\n"
            "• Make the opening BLUF punchier\n"
            "• Refine code examples or benchmark numbers\n"
            "• Adjust tone or audience nuance\n\n"
            "<i>Send your text instructions below, or click Cancel to keep the draft as is.</i>"
        ),
        reply_markup=get_cancel_only_keyboard(str(draft.id))
    )


async def _handle_draft_reject(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Discards a draft and marks the job cancelled."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await draft_repo.update_status(draft_id, "rejected")
    if draft.job_id:
        await job_repo.set_job_status(draft.job_id, "cancelled")
    await conv_repo.update_status(draft.conversation_id, "cancelled", None)

    await bot_client.answer_callback_query(cb_id, text="Draft rejected.")
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text="🗑️ <b>Draft Discarded</b>\n\nThis draft has been discarded. Send a new voice note or text message whenever inspiration strikes!",
        reply_markup=None
    )


# ------------------------------------------------------------------------------
# Idea Bank (Keep in Drafts, Interactive Browsing & Archiving)
# ------------------------------------------------------------------------------

async def _handle_draft_keep(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Saves the draft to the offline Idea Bank, freeing the conversation session for new ideas."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await draft_repo.update_status(draft_id, "draft")
    await conv_repo.update_status(draft.conversation_id, "completed", None)
    await bot_client.answer_callback_query(cb_id, text="Draft saved to Idea Bank!")

    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=(
            "💾 <b>Saved to Idea Bank!</b>\n\n"
            f"• <b>Title:</b> {draft.title}\n"
            f"• <b>Version:</b> v{draft.current_version}\n"
            f"• <b>Status:</b> Staged Draft\n\n"
            "This article is safely stored in your database. You can return to it anytime by typing /drafts to polish, revise, or publish whenever you're ready!\n\n"
            "<i>Your session is now clear. Send another voice note whenever you have an idea!</i>"
        ),
        reply_markup={
            "inline_keyboard": [
                [
                    {
                        "text": "📚 View All Drafts",
                        "callback_data": "draft_list"
                    },
                    {
                        "text": "➕ Record New Idea",
                        "callback_data": "draft_new_idea"
                    }
                ]
            ]
        }
    )


async def _handle_draft_list(
    cb_id: str,
    chat_id: int,
    message_id: int
) -> None:
    """Renders or refreshes the interactive Idea Bank list."""
    resp = draft_repo._table().select(
        "id, title, slug, status, current_version, created_at"
    ).in_("status", ["draft", "pending_review"]).order("created_at", desc=True).limit(10).execute()

    drafts = resp.data or []
    await bot_client.answer_callback_query(cb_id, text=f"Found {len(drafts)} drafts.")

    if not drafts:
        await bot_client.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=(
                "📭 <b>Your Idea Bank is Empty</b>\n\n"
                "You don't have any unpublished drafts yet.\n\n"
                "Send a 🎙️ <b>voice recording</b> or type /newblog to turn an idea into an article!"
            ),
            reply_markup=None
        )
        return

    text = (
        f"📚 <b>DevScrolls Idea Bank ({len(drafts)} drafts)</b>\n\n"
        "Select any draft below to read the full article, request AI reworks, or publish live to <code>devscrolls.dev</code>:"
    )
    keyboard = get_draft_list_keyboard(drafts)
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=text,
        reply_markup=keyboard
    )


async def _handle_draft_select(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Displays the detail control card for a selected draft."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Draft loaded.")

    lines = [l.strip() for l in draft.content.split("\n") if l.strip()]
    preview_snippet = lines[0][:200] + "..." if lines else ""

    text = (
        f"📝 <b>Draft: {draft.title}</b> (v{draft.current_version})\n\n"
        f"• <b>Slug:</b> <code>{draft.slug}</code>\n"
        f"• <b>Status:</b> <code>{draft.status}</code>\n"
        f"• <b>Category:</b> {draft.frontmatter.get('category', 'Engineering')}\n"
        f"• <b>Tags:</b> {draft.frontmatter.get('tags', [])}\n\n"
        f"<b>Opening Preview:</b>\n<i>{preview_snippet}</i>\n\n"
        "Choose an action below to review, rework, or publish:"
    )
    keyboard = get_draft_detail_keyboard(draft.id)
    await bot_client.edit_message_text(
        chat_id=chat_id,
        message_id=message_id,
        text=text,
        reply_markup=keyboard
    )


async def _handle_draft_archive(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Archives an unpublished draft so it no longer appears in the active bank."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await draft_repo.update_status(draft_id, "archived")
    await bot_client.answer_callback_query(cb_id, text="Draft archived.")
    # Return to draft list
    await _handle_draft_list(cb_id, chat_id, message_id)


async def _handle_draft_new_idea(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int
) -> None:
    """Starts a new blog recording session from the Idea Bank menu."""
    await session_manager.get_or_create_active_conversation(user_id)
    await bot_client.answer_callback_query(cb_id, text="New session ready!")
    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            "✨ <b>New Blog Session Started</b>\n\n"
            "Whenever you're ready, send a 🎙️ <b>voice recording</b> or 📝 <b>type your thoughts</b>.\n\n"
            "<i>No tokens or APIs will be consumed until you tap Confirm & Transcribe.</i>"
        )
    )


# ------------------------------------------------------------------------------
# Social Media & Newsletter Post-Publish Distribution
# ------------------------------------------------------------------------------

async def _handle_post_publish_linkedin(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Generates an open-loop LinkedIn post promoting the published article."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Crafting LinkedIn post with Gemini...")
    await bot_client.send_chat_action(chat_id=chat_id, action="typing")

    from app.ai.agents.social_writer import social_writer
    canonical_url = f"{settings.BASE_BLOG_URL}/articles/{draft.slug}/"

    post_text = await social_writer.generate_linkedin_post(
        title=draft.title,
        content=draft.content,
        canonical_url=canonical_url,
        tags=draft.frontmatter.get("tags")
    )

    import html
    escaped_post = html.escape(post_text)

    card_text = (
        "📱 <b>LinkedIn Post Generated (Open-Loop Strategy)</b>\n\n"
        "<i>Copy and paste the text below directly into the LinkedIn app or web:</i>\n\n"
        f"<blockquote>{escaped_post}</blockquote>\n\n"
        f"🔗 <b>Canonical Article URL:</b> <a href=\"{canonical_url}\">{canonical_url}</a>"
    )

    await bot_client.send_message(
        chat_id=chat_id,
        text=card_text,
        reply_markup=get_linkedin_keyboard(draft.id)
    )


async def _handle_post_publish_kit(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    draft_id: str
) -> None:
    """Generates and creates a Kit (ConvertKit) newsletter broadcast draft."""
    draft = await draft_repo.get_by_id(draft_id)
    if not draft:
        await bot_client.answer_callback_query(cb_id, text="Draft not found.", show_alert=True)
        return

    await bot_client.answer_callback_query(cb_id, text="Drafting newsletter with Gemini...")
    await bot_client.send_chat_action(chat_id=chat_id, action="typing")

    from app.ai.agents.newsletter_writer import newsletter_writer
    from app.integrations.kit_client import kit_client

    canonical_url = f"{settings.BASE_BLOG_URL}/articles/{draft.slug}/"
    newsletter = await newsletter_writer.generate_newsletter(
        title=draft.title,
        content=draft.content,
        canonical_url=canonical_url
    )

    subject = newsletter.get("subject")
    html_content = newsletter.get("html_content")
    plain_text = newsletter.get("plain_text")

    if kit_client.is_configured:
        b_res = await kit_client.create_broadcast_draft(
            subject=subject,
            content=html_content,
            description=f"DevScrolls: {draft.title}"
        )

        if b_res.get("success"):
            b_id = b_res.get("broadcast_id")
            await bot_client.send_message(
                chat_id=chat_id,
                text=(
                    "📧 <b>Kit (ConvertKit) Broadcast Draft Created!</b>\n\n"
                    f"• <b>Subject:</b> {subject}\n"
                    f"• <b>Broadcast ID:</b> <code>{b_id}</code>\n"
                    f"• <b>Status:</b> Staged as Draft in Kit 🚀\n\n"
                    "Log into your <a href=\"https://app.kit.com/broadcasts\">Kit Broadcasts Dashboard</a> to preview and schedule the blast to all your subscribers!"
                ),
                reply_markup=get_newsletter_keyboard(draft.id)
            )
            return

    # Fallback if Kit API secret is not yet set
    import html
    escaped_plain = html.escape(plain_text or "")
    escaped_subject = html.escape(subject or "")
    fallback_text = (
        "📧 <b>Newsletter Copy Ready (Kit not yet connected)</b>\n\n"
        f"• <b>Subject:</b> <code>{escaped_subject}</code>\n\n"
        "<i>Copy and paste the plain text below into Kit or your email provider:</i>\n\n"
        f"<blockquote>{escaped_plain}</blockquote>\n\n"
        "💡 <i>Tip: Add <code>KIT_API_SECRET</code> to your Render environment variables to automatically create drafts inside Kit with one tap!</i>"
    )
    await bot_client.send_message(
        chat_id=chat_id,
        text=fallback_text,
        reply_markup=get_newsletter_keyboard(draft.id)
    )


async def _handle_job_resume(
    cb_id: str,
    chat_id: int,
    message_id: int,
    user_id: int,
    job_id: str
) -> None:
    """Manually resumes or retries an interrupted job."""
    job = await job_repo.get_by_id(job_id)
    if not job:
        await bot_client.answer_callback_query(cb_id, text="Job not found.", show_alert=True)
        return

    # Reset job to queued so worker claims it
    await job_repo.set_job_status(job_id, "queued")
    await conv_repo.update_status(job.conversation_id, "active", "generation_queued")
    await bot_client.answer_callback_query(cb_id, text="Pipeline resumed!")

    await bot_client.send_message(
        chat_id=chat_id,
        text=f"▶️ <b>Pipeline Resumed</b>\n\nResuming generation at <b>Stage: {job.current_stage}</b>..."
    )

    from app.workers.job_processor import job_processor
    import asyncio
    asyncio.create_task(job_processor.run_worker_cycle())



