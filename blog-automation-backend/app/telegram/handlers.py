"""Telegram message handlers for commands, voice notes, and text inputs.
Strictly implements the Two-Stage Confirmation workflow:
  - Voice notes require explicit Audio Confirmation before any transcription or AI spend.
  - Text notes or transcribed audio require explicit Transcript Confirmation before agent pipeline enqueueing.
"""
import logging
from typing import Any, Dict
from app.storage.repositories import (
    ConversationRepository,
    DraftRepository,
    InputSessionRepository,
    JobRepository,
    UserRepository,
)
from app.telegram.bot_client import bot_client
from app.telegram.keyboards import (
    get_audio_confirmation_keyboard,
    get_draft_review_keyboard,
    get_draft_list_keyboard,
    get_transcript_review_keyboard,
)
from app.telegram.session_manager import session_manager
from app.integrations.kit_client import kit_client

logger = logging.getLogger(__name__)

user_repo = UserRepository()
conv_repo = ConversationRepository()
session_repo = InputSessionRepository()
job_repo = JobRepository()
draft_repo = DraftRepository()

async def handle_message(message: Dict[str, Any]) -> None:
    """Main router for incoming Telegram messages."""
    chat_id = message["chat"]["id"]
    from_user = message.get("from", {})
    user_id = from_user.get("id")
    username = from_user.get("username")
    display_name = f"{from_user.get('first_name', '')} {from_user.get('last_name', '')}".strip()

    # 1. Authorize User
    is_auth, _ = await session_manager.authenticate_user(
        telegram_user_id=user_id,
        username=username,
        display_name=display_name
    )

    if not is_auth:
        logger.warning(f"Unauthorized message from user {user_id} (@{username})")
        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                "⛔ <b>Access Restricted</b>\n\n"
                f"Your Telegram User ID (<code>{user_id}</code>) is not on the authorized allowlist for this personal blog engine.\n\n"
                "Please add your ID to <code>AUTHORIZED_TELEGRAM_USER_IDS</code> in the backend <code>.env</code> file to enable access."
            )
        )
        return

    text = message.get("text", "").strip()
    voice = message.get("voice") or message.get("audio")

    # 2. Command Dispatcher
    if text.startswith("/"):
        command = text.split()[0].lower()
        if command == "/start":
            await _handle_cmd_start(chat_id, display_name)
        elif command == "/help":
            await _handle_cmd_help(chat_id)
        elif command == "/newblog":
            await _handle_cmd_newblog(chat_id, user_id)
        elif command == "/status":
            await _handle_cmd_status(chat_id, user_id)
        elif command == "/cancel":
            await _handle_cmd_cancel(chat_id, user_id)
        elif command == "/drafts":
            await _handle_cmd_drafts(chat_id)
        elif command == "/subscribers":
            await _handle_cmd_subscribers(chat_id)
        else:
            await bot_client.send_message(
                chat_id=chat_id,
                text="Unknown command. Type /help to see available options."
            )
        return

    # 3. Voice Input Handler (Gate 1 Entry)
    if voice:
        await _handle_voice_input(chat_id, user_id, message, voice)
        return

    # 4. Text Input Handler (Either transcript edits or direct text idea)
    if text:
        await _handle_text_input(chat_id, user_id, text)
        return

    # Unsupported format
    await bot_client.send_message(
        chat_id=chat_id,
        text="Please send your idea as a 🎙️ <b>voice recording</b> or 📝 <b>text message</b>."
    )

# ------------------------------------------------------------------------------
# Command Implementations
# ------------------------------------------------------------------------------

async def _handle_cmd_start(chat_id: int, display_name: str) -> None:
    welcome_text = (
        f"👋 <b>Welcome, {display_name or 'Author'}!</b>\n\n"
        "This is your <b>DevScrolls AI Knowledge-to-Blog Publishing Assistant</b>.\n\n"
        "<b>How it works:</b>\n"
        "1. 🎙️ <b>Record your thoughts:</b> Send a voice note with observations, interview experiences, or technical opinions.\n"
        "2. 🛡️ <b>Two-Stage Confirmation:</b>\n"
        "   • <i>Gate 1:</i> Confirm your audio before transcription starts.\n"
        "   • <i>Gate 2:</i> Review & edit the transcript before AI agents begin.\n"
        "3. 🤖 <b>4-Agent Pipeline:</b> Perspective Analyst → Research (Tavily) → Fact Checker → Blog Writer.\n"
        "4. 🚢 <b>One-Click Publish:</b> Review the draft and approve publishing directly to DevScrolls.\n\n"
        "Send a voice recording now or type /newblog to get started!"
    )
    await bot_client.send_message(chat_id=chat_id, text=welcome_text)


