"""Stage handlers linking background workers with specialized AI agents.
Registers handlers for perspective analysis, research, fact-checking, and drafting.
"""
import logging
from typing import Any, Dict
from app.ai.agents.perspective_analyst import perspective_analyst
from app.ai.agents.research_agent import research_agent
from app.ai.agents.fact_checker import fact_checker
from app.ai.agents.blog_writer import blog_writer
from app.schemas.database import GenerationJob
from app.schemas.perspective import ClassifiedClaim, PerspectiveOutput
from app.schemas.research import ResearchOutput
from app.schemas.factcheck import FactCheckOutput
from app.storage.repositories import (
    ClaimRepository,
    ConversationRepository,
    DraftRepository,
    InputSessionRepository,
)
from app.publishing.article_validator import article_validator
from app.publishing.github_publisher import github_publisher
from app.publishing.deployment_monitor import deployment_monitor
from app.telegram.bot_client import bot_client
from app.telegram.keyboards import get_major_correction_keyboard, get_draft_review_keyboard
from app.workers.job_processor import register_stage_handler
from app.workers.job_queue import job_queue

logger = logging.getLogger(__name__)

conv_repo = ConversationRepository()
session_repo = InputSessionRepository()
claim_repo = ClaimRepository()
draft_repo = DraftRepository()

# ------------------------------------------------------------------------------
# Stage 1: Perspective Analysis
# ------------------------------------------------------------------------------
async def handle_perspective_analysis_stage(job: GenerationJob) -> None:
    """Stage 1 Execution: Runs Personal Perspective Analyst on the confirmed transcript."""
    logger.info(f"Executing Perspective Analysis for job {job.id}...")

    conv = await conv_repo.get_by_id(job.conversation_id)
    if not conv:
        raise ValueError(f"Conversation {job.conversation_id} not found for job {job.id}")

    session = await session_repo.get_latest_session(job.conversation_id)
    if not session or not session.effective_transcript:
        raise ValueError(f"No confirmed transcript found for conversation {job.conversation_id}")

    transcript = session.effective_transcript

    # Retrieve past author perspectives & war stories on this topic
    from app.knowledge.retrieval import knowledge_retriever
    knowledge_ctx = await knowledge_retriever.retrieve_relevant_knowledge(transcript[:300])
    previous_knowledge_list = [u.model_dump() for u in knowledge_ctx.matching_units] if knowledge_ctx.matching_units else None

    # Run the Perspective Analyst
    output, usage = await perspective_analyst.analyze(
        transcript=transcript,
        previous_knowledge=previous_knowledge_list,
        job_id=job.id
    )

    # Check for clarification questions
    if output.clarification_questions:
        logger.info(f"Perspective Analyst formulated {len(output.clarification_questions)} clarification questions.")
        
        q_text = "❓ <b>Clarification Questions for Your Article</b>\n\n"
        q_text += f"Working Title: <b>{output.proposed_title}</b>\n\n"
        q_text += "To make sure this article accurately represents your viewpoint and experience, could you clarify:\n\n"
        for i, q in enumerate(output.clarification_questions, 1):
            q_text += f"<b>{i}.</b> {q}\n"
        q_text += "\n<i>Please reply with your answers as a text message, and the research & drafting pipeline will resume immediately!</i>"

        await bot_client.send_message(
            chat_id=conv.telegram_user_id,
            text=q_text
        )

        # Pause job until author answers
        await job_queue.pause_for_user_action(
            job_id=job.id,
            status="awaiting_clarification",
            reason=f"Awaiting answers to {len(output.clarification_questions)} clarification questions."
        )
        await conv_repo.update_status(conv.id, "active", "awaiting_clarification")
        return

    # No clarification needed: Batch insert claims into database
    claims_to_insert = [
        {
            "claim_text": c.statement,
            "original_statement": c.statement,
            "claim_type": c.claim_type,
            "verification_status": "HYPOTHESIS",
            "context": c.context
        }
        for c in output.claims
    ]
    if claims_to_insert:
        await claim_repo.insert_claims(job.id, claims_to_insert)
        logger.info(f"Inserted {len(claims_to_insert)} claims into article_claims ledger.")

    # Advance stage to research
    output_dict = output.model_dump()
    await job_queue.advance_stage(
        job_id=job.id,
        completed_stage="perspective_analysis",
        next_stage="research",
        stage_output=output_dict
    )

    # Notify author of milestone
    research_claims_count = sum(1 for c in output.claims if c.requires_research)
    notify_text = (
        "🔍 <b>Perspective Analysis Complete</b>\n\n"
        f"• <b>Title:</b> {output.proposed_title}\n"
        f"• <b>Format:</b> <code>{output.article_type}</code>\n"
        f"• <b>Target Audience:</b> {output.target_audience}\n"
        f"• <b>Identified Claims:</b> {len(output.claims)} ({research_claims_count} require external research)\n\n"
        "🌐 Moving to <b>Agent 2: Technical Research via Tavily</b>..."
    )
    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=notify_text
    )

