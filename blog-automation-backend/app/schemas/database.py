"""Pydantic data models for Supabase database tables in the 'automation' schema.
Provides strict type-checking, serialization, and validation across all backend services.
"""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

# Literal status enums matching PostgreSQL CHECK constraints
ConversationStatus = Literal["active", "completed", "cancelled", "failed"]
InputType = Literal["voice", "text"]
AudioStatus = Literal["pending", "confirmed", "superseded", "cancelled"]
TranscriptStatus = Literal["pending", "confirmed", "editing", "cancelled"]
JobStatus = Literal[
    "queued",
    "processing",
    "awaiting_clarification",
    "awaiting_approval",
    "completed",
    "failed",
    "cancelled",
    "paused_quota",
]
JobStage = Literal[
    "perspective_analysis",
    "research",
    "fact_check",
    "writing",
    "editorial_review",
    "user_review",
    "publishing",
    "deployment_verification",
]
DraftStatus = Literal[
    "draft",
    "pending_review",
    "revision_requested",
    "approved",
    "published",
    "rejected",
]
ClaimType = Literal[
    "personal_experience",
    "personal_opinion",
    "technical_fact",
    "interpretation",
    "hypothesis",
    "external_fact",
]
VerificationStatus = Literal[
    "VERIFIED",
    "PARTIALLY_VERIFIED",
    "CONTRADICTED",
    "UNSUPPORTED",
    "OUTDATED",
    "PERSONAL_EXPERIENCE",
    "PERSONAL_OPINION",
    "INTERPRETATION",
    "HYPOTHESIS",
]
SourceType = Literal[
    "official_docs",
    "academic",
    "tech_publication",
    "community",
    "other",
]
KnowledgeType = Literal[
    "experience",
    "opinion",
    "explanation",
    "observation",
    "project",
]
PublishingStatus = Literal[
    "pending",
    "committing",
    "committed",
    "deploying",
    "deployed",
    "verified",
    "failed",
]
AIProviderName = Literal["gemini", "anthropic", "tavily", "github"]

# ------------------------------------------------------------------------------
# 1. Telegram Users
# ------------------------------------------------------------------------------
class TelegramUser(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    telegram_user_id: int
    username: Optional[str] = None
    display_name: Optional[str] = None
    is_authorized: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 2. Conversations
# ------------------------------------------------------------------------------
class Conversation(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    telegram_user_id: int
    status: ConversationStatus = "active"
    current_stage: str = "input_pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 3. Input Sessions (Two-Stage Confirmation State)
# ------------------------------------------------------------------------------
class InputSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID
    input_type: InputType
    telegram_file_id: Optional[str] = None
    telegram_message_id: Optional[int] = None
    audio_status: AudioStatus = "pending"
    transcript_status: TranscriptStatus = "pending"
    original_transcript: Optional[str] = None
    corrected_transcript: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def effective_transcript(self) -> Optional[str]:
        """Returns the user-corrected transcript if provided, otherwise the original transcript."""
        return self.corrected_transcript or self.original_transcript

# ------------------------------------------------------------------------------
# 4. Generation Jobs
# ------------------------------------------------------------------------------
class GenerationJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID
    status: JobStatus = "queued"
    current_stage: JobStage = "perspective_analysis"
    perspective_output: Optional[Dict[str, Any]] = None
    research_output: Optional[Dict[str, Any]] = None
    factcheck_output: Optional[Dict[str, Any]] = None
    retry_count: int = 0
    error_message: Optional[str] = None
    claimed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 5. Blog Drafts
# ------------------------------------------------------------------------------
class BlogDraft(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    conversation_id: UUID
    job_id: Optional[UUID] = None
    title: str
    slug: str
    description: Optional[str] = None
    content: str
    frontmatter: Dict[str, Any]
    seo_metadata: Optional[Dict[str, Any]] = None
    status: DraftStatus = "draft"
    current_version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 6. Draft Versions
# ------------------------------------------------------------------------------
class DraftVersion(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    draft_id: UUID
    version_number: int
    content: str
    frontmatter: Dict[str, Any]
    revision_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 7. Article Claims (Fact Check Ledger)
# ------------------------------------------------------------------------------
class ArticleClaim(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    claim_text: str
    original_statement: str
    claim_type: ClaimType
    verification_status: VerificationStatus
    suggested_correction: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 8. Research Sources
# ------------------------------------------------------------------------------
class ResearchSource(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    claim_id: Optional[UUID] = None
    source_title: str
    source_url: str
    source_type: Optional[SourceType] = "other"
    publication_date: Optional[str] = None
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)
    relevant_excerpt: Optional[str] = None
    reliability_score: Optional[float] = None

# ------------------------------------------------------------------------------
# 9. Personal Knowledge Library
# ------------------------------------------------------------------------------
class PersonalKnowledge(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    conversation_id: Optional[UUID] = None
    original_content: str
    corrected_content: Optional[str] = None
    topic: str
    knowledge_type: Optional[KnowledgeType] = "experience"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 10. Publishing Jobs
# ------------------------------------------------------------------------------
class PublishingJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    draft_id: UUID
    status: PublishingStatus = "pending"
    github_commit_sha: Optional[str] = None
    github_file_path: Optional[str] = None
    published_url: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ------------------------------------------------------------------------------
# 11. Usage Logs (Budget & Telemetry)
# ------------------------------------------------------------------------------
class UsageLog(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    job_id: Optional[UUID] = None
    provider: AIProviderName
    model: Optional[str] = None
    operation: str
    input_tokens: int = 0
    output_tokens: int = 0
    search_credits: int = 0
    estimated_cost: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

