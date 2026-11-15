"""Anthropic Claude AI Provider implementation.
Allows seamless upgrading to Claude 3.5 Sonnet / Claude 3 Opus once budget is available.
Supports structured JSON generation using tool calling or system prompting.
"""
import json
import logging
from typing import Type, TypeVar
from pydantic import BaseModel

from app.ai.provider_interface import AIProvider, TranscriptionResult, UsageMetadata
from app.config.settings import settings

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

class AnthropicProvider(AIProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model_name = model or settings.ANTHROPIC_MODEL
        self._client = None

    @property
    def provider_name(self) -> str:
        return "anthropic"

    def _get_client(self):
        if self._client is None:
            if not self.api_key:
                raise ValueError("ANTHROPIC_API_KEY is not configured in settings or environment.")
            import anthropic
            self._client = anthropic.AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/ogg"
    ) -> tuple[TranscriptionResult, UsageMetadata]:
        """Anthropic models are text/vision only and do not natively process raw audio.
        We transparently delegate transcription to Gemini Free (or Whisper) so audio transcription
        remains zero-cost even when using Claude for writing!
        """
        logger.info("Delegating audio transcription to Gemini Free provider...")
        from app.ai.providers.gemini_provider import GeminiProvider
        gemini = GeminiProvider()
        return await gemini.transcribe_audio(audio_bytes=audio_bytes, mime_type=mime_type)

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> tuple[str, UsageMetadata]:
        """Generates text using Claude."""
        client = self._get_client()

        response = await client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        text_content = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )

        in_tokens = response.usage.input_tokens
        out_tokens = response.usage.output_tokens

        # Estimated Claude 3.5 Sonnet pricing: $3/M in, $15/M out
        cost = (in_tokens * 0.000003) + (out_tokens * 0.000015)

        usage = UsageMetadata(
            provider="anthropic",
            model=self.model_name,
            operation="generate_text",
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            estimated_cost=cost
        )
        return text_content.strip(), usage

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 4096
    ) -> tuple[T, UsageMetadata]:
        """Generates structured output by passing the Pydantic schema as a forced tool definition."""
        client = self._get_client()

        tool_name = f"record_{response_schema.__name__.lower()}"
        tool_definition = {
            "name": tool_name,
            "description": f"Output the structured data matching {response_schema.__name__}",
            "input_schema": response_schema.model_json_schema()
        }

        response = await client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            tools=[tool_definition],
            tool_choice={"type": "tool", "name": tool_name},
            messages=[{"role": "user", "content": user_prompt}]
        )

        # Extract tool use block
        tool_call = next(
            (b for b in response.content if b.type == "tool_use" and b.name == tool_name),
            None
        )

        if not tool_call:
            raise RuntimeError(f"Claude failed to call the structured tool {tool_name}")

        parsed = response_schema.model_validate(tool_call.input)

        in_tokens = response.usage.input_tokens
        out_tokens = response.usage.output_tokens
        cost = (in_tokens * 0.000003) + (out_tokens * 0.000015)

        usage = UsageMetadata(
            provider="anthropic",
            model=self.model_name,
            operation="generate_structured",
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            estimated_cost=cost
        )
        return parsed, usage