register_stage_handler("perspective_analysis", handle_perspective_analysis_stage)

# ------------------------------------------------------------------------------
# Stage 2: Technical Research via Tavily
# ------------------------------------------------------------------------------
async def handle_research_stage(job: GenerationJob) -> None:
    """Stage 2 Execution: Runs Technical Research Agent via Tavily Search."""
    logger.info(f"Executing Technical Research for job {job.id}...")

    conv = await conv_repo.get_by_id(job.conversation_id)
    if not conv:
        raise ValueError(f"Conversation {job.conversation_id} not found for job {job.id}")

    # Extract claims from previous stage output
    perspective_data = job.perspective_output or {}
    raw_claims = perspective_data.get("claims", [])
    topic = perspective_data.get("proposed_title") or perspective_data.get("article_objective", "Technical Article")

    claims = [ClassifiedClaim.model_validate(c) for c in raw_claims]

    # Conduct research via Tavily
    output, usage = await research_agent.conduct_research(
        claims=claims,
        topic=topic,
        job_id=job.id
    )

    # Batch insert retrieved sources into Supabase research_sources table
    sources_to_insert = []
    for cr in output.claims_researched:
        for s in cr.sources:
            sources_to_insert.append({
                "claim_id": None,
                "source_title": s.source_title,
                "source_url": s.source_url,
                "source_type": s.source_type,
                "publication_date": s.publication_date,
                "relevant_excerpt": s.relevant_excerpt,
                "reliability_score": s.reliability_score
            })

    if sources_to_insert:
        await claim_repo.insert_research_sources(job.id, sources_to_insert)
        logger.info(f"Saved {len(sources_to_insert)} research sources to database.")

    # Advance stage to fact_check
    output_dict = output.model_dump()
    await job_queue.advance_stage(
        job_id=job.id,
        completed_stage="research",
        next_stage="fact_check",
        stage_output=output_dict
    )

    # Notify author
    total_sources = sum(len(cr.sources) for cr in output.claims_researched)
    notify_text = (
        "🌐 <b>Technical Research Complete</b>\n\n"
        f"• <b>Claims Researched:</b> {len(output.claims_researched)}\n"
        f"• <b>Sources Verified:</b> {total_sources}\n"
        f"• <b>Search Credits Used:</b> {output.credits_consumed}\n\n"
        "🛡️ Moving to <b>Agent 3: Fact Checker & Critical Ledger</b>..."
    )
    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=notify_text
    )

register_stage_handler("research", handle_research_stage)

