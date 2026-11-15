"""Abstract AI Provider Interface and Data Transfer Objects.
Defines the standard contract that Gemini, Anthropic (Claude), OpenAI, or local models must implement.
This decouples all agent prompts and orchestrator workflows from any specific AI SDK.
"""
from abc import ABC, abstractmethod
from typing import TypeVar, Type
from pydantic import BaseModel, Field

T = TypeVar("T", bound=BaseModel)

class TranscriptionResult(BaseModel):
    """Normalized audio transcription result."""
    text: str = Field(description="The transcribed text content")
    language: str | None = Field(default="en", description="Detected language code")
    confidence: float | None = Field(default=None, description="Confidence score if available (0.0 - 1.0)")
    duration_seconds: float | None = Field(default=None, description="Audio duration in seconds")

class UsageMetadata(BaseModel):
    """Token and cost telemetry captured per AI call."""
    provider: str
    model: str
    operation: str
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost: float = 0.0

class AIProvider(ABC):
    """Abstract Base Class for all AI providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider, e.g. 'gemini', 'anthropic', 'openai'."""
        pass

    @abstractmethod
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/ogg"
    ) -> tuple[TranscriptionResult, UsageMetadata]:
        """Transcribe voice audio into text with usage metadata."""
        pass

    @abstractmethod
    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> tuple[str, UsageMetadata]:
        """Generate unstructured markdown or text response."""
        pass

    @abstractmethod
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 4096
    ) -> tuple[T, UsageMetadata]:
        """Generate a response strictly guaranteed to conform to the Pydantic schema T."""
        pass

