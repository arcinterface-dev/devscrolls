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
from app.telegram.handlers_dev import handle_cmd_new, handle_dev_text_input

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
        elif command == "/new":
            await handle_cmd_new(chat_id, user_id, text)
        elif command == "/newblog":
            await _handle_cmd_newblog(chat_id, user_id)
        elif command == "/remember":
            await _handle_cmd_remember(chat_id, user_id, text)
        elif command == "/memories":
            await _handle_cmd_memories(chat_id)
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
        "• /new &lt;task&gt; — Ask ScrollBot AI Dev Agent to make code or design changes\n"
        "• /newblog — Start a fresh blog drafting session\n"
        "• /remember &lt;fact&gt; — Save a permanent architectural rule or preference\n"
        "• /memories — View what ScrollBot remembers about you & your blog\n"
        "• /status — Check active jobs and background state\n"
        "• /drafts — Open your interactive Idea Bank\n"
        "• /subscribers — Check live newsletter subscribers\n"
        "• /cancel — Cancel the active task or session\n"
        "• /help — Show this help message\n\n"
        "💬 <b>Jarvis Assistant:</b> Just send any message or voice note without a command to chat with your living blog assistant!"
    )
    await bot_client.send_message(chat_id=chat_id, text=help_text)


async def _handle_cmd_newblog(chat_id: int, user_id: int) -> None:
    conv = await session_manager.get_or_create_active_conversation(user_id)
    await session_manager.set_conversation_stage(conv.id, "blog_input_pending")
    await bot_client.send_message(
        chat_id=chat_id,
        text=(
            "✨ <b>New Blog Session Started</b>\n\n"
            "Whenever you're ready, send a 🎙️ <b>voice recording</b> or 📝 <b>type your thoughts</b>.\n\n"
            "<i>Reminder: No AI tokens or external APIs will be consumed until you manually confirm the audio and transcript.</i>"
        )
    )


async def _handle_cmd_remember(chat_id: int, user_id: int, text: str) -> None:
    """Explicitly saves a permanent rule or preference to the private Supabase ledger."""
    fact_text = text.replace("/remember", "", 1).strip()
    if not fact_text:
        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                "💡 <b>How to use /remember:</b>\n\n"
                "Type <code>/remember [your rule or preference]</code>\n\n"
                "<b>Examples:</b>\n"
                "• <code>/remember All arcade games must stay under 50KB bundle size.</code>\n"
                "• <code>/remember I prefer Tailwind inline utilities over separate CSS modules.</code>\n"
                "• <code>/remember We will never put paywalls on developer tools.</code>"
            )
        )
        return

    from app.ai.agents.jarvis_agent import jarvis_agent
    try:
        topic = "Author Preference"
        if ":" in fact_text:
            parts = fact_text.split(":", 1)
            topic, fact_text = parts[0].strip(), parts[1].strip()

        await jarvis_agent.save_memory(topic=topic, fact=fact_text, knowledge_type="opinion")
        await bot_client.send_message(
            chat_id=chat_id,
            text=(
                f"🧠 <b>Remembered, Sandy!</b>\n\n"
                f"Saved to your private Supabase memory ledger:\n"
                f"• <b>Topic:</b> <code>{topic}</code>\n"
                f"• <b>Rule:</b> <i>\"{fact_text}\"</i>\n\n"
                "<i>This memory is completely private to you and will automatically inform all future conversations and planning.</i>"
            )
        )
    except Exception as e:
        logger.error(f"Error saving memory: {e}")
        await bot_client.send_message(chat_id=chat_id, text=f"❌ Could not save memory: {e}")