# ------------------------------------------------------------------------------
# Stage 3: Fact Checking & Critical Review
# ------------------------------------------------------------------------------
async def handle_fact_check_stage(job: GenerationJob) -> None:
    """Stage 3 Execution: Runs Fact Checker Agent to evaluate claims against evidence."""
    logger.info(f"Executing Fact Checking for job {job.id}...")

    conv = await conv_repo.get_by_id(job.conversation_id)
    if not conv:
        raise ValueError(f"Conversation {job.conversation_id} not found for job {job.id}")

    # Extract claims from perspective_output
    perspective_data = job.perspective_output or {}
    raw_claims = perspective_data.get("claims", [])
    title = perspective_data.get("proposed_title", "Technical Article")
    claims = [ClassifiedClaim.model_validate(c) for c in raw_claims]

    # Extract research output from research_output or stage outputs
    research_data = job.research_output or {}
    research_output = ResearchOutput.model_validate(research_data)

    # Run Fact Checker Agent
    output, usage = await fact_checker.verify(
        claims=claims,
        research_output=research_output,
        article_title=title,
        job_id=job.id
    )

    # Update claims in database with verification verdicts
    db_status_map = {
        "verified": "VERIFIED",
        "contradicted": "CONTRADICTED",
        "outdated": "OUTDATED",
        "personal_opinion": "PERSONAL_OPINION",
        "personal_exp": "PERSONAL_EXPERIENCE",
        "personal_experience": "PERSONAL_EXPERIENCE",
        "unverifiable": "UNSUPPORTED",
        "unsupported": "UNSUPPORTED",
        "ambiguous": "INTERPRETATION",
        "interpretation": "INTERPRETATION",
        "hypothesis": "HYPOTHESIS",
        "partially_verified": "PARTIALLY_VERIFIED",
    }
    db_claims = await claim_repo.get_claims_for_job(job.id)
    for verif in output.verifications:
        matching_db_claim = next((c for c in db_claims if c.claim_text == verif.claim_text), None)
        if matching_db_claim:
            raw_val = verif.status.value.lower() if hasattr(verif.status, "value") else str(verif.status).lower()
            db_status = db_status_map.get(raw_val, "VERIFIED")
            await claim_repo.update_claim_verification(
                claim_id=matching_db_claim.id,
                status=db_status,
                suggested_correction=verif.suggested_revision,
                confidence=verif.confidence_score,
                explanation=verif.explanation
            )

    # Check if human approval is required due to major technical contradictions
    if output.human_approval_required and output.major_corrections:
        logger.info(f"Fact check found {len(output.major_corrections)} major technical contradictions. Halting for approval.")

        corr_text = "🛡️ <b>Technical Fact-Check Alert</b>\n\n"
        corr_text += f"While researching <b>{title}</b>, we spotted technical discrepancies that need your call:\n\n"

        for i, mc in enumerate(output.major_corrections, 1):
            corr_text += f"<b>{i}. Claim:</b> \"{mc.claim}\"\n"
            corr_text += f"• <b>Issue:</b> {mc.reason}\n"
            corr_text += f"• <b>Evidence:</b> {mc.contradicting_source}\n"
            corr_text += f"• <b>Suggested Fix:</b> {mc.suggested_remedy}\n\n"

        corr_text += (
            "<i>Choose below: Accept the suggested fix to update the article, "
            "or keep your original phrasing as an intentional contrarian take.</i>"
        )

        keyboard = get_major_correction_keyboard(job.id)
        await bot_client.send_message(
            chat_id=conv.telegram_user_id,
            text=corr_text,
            reply_markup=keyboard
        )

        # Pause job for author confirmation
        await job_queue.pause_for_user_action(
            job_id=job.id,
            status="awaiting_approval",
            reason=f"Awaiting review of {len(output.major_corrections)} major technical corrections."
        )
        await conv_repo.update_status(conv.id, "active", "awaiting_approval")
        return

    # No major corrections: Advance to writing stage
    output_dict = output.model_dump()
    await job_queue.advance_stage(
        job_id=job.id,
        completed_stage="fact_check",
        next_stage="writing",
        stage_output=output_dict
    )

    # Notify author
    verified_count = sum(1 for v in output.verifications if v.status.value in ["verified", "personal_opinion", "personal_exp"])
    notify_text = (
        "🛡️ <b>Fact Check Complete</b>\n\n"
        f"• <b>Overall Accuracy Score:</b> {int(output.overall_accuracy_score * 100)}%\n"
        f"• <b>Claims Verified:</b> {verified_count}/{len(output.verifications)}\n"
    )
    if output.minor_corrections:
        notify_text += f"• <b>Minor Nuances Refined:</b> {len(output.minor_corrections)}\n"
    notify_text += "\n✍️ Moving to <b>Agent 4: Senior Blog Writer & Editorial Agent</b>..."

    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=notify_text
    )

register_stage_handler("fact_check", handle_fact_check_stage)