async def _handle_cmd_help(chat_id: int) -> None:
    help_text = (
        "📖 <b>DevScrolls Bot Commands</b>\n\n"
        "• /newblog — Start a fresh blog idea session\n"
        "• /status — Check the state of your active idea or background job\n"
        "• /cancel — Cancel the active session (prevents any AI spend)\n"
        "• /drafts — Open your interactive Idea Bank (view, polish, or publish drafts)\n"
        "• /subscribers — Check your live Kit (ConvertKit) newsletter subscribers\n"
        "• /help — Show this help message\n\n"
        "<b>Tips for Voice Recordings:</b>\n"
        "• Speak naturally — share your personal perspective and pain points.\n"
        "• Include technical keywords and context (e.g. React 19, Astro, Redux re-renders).\n"
        "• Don't worry about verbal slips: Gate 1 and Gate 2 allow easy re-recording or manual text editing!\n"
        "• Save drafts to your offline Idea Bank anytime and publish when ready."
    )
    await bot_client.send_message(chat_id=chat_id, text=help_text)


async def _handle_cmd_newblog(chat_id: int, user_id: int) -> None:
    conv = await session_manager.get_or_create_active_conversation(user_id)
    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            "✨ <b>New Blog Session Started</b>\n\n"
            "Whenever you're ready, send a 🎙️ <b>voice recording</b> or 📝 <b>type your thoughts</b>.\n\n"
            "<i>Reminder: No AI tokens or external APIs will be consumed until you manually confirm the audio and transcript.</i>"
        )
    )


async def _handle_cmd_status(chat_id: int, user_id: int) -> None:
    conv = await conv_repo.get_active_conversation(user_id)
    if not conv:
        await bot_client.send_message(
            chat_id=chat_id,
            text="No active blog session found. Send a voice recording or type /newblog to start!"
        )
        return

    active_job = await job_repo.get_active_job_for_conversation(conv.id)
    latest_session = await session_repo.get_latest_session(conv.id)

    status_text = (
        "📊 <b>Active Session Status</b>\n\n"
        f"• <b>Conversation ID:</b> <code>{conv.id}</code>\n"
        f"• <b>Session Stage:</b> <code>{conv.current_stage}</code>\n"
    )

    if latest_session:
        status_text += (
            f"• <b>Input Type:</b> <code>{latest_session.input_type}</code>\n"
            f"• <b>Audio Status:</b> <code>{latest_session.audio_status}</code>\n"
            f"• <b>Transcript Status:</b> <code>{latest_session.transcript_status}</code>\n"
        )

    if active_job:
        status_text += (
            f"\n🤖 <b>Active Generation Job:</b>\n"
            f"• <b>Job ID:</b> <code>{active_job.id}</code>\n"
            f"• <b>Job Status:</b> <code>{active_job.status}</code>\n"
            f"• <b>Agent Stage:</b> <code>{active_job.current_stage}</code>\n"
        )

    await bot_client.send_message(chat_id=chat_id, text=status_text)


async def _handle_cmd_cancel(chat_id: int, user_id: int) -> None:
    cancelled = await session_manager.cancel_active_conversation(user_id)
    if cancelled:
        await bot_client.send_message(
            chat_id=chat_id,
            text="🛑 <b>Active session cancelled.</b> No AI processing was triggered."
        )
    else:
        await bot_client.send_message(
            chat_id=chat_id,
            text="No active session to cancel."
        )


