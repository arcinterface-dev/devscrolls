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
                    "text": "🗑️ Reject Draft",
                    "callback_data": f"draft_reject:{did}"
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