# ------------------------------------------------------------------------------
# Stage 4: Blog Writing & Drafting
# ------------------------------------------------------------------------------
async def handle_writing_stage(job: GenerationJob) -> None:
    """Stage 4 Execution: Runs Blog Writer Agent to craft the Astro markdown post."""
    logger.info(f"Executing Blog Writing for job {job.id}...")

    conv = await conv_repo.get_by_id(job.conversation_id)
    if not conv:
        raise ValueError(f"Conversation {job.conversation_id} not found for job {job.id}")

    # Reconstruct stage outputs
    perspective_data = job.perspective_output or {}
    perspective_output = PerspectiveOutput.model_validate(perspective_data)

    research_data = job.research_output or {}
    research_output = ResearchOutput.model_validate(research_data)

    factcheck_data = job.factcheck_output or {}
    factcheck_output = FactCheckOutput.model_validate(factcheck_data)

    # Determine target category
    target_cat = "frontend"
    valid_categories = ["frontend", "backend", "ai", "architecture", "interviews", "tutorials"]
    if perspective_output.article_type in valid_categories:
        target_cat = perspective_output.article_type

    # Run Blog Writer Agent
    draft_output, persisted_draft, usage = await blog_writer.write_draft(
        perspective=perspective_output,
        research=research_output,
        factcheck=factcheck_output,
        job_id=job.id,
        conversation_id=job.conversation_id,
        target_category=target_cat
    )

    # Save completed stage output
    output_dict = draft_output.model_dump()
    await job_queue.advance_stage(
        job_id=job.id,
        completed_stage="writing",
        next_stage="user_review",
        stage_output=output_dict
    )

    # Send preview and review keyboard to author
    preview_bluf = ""
    lines = [line.strip() for line in draft_output.markdown_content.split("\n") if line.strip()]
    if lines:
        preview_bluf = lines[0][:250] + ("..." if len(lines[0]) > 250 else "")

    draft_id = str(persisted_draft.id) if persisted_draft else str(job.id)
    keyboard = get_draft_review_keyboard(draft_id)

    msg = (
        "✍️ <b>Draft Complete: Ready for Your Review!</b>\n\n"
        f"• <b>Title:</b> {draft_output.title}\n"
        f"• <b>Slug:</b> <code>/articles/{draft_output.slug}/</code>\n"
        f"• <b>Length:</b> {draft_output.word_count} words ({draft_output.reading_time})\n"
        f"• <b>Category:</b> <code>{draft_output.frontmatter.category}</code>\n"
        f"• <b>Tags:</b> {', '.join([f'#{t}' for t in draft_output.frontmatter.tags])}\n\n"
        f"<b>BLUF Preview:</b>\n<i>{preview_bluf}</i>\n\n"
        "Tap below to review the full article, check research sources, request revisions, or publish to GitHub!"
    )

    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=msg,
        reply_markup=keyboard
    )

    # Pause job awaiting author review
    await job_queue.pause_for_user_action(
        job_id=job.id,
        status="awaiting_approval",
        reason="Draft completed. Awaiting author final review in Telegram."
    )
    await conv_repo.update_status(conv.id, "active", "awaiting_draft_approval")

register_stage_handler("writing", handle_writing_stage)