async def _handle_cmd_drafts(chat_id: int) -> None:
    """Displays the interactive Idea Bank containing all unpublished drafts."""
    # Query unpublished drafts in Supabase (status: 'draft' or 'pending_review')
    resp = draft_repo._table().select(
        "id, title, slug, status, current_version, created_at"
    ).in_("status", ["draft", "pending_review"]).order("created_at", desc=True).limit(10).execute()

    drafts = resp.data or []
    if not drafts:
        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                "📭 <b>Your Idea Bank is Empty</b>\n\n"
                "You don't have any unpublished drafts yet.\n\n"
                "Send a 🎙️ <b>voice recording</b> or type /newblog to turn an idea into an article!"
            )
        )
        return

    text = (
        f"📚 <b>DevScrolls Idea Bank ({len(drafts)} drafts)</b>\n\n"
        "Select any draft below to read the full article, request AI reworks, or publish live to <code>devscrolls.dev</code>:"
    )
    keyboard = get_draft_list_keyboard(drafts)
    await bot_client.send_message(chat_id=chat_id, text=text, reply_markup=keyboard)


async def _handle_cmd_subscribers(chat_id: int) -> None:
    """Checks live newsletter subscriber stats from Kit (ConvertKit)."""
    if not kit_client.is_configured:
        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                "📧 <b>Kit (ConvertKit) Integration</b>\n\n"
                "Your Kit API credentials are not yet configured in Render.\n\n"
                "To connect your account and enable live subscriber stats & newsletter broadcasting:\n"
                "1. Open <a href=\"https://app.kit.com/account_settings/developer\">Kit Developer Settings</a>\n"
                "2. Copy your <b>API Secret</b>\n"
                "3. Add <code>KIT_API_SECRET</code> to your Render environment variables."
            )
        )
        return

    await bot_client.send_chat_action(chat_id=chat_id, action="typing")
    stats = await kit_client.get_subscriber_count()

    if stats.get("error"):
        await bot_client.send_message(
            chat_id=chat_id,
            text=f"⚠️ <b>Kit Connection Issue</b>\n\n<code>{stats['error']}</code>"
        )
        return

    total = stats.get("total_subscribers", 0)
    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            "📊 <b>Kit Newsletter Subscribers</b>\n\n"
            f"• <b>Total Confirmed Subscribers:</b> <code>{total:,}</code>\n"
            "• <b>Status:</b> Connected & Ready for Broadcasts 🚀\n\n"
            "<i>Whenever you publish a new blog post, use [📧 Create Kit Newsletter Broadcast] to announce it to your readers.</i>"
        )
    )

# ------------------------------------------------------------------------------
# Input Processing (Gate 1 & Gate 2)
# ------------------------------------------------------------------------------

async def _handle_voice_input(
    chat_id: int,
    user_id: int,
    message: Dict[str, Any],
    voice_obj: Dict[str, Any]
) -> None:
    """Gate 1: Voice message received.
    Records metadata and strictly awaits explicit author confirmation before any AI processing.
    """
    file_id = voice_obj.get("file_id")
    duration = voice_obj.get("duration", 0)
    message_id = message["message_id"]

    conv = await session_manager.get_or_create_active_conversation(user_id)

    # Create input session with pending audio status
    input_session = await session_repo.create_session(
        conversation_id=conv.id,
        input_type="voice",
        telegram_file_id=file_id,
        telegram_message_id=message_id
    )

    await session_manager.set_conversation_stage(conv.id, "audio_confirmation_pending")

    gate_1_message = (
        "🎙️ <b>Voice Recording Received</b> (Duration: {duration}s)\n\n"
        "Before transcribing, please listen to the voice message above and confirm that "
        "it contains all the thoughts and nuances you want included.\n\n"
        "<b>No AI tokens or transcription credits have been spent yet.</b>"
    ).format(duration=duration)

    await bot_client.send_message(
        chat_id=chat_id,
        text=gate_1_message,
        reply_markup=get_audio_confirmation_keyboard(input_session.id)
    )
    logger.info(f"Gate 1 presented for session {input_session.id} (user {user_id})")


