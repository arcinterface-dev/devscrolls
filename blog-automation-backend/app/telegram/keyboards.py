"""Telegram inline keyboard builders for the two-stage confirmation gates, major corrections, and draft reviews.
"""
from typing import Any, Dict
from uuid import UUID

def get_audio_confirmation_keyboard(session_id: UUID | str) -> Dict[str, Any]:
    """Gate 1: Presented immediately after voice recording is received.
    NO AI API or transcription will occur until 'Confirm & Transcribe' is tapped.
    """
    sid = str(session_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "✅ Confirm & Transcribe",
                    "callback_data": f"audio_confirm:{sid}"
                }
            ],
            [
                {
                    "text": "🎙️ Re-record",
                    "callback_data": f"audio_rerecord:{sid}"
                },
                {
                    "text": "❌ Cancel",
                    "callback_data": f"session_cancel:{sid}"
                }
            ]
        ]
    }

def get_transcript_review_keyboard(session_id: UUID | str) -> Dict[str, Any]:
    """Gate 2: Presented after transcription (or text input) is ready.
    The 4-Agent pipeline only starts after 'Confirm & Start AI' is tapped.
    """
    sid = str(session_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "🚀 Confirm & Start AI Processing",
                    "callback_data": f"transcript_confirm:{sid}"
                }
            ],
            [
                {
                    "text": "✏️ Edit Transcript",
                    "callback_data": f"transcript_edit:{sid}"
                }
            ],
            [
                {
                    "text": "🎙️ Re-record Audio",
                    "callback_data": f"audio_rerecord:{sid}"
                },
                {
                    "text": "❌ Cancel",
                    "callback_data": f"session_cancel:{sid}"
                }
            ]
        ]
    }

def get_major_correction_keyboard(job_id: UUID | str) -> Dict[str, Any]:
    """Gate 2.5: Presented when the Fact Checker identifies a major technical contradiction."""
    jid = str(job_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "✅ Accept Fix & Proceed",
                    "callback_data": f"corr_accept:{jid}"
                }
            ],
            [
                {
                    "text": "🛡️ Keep My Original Take",
                    "callback_data": f"corr_override:{jid}"
                }
            ],
            [
                {
                    "text": "❌ Cancel Generation",
                    "callback_data": f"corr_cancel:{jid}"
                }
            ]
        ]
    }

def get_draft_review_keyboard(draft_id: UUID | str) -> Dict[str, Any]:
    """Final Gate: Presented when the complete blog draft is ready for author sign-off."""
    did = str(draft_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "🚢 Approve & Publish",
                    "callback_data": f"draft_approve:{did}"
                },
                {
                    "text": "✍️ Request Changes",
                    "callback_data": f"draft_revise:{did}"
                }
            ],
            [
                {
                    "text": "📄 View Full Article",
                    "callback_data": f"draft_view:{did}"
                },
                {
                    "text": "🔍 View Research & Sources",
                    "callback_data": f"draft_sources:{did}"
                }
            ],
            [
                {
                    "text": "💾 Keep in Drafts",
                    "callback_data": f"draft_keep:{did}"
                },
                {
                    "text": "🗑️ Reject Draft",
                    "callback_data": f"draft_reject:{did}"
                }
            ]
        ]
    }

def get_draft_list_keyboard(drafts: list[dict]) -> Dict[str, Any]:
    """Interactive Idea Bank keyboard displaying unpublished drafts."""
    buttons = []
    for d in drafts:
        did = str(d.get("id", ""))
        title = d.get("title", "Untitled Draft")
        if len(title) > 34:
            title = title[:31] + "..."
        version = d.get("current_version", 1)
        buttons.append([
            {
                "text": f"📝 {title} (v{version})",
                "callback_data": f"draft_select:{did}"
            }
        ])

    # Utility row at bottom
    buttons.append([
        {
            "text": "➕ Record New Idea",
            "callback_data": "draft_new_idea"
        },
        {
            "text": "🔄 Refresh",
            "callback_data": "draft_refresh"
        }
    ])

    return {"inline_keyboard": buttons}

def get_draft_detail_keyboard(draft_id: UUID | str) -> Dict[str, Any]:
    """Detailed control card for an individual draft opened from the Idea Bank."""
    did = str(draft_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "🚢 Approve & Publish",
                    "callback_data": f"draft_approve:{did}"
                },
                {
                    "text": "✍️ Request Changes / Rework",
                    "callback_data": f"draft_revise:{did}"
                }
            ],
            [
                {
                    "text": "📄 View Full Article",
                    "callback_data": f"draft_view:{did}"
                },
                {
                    "text": "🔍 View Research & Sources",
                    "callback_data": f"draft_sources:{did}"
                }
            ],
            [
                {
                    "text": "🗑️ Archive Draft",
                    "callback_data": f"draft_archive:{did}"
                },
                {
                    "text": "⬅️ Back to Drafts List",
                    "callback_data": "draft_list"
                }
            ]
        ]
    }

def get_post_publish_keyboard(draft_id: UUID | str, canonical_url: str) -> Dict[str, Any]:
    """Presented after successful deployment to provide one-tap social & newsletter distribution.
    Structured vertically for full button label visibility.
    """
    did = str(draft_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "📱 Generate LinkedIn Post",
                    "callback_data": f"post_publish_linkedin:{did}"
                }
            ],
            [
                {
                    "text": "📧 Create Kit Newsletter Broadcast",
                    "callback_data": f"post_publish_kit:{did}"
                }
            ],
            [
                {
                    "text": "🌐 Open Live Article",
                    "url": canonical_url
                }
            ]
        ]
    }

def get_linkedin_keyboard(draft_id: UUID | str, canonical_url: Optional[str] = None) -> Dict[str, Any]:
    """Action buttons attached to generated LinkedIn post.
    Structured vertically for 100% full-width visibility on mobile and desktop.
    """
    did = str(draft_id)
    buttons = []
    if canonical_url:
        import urllib.parse
        encoded_url = urllib.parse.quote(canonical_url, safe="")
        buttons.append([
            {
                "text": "🚀 Open LinkedIn Post Composer",
                "url": f"https://www.linkedin.com/sharing/share-offsite/?url={encoded_url}"
            }
        ])
    buttons.append([
        {
            "text": "🔄 Regenerate LinkedIn Post",
            "callback_data": f"post_publish_linkedin:{did}"
        }
    ])
    buttons.append([
        {
            "text": "📧 Create Kit Newsletter Broadcast",
            "callback_data": f"post_publish_kit:{did}"
        }
    ])
    return {"inline_keyboard": buttons}

def get_newsletter_keyboard(draft_id: UUID | str) -> Dict[str, Any]:
    """Action buttons attached to generated newsletter.
    Structured vertically for 100% full-width visibility.
    """
    did = str(draft_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "🔄 Regenerate Newsletter Broadcast",
                    "callback_data": f"post_publish_kit:{did}"
                }
            ],
            [
                {
                    "text": "📱 Generate LinkedIn Post",
                    "callback_data": f"post_publish_linkedin:{did}"
                }
            ]
        ]
    }

def get_cancel_only_keyboard(session_id: UUID | str) -> Dict[str, Any]:
    """Single cancel button used when waiting for text corrections."""
    sid = str(session_id)
    return {
        "inline_keyboard": [
            [
                {
                    "text": "❌ Cancel",
                    "callback_data": f"session_cancel:{sid}"
                }
            ]
        ]
    }