# ------------------------------------------------------------------------------
# Stage 5: GitHub Publishing & Deployment Verification
# ------------------------------------------------------------------------------
async def handle_publishing_stage(job: GenerationJob) -> None:
    """Stage 5 Execution: Validates Astro schema, commits to GitHub, and monitors live deployment."""
    logger.info(f"Executing GitHub Publishing for job {job.id}...")

    conv = await conv_repo.get_by_id(job.conversation_id)
    if not conv:
        raise ValueError(f"Conversation {job.conversation_id} not found for job {job.id}")

    # Fetch approved draft
    draft = await draft_repo.get_latest_draft_for_conversation(conv.id)
    if not draft:
        err_msg = f"No draft found to publish for conversation {conv.id}"
        logger.error(err_msg)
        await job_queue.mark_failed(job.id, err_msg)
        return

    # 1. Pre-Publish Validation
    is_valid, formatted_content, errors = article_validator.validate_and_format(
        title=draft.title,
        slug=draft.slug,
        markdown_content=draft.content,
        frontmatter_dict=draft.frontmatter
    )

    if not is_valid:
        error_summary = "\n".join([f"• {e}" for e in errors])
        logger.error(f"Draft {draft.id} failed pre-publish validation:\n{error_summary}")
        await bot_client.send_message(
            chat_id=conv.telegram_user_id,
            text=(
                "⚠️ <b>Pre-Publish Validation Failed</b>\n\n"
                f"The article failed Astro schema validation:\n{error_summary}\n\n"
                "Please tap <b>Request Changes</b> to adjust and re-verify."
            )
        )
        await job_queue.pause_for_user_action(
            job_id=job.id,
            status="awaiting_approval",
            reason=f"Validation errors: {errors[0]}"
        )
        return

    # Notify author that commit is in progress
    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=f"📦 <b>Committing to GitHub...</b>\n\nWriting <code>src/content/articles/{draft.slug}.md</code> to DevScrolls..."
    )

    # 2. Commit to GitHub via REST API
    success, pub_result = await github_publisher.publish_article(
        slug=draft.slug,
        title=draft.title,
        file_content=formatted_content,
        draft_id=draft.id
    )

    if not success:
        err = pub_result.get("error", "Unknown GitHub API error")
        logger.error(f"GitHub publish failed for draft {draft.id}: {err}")
        await bot_client.send_message(
            chat_id=conv.telegram_user_id,
            text=(
                f"❌ <b>Publishing Error</b>\n\n"
                f"Failed to commit to GitHub: <code>{err[:200]}</code>\n\n"
                "Tap below to retry publishing after verifying repository settings."
            ),
            reply_markup=get_draft_review_keyboard(draft.id)
        )
        await job_queue.mark_failed(job.id, f"GitHub publish failed: {err}")
        return

    commit_sha = pub_result.get("commit_sha", "")
    canonical_url = pub_result.get("canonical_url", f"https://devscrolls.dev/articles/{draft.slug}/")

    # 3. Monitor Deployment (Verify HTTP 200)
    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text="⏳ <b>Commit Verified!</b>\n\nMonitoring Astro deployment pipeline. Verifying live URL..."
    )

    deploy_res = await deployment_monitor.verify_deployment(
        slug=draft.slug,
        max_attempts=3,
        initial_delay_seconds=2.0,
        poll_interval_seconds=3.0
    )

    # 4. Finalize Records
    await draft_repo.update_status(draft.id, "published")
    await job_queue.mark_completed(job.id)
    await conv_repo.update_status(conv.id, "completed", None)

    # 5. Send Celebration Telegram Announcement
    commit_short = commit_sha[:7] if commit_sha else "latest"
    if deploy_res.get("is_live"):
        status_line = "🟢 <b>Status:</b> Live and verified (HTTP 200 OK)"
    else:
        status_line = "🟡 <b>Status:</b> Committed to main; build propagating via Vercel"

    celebration_text = (
        "🎉 <b>ARTICLE PUBLISHED LIVE!</b>\n\n"
        f"• <b>Title:</b> {draft.title}\n"
        f"• <b>Live URL:</b> <a href=\"{canonical_url}\">{canonical_url}</a>\n"
        f"• <b>Git Commit:</b> <code>{commit_short}</code>\n"
        f"{status_line}\n\n"
        "Your voice note has been completely researched, fact-checked, written, and deployed to DevScrolls without touching a line of code!\n\n"
        "Tap below to generate social media distribution assets or draft your newsletter:"
    )

    from app.telegram.keyboards import get_post_publish_keyboard
    await bot_client.send_message(
        chat_id=conv.telegram_user_id,
        text=celebration_text,
        reply_markup=get_post_publish_keyboard(draft.id, canonical_url)
    )

    # 6. Index reusable opinions, war stories, and architectural stances into personal knowledge library
    from app.knowledge.knowledge_extractor import knowledge_extractor
    import asyncio
    asyncio.create_task(
        knowledge_extractor.extract_and_index(
            markdown_content=draft.content,
            title=draft.title,
            slug=draft.slug,
            conversation_id=conv.id
        )
    )

register_stage_handler("publishing", handle_publishing_stage)

