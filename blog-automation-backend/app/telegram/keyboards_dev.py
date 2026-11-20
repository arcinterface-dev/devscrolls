"""Inline keyboard markups for ScrollBot Software Developer Agent workflows.
"""
from typing import Any, Dict, List, Optional


def get_dev_plan_keyboard(task_id: str) -> Dict[str, Any]:
    """Keyboard presented with the initial implementation plan (Gate 1)."""
    return {
        "inline_keyboard": [
            [
                {
                    "text": "✅ Approve & Implement",
                    "callback_data": f"dev_approve:{task_id}",
                }
            ],
            [
                {
                    "text": "❌ Cancel Task",
                    "callback_data": f"dev_cancel:{task_id}",
                }
            ],
        ]
    }


def get_dev_deploy_keyboard(
    task_id: str,
    preview_url: Optional[str] = None,
    pr_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Keyboard presented after successful build verification (Gate 2)."""
    buttons: List[List[Dict[str, str]]] = []

    # Optional Preview & PR URL buttons
    top_row: List[Dict[str, str]] = []
    if preview_url:
        top_row.append({"text": "🌐 View Preview", "url": preview_url})
    if pr_url:
        top_row.append({"text": "🐙 View PR", "url": pr_url})
    if top_row:
        buttons.append(top_row)

    # Action buttons
    buttons.append([
        {
            "text": "🚀 Merge to Production",
            "callback_data": f"dev_merge:{task_id}",
        }
    ])
    buttons.append([
        {
            "text": "🗑️ Discard & Delete Branch",
            "callback_data": f"dev_reject:{task_id}",
        }
    ])

    return {"inline_keyboard": buttons}


def get_dev_failure_keyboard(task_id: str) -> Dict[str, Any]:
    """Keyboard presented when build verification fails after the 1-shot auto-fix."""
    return {
        "inline_keyboard": [
            [
                {
                    "text": "🔄 Retry with Guidance",
                    "callback_data": f"dev_retry:{task_id}",
                }
            ],
            [
                {
                    "text": "🗑️ Discard Task",
                    "callback_data": f"dev_cancel:{task_id}",
                }
            ],
        ]
    }