async def _handle_text_input(chat_id: int, user_id: int, text: str) -> None:
    """Handles text input: either transcript corrections or a fresh direct text blog idea."""
    conv = await session_manager.get_or_create_active_conversation(user_id)
    latest_session = await session_repo.get_latest_session(conv.id)

    # Case A: User is submitting corrections to a transcript
    if conv.current_stage == "transcript_editing" and latest_session:
        # Save edited text and return to Gate 2 review
        await session_repo.confirm_transcript(latest_session.id, corrected_text=text)
        await session_manager.set_conversation_stage(conv.id, "transcript_review_pending")

        review_text = (
            "✏️ <b>Transcript Updated!</b>\n\n"
            "Here is your corrected transcript:\n\n"
            f"<blockquote>{text}</blockquote>\n\n"
            "Please review and confirm to begin AI processing, or edit again if needed."
        )

        await bot_client.send_message(
            chat_id=chat_id,
            text=review_text,
            reply_markup=get_transcript_review_keyboard(latest_session.id)
        )
        return

    # Case B: User is answering a Clarification Question
    if conv.current_stage == "awaiting_clarification" and latest_session:
        enriched_transcript = f"{latest_session.effective_transcript}\n\n[Author Clarification]: {text}"
        await session_repo.confirm_transcript(latest_session.id, corrected_text=enriched_transcript)
        await session_manager.set_conversation_stage(conv.id, "processing")

        # Find and re-queue the active job
        active_job = await job_repo.get_active_job_for_conversation(conv.id)
        if active_job:
            await job_repo.set_job_status(active_job.id, "queued")

        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                "💬 <b>Clarification Received!</b>\n\n"
                "Incorporating your answers and resuming the AI research & writing pipeline now..."
            )
        )

        # Trigger background processing
        from app.workers.job_processor import job_processor
        import asyncio
        asyncio.create_task(job_processor.run_worker_cycle())
        return

    # Case C: User is submitting revision instructions for an active draft
    if conv.current_stage == "draft_revising":
        draft = await draft_repo.get_latest_draft_for_conversation(conv.id)
        if not draft:
            await bot_client.send_message(
                chat_id=chat_id,
                text="Could not find an active draft to revise. Type /drafts to see your drafts."
            )
            return

        next_ver = draft.current_version + 1
        await bot_client.send_message(
            chat_id=chat_id,
            text=f"✍️ <b>Applying Revisions (v{next_ver})...</b>\n\n<i>\"{text}\"</i>\n\nRevising your draft with your feedback..."
        )

        try:
            from app.ai.agents.blog_writer import blog_writer
            revised_output, usage = await blog_writer.revise_draft(
                current_content=draft.content,
                current_frontmatter=draft.frontmatter,
                revision_instructions=text,
                job_id=draft.job_id
            )

            updated_draft = await draft_repo.create_revision(
                draft_id=draft.id,
                new_content=revised_output.markdown_content,
                new_frontmatter=revised_output.frontmatter.model_dump(),
                revision_reason=text
            )

            await conv_repo.update_status(conv.id, "active", "awaiting_draft_approval")

            lines = [l.strip() for l in revised_output.markdown_content.split("\n") if l.strip()]
            preview_bluf = lines[0][:250] + ("..." if len(lines[0]) > 250 else "") if lines else ""

            keyboard = get_draft_review_keyboard(updated_draft.id)
            await bot_client.send_message(
                chat_id=chat_id,
                text=(
                    f"🎉 <b>Revision v{updated_draft.current_version} Ready!</b>\n\n"
                    f"• <b>Title:</b> {revised_output.title}\n"
                    f"• <b>Length:</b> {revised_output.word_count} words ({revised_output.reading_time})\n\n"
                    f"<b>Updated BLUF Preview:</b>\n<i>{preview_bluf}</i>\n\n"
                    "Tap below to review the revised article or publish to GitHub!"
                ),
                reply_markup=keyboard
            )
        except Exception as e:
            logger.error(f"Error revising draft {draft.id}: {e}", exc_info=True)
            await bot_client.send_message(
                chat_id=chat_id,
                text=f"❌ <b>Revision Error</b>: {str(e)[:150]}\n\nPlease try again or tap Cancel."
            )
        return

    # Case D: User is sending a fresh idea directly as text
    input_session = await session_repo.create_session(
        conversation_id=conv.id,
        input_type="text",
        initial_text=text
    )

    await session_manager.set_conversation_stage(conv.id, "transcript_review_pending")

    gate_2_text = (
        "📝 <b>Text Idea Received</b>\n\n"
        f"<blockquote>{text}</blockquote>\n\n"
        "<b>No AI processing has started yet.</b>\n"
        "Please confirm that this captures your idea. When you tap <b>Confirm & Start AI</b>, "
        "the 4-agent research and drafting pipeline will begin."
    )

    await bot_client.send_message(
        chat_id=chat_id,
        text=gate_2_text,
        reply_markup=get_transcript_review_keyboard(input_session.id)
    )
    logger.info(f"Gate 2 presented directly for text session {input_session.id} (user {user_id})")