async def _handle_cmd_memories(chat_id: int) -> None:
    """Lists recent memories stored in the private Supabase database."""
    from app.ai.agents.jarvis_agent import jarvis_agent
    try:
        memories = await jarvis_agent.list_memories(limit=25)
        if not memories:
            await bot_client.send_message(
                chat_id=chat_id,
                text=(
                    "🧠 <b>Your Private Memory Ledger is Clean</b>\n\n"
                    "You haven't taught ScrollBot any permanent rules yet.\n\n"
                    "Use <code>/remember &lt;fact&gt;</code> anytime to store preferences or architectural rules!"
                )
            )
            return

        lines = [f"🧠 <b>ScrollBot Private Memory Ledger ({len(memories)} entries)</b>\n"]
        for idx, m in enumerate(memories, 1):
            content = m.corrected_content or m.original_content
            k_type = (m.knowledge_type or "rule").upper()
            lines.append(f"{idx}. <b>[{k_type}]</b> <code>{m.topic}</code>:\n   <i>\"{content}\"</i>\n")

        lines.append("<i>Use /remember &lt;rule&gt; to teach me more. Stored 100% privately in Supabase.</i>")
        await bot_client.send_message(chat_id=chat_id, text="\n".join(lines))
    except Exception as e:
        logger.error(f"Error listing memories: {e}")
        await bot_client.send_message(chat_id=chat_id, text=f"❌ Could not retrieve memories: {e}")


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

    stage_names = {
        "perspective_analysis": "Agent 1: Perspective Analysis",
        "research": "Agent 2: Technical Research (Tavily)",
        "fact_check": "Agent 3: Fact Verification Ledger",
        "writing": "Agent 4: Blog Writer & Editorial",
        "editorial_review": "Agent 4: Editorial Quality Pass",
        "user_review": "Awaiting Author Review",
        "publishing": "Publishing to GitHub / DevScrolls",
    }

    status_text = (
        "📊 <b>Active Session Status</b>\n\n"
        f"• <b>Conversation:</b> <code>{conv.id}</code>\n"
        f"• <b>Session Stage:</b> <code>{conv.current_stage}</code>\n"
    )

    if latest_session:
        status_text += (
            f"• <b>Input Mode:</b> <code>{latest_session.input_type}</code>\n"
            f"• <b>Audio Confirmed:</b> <code>{latest_session.audio_status}</code>\n"
            f"• <b>Transcript Confirmed:</b> <code>{latest_session.transcript_status}</code>\n"
        )

    reply_markup = None
    if active_job:
        friendly_stage = stage_names.get(active_job.current_stage, active_job.current_stage)
        status_emoji = "🟢" if active_job.status == "processing" else ("🟡" if active_job.status == "queued" else "🔴")
        status_text += (
            f"\n🤖 <b>Multi-Agent Generation Pipeline:</b>\n"
            f"• <b>Job ID:</b> <code>{active_job.id}</code>\n"
            f"• <b>Status:</b> {status_emoji} <code>{active_job.status}</code>\n"
            f"• <b>Current Stage:</b> <b>{friendly_stage}</b>\n"
        )
        if active_job.error_message:
            status_text += f"• <b>Last Issue:</b> <code>{active_job.error_message}</code>\n"

        if active_job.status in ["processing", "queued", "failed"]:
            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "▶️ Resume / Run Next Stage",
                            "callback_data": f"job_resume:{active_job.id}"
                        },
                        {
                            "text": "🛑 Cancel Job",
                            "callback_data": f"job_cancel:{active_job.id}"
                        }
                    ]
                ]
            }

    await bot_client.send_message(chat_id=chat_id, text=status_text, reply_markup=reply_markup)


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
    """Handles incoming voice recordings.
    - If user explicitly started a blog session via /newblog, triggers Gate 1 confirmation.
    - Otherwise, transcribes audio and directly converses with Jarvis assistant.
    """
    file_id = voice_obj.get("file_id")
    duration = voice_obj.get("duration", 0)
    message_id = message["message_id"]

    conv = await session_manager.get_or_create_active_conversation(user_id)

    # 1. Blog drafting session (/newblog) -> Gate 1 Confirmation
    if conv.current_stage == "blog_input_pending":
        input_session = await session_repo.create_session(
            conversation_id=conv.id,
            input_type="voice",
            telegram_file_id=file_id,
            telegram_message_id=message_id
        )
        await session_manager.set_conversation_stage(conv.id, "audio_confirmation_pending")
        gate_1_message = (
            f"🎙️ <b>Blog Voice Recording Received</b> (Duration: {duration}s)\n\n"
            "Before transcribing, please listen to the voice message above and confirm that "
            "it contains all the thoughts and nuances you want included in your new article.\n\n"
            "<b>No AI tokens or transcription credits have been spent yet.</b>"
        )
        await bot_client.send_message(
            chat_id=chat_id,
            text=gate_1_message,
            reply_markup=get_audio_confirmation_keyboard(input_session.id)
        )
        logger.info(f"Gate 1 presented for blog session {input_session.id} (user {user_id})")
        return

    # 2. Default: Conversational Voice Chat with Jarvis Assistant
    await bot_client.send_chat_action(chat_id=chat_id, action="typing")
    try:
        from app.ai.transcription import transcription_service
        from app.ai.agents.jarvis_agent import jarvis_agent

        transcript_text, _ = await transcription_service.transcribe_telegram_voice(file_id=file_id)
        transcript_text = (transcript_text or "").strip()
        if not transcript_text:
            await bot_client.send_message(
                chat_id=chat_id,
                text="🎙️ <i>I couldn't hear any clear speech in that audio, Sandy. Could you try sending that again?</i>"
            )
            return

        # Generate Jarvis response
        reply = await jarvis_agent.chat(user_id=user_id, message_text=transcript_text)
        
        # Send formatted reply with spoken transcript context
        formatted_response = f"🎙️ <i>\"{transcript_text}\"</i>\n\n{reply}"
        await bot_client.send_message(chat_id=chat_id, text=formatted_response)
    except Exception as e:
        logger.error(f"Error handling voice chat with Jarvis: {e}", exc_info=True)
        await bot_client.send_message(
            chat_id=chat_id,
            text=f"❌ <b>Voice Note Issue</b>: <code>{str(e)[:150]}</code>"
        )


async def _handle_text_input(chat_id: int, user_id: int, text: str) -> None:
    """Handles text input: dev task prompts, transcript corrections, or a fresh direct text blog idea."""
    conv = await session_manager.get_or_create_active_conversation(user_id)
    latest_session = await session_repo.get_latest_session(conv.id)

    # Case 0: User is submitting a task to ScrollBot Dev Agent
    if conv.current_stage == "dev_task_input":
        await handle_dev_text_input(chat_id, user_id, text)
        return

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

    # Case D: User explicitly started a blog idea session via /newblog
    if conv.current_stage == "blog_input_pending":
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
        return

    # Case E: Default conversational companion (ScrollBot Jarvis Assistant)
    await bot_client.send_chat_action(chat_id=chat_id, action="typing")
    from app.ai.agents.jarvis_agent import jarvis_agent
    try:
        reply = await jarvis_agent.chat(user_id=user_id, message_text=text)
        await bot_client.send_message(chat_id=chat_id, text=reply)
    except Exception as e:
        logger.error(f"Error in Jarvis chat: {e}", exc_info=True)
        await bot_client.send_message(chat_id=chat_id, text="I had an issue formulating my thought, Sandy. Try again?")

