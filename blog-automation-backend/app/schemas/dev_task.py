"""Pydantic data schemas for ScrollBot Software Developer Agent tasks.
Strictly defines task boundaries, token budgets, and verification results.
"""
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from uuid import uuid4
from pydantic import BaseModel, Field

DevTaskStatus = Literal[
    "planning",
    "awaiting_approval",
    "coding",
    "verifying",
    "ready_for_review",
    "merged",
    "rejected",
    "failed",
    "cancelled",
]

RiskLevel = Literal["Low", "Medium", "High"]


class DevTaskPlan(BaseModel):
    """Initial scoped plan generated before any code is written."""
    task_id: str = Field(default_factory=lambda: uuid4().hex[:8])
    user_id: int
    chat_id: int
    goal: str
    target_files: List[str] = Field(default_factory=list)
    action_summary: str = Field(description="1-3 concise bullet points of what will change")
    diff_preview: str = Field(description="Short preview of proposed code changes or approach")
    risk_level: RiskLevel = "Low"
    estimated_tokens: int = 1500
    status: DevTaskStatus = "awaiting_approval"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DevTaskResult(BaseModel):
    """Complete execution and verification outcome."""
    task_id: str
    user_id: int
    chat_id: int
    branch_name: str
    goal: str
    modified_files: Dict[str, str] = Field(default_factory=dict, description="filepath -> new full content")
    diff_summary: str = ""
    build_passed: bool = False
    build_log: str = ""
    tokens_used: int = 0
    auto_fix_attempted: bool = False
    auto_fix_passed: bool = False
    vercel_preview_url: Optional[str] = None
    pull_request_url: Optional[str] = None
    pull_number: Optional[int] = None
    status: DevTaskStatus = "verifying"
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
