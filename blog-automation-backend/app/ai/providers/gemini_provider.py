"""Google Gemini AI Provider implementation (Zero-Cost Free Tier Target).
Uses the official google-genai SDK for multimodal audio transcription and structured JSON generation.
"""
import asyncio
import logging
from typing import Type, TypeVar
from pydantic import BaseModel

from app.ai.provider_interface import AIProvider, TranscriptionResult, UsageMetadata
from app.config.settings import settings

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL
        self.transcription_model_name = settings.GEMINI_TRANSCRIPTION_MODEL
        self._client = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _get_client(self):
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in settings or environment.")
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/ogg"
    ) -> tuple[TranscriptionResult, UsageMetadata]:
        """Transcribes audio using Gemini's native multimodal input capability.
        Runs in an async thread to prevent blocking the FastAPI event loop.
        """
        client = self._get_client()
        from google.genai import types

        prompt = (
            "Transcribe this voice recording with high technical accuracy. "
            "Preserve exact spoken words, developer terms, framework names, and sentence structure. "
            "Do not summarize, do not clean up grammar quirks, and do not add filler."
        )

        part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)

        def _call_api():
            return client.models.generate_content(
                model=self.transcription_model_name,
                contents=[part, prompt]
            )

        # Run via asyncio.to_thread for non-blocking I/O
        response = await asyncio.to_thread(_call_api)

        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0

        usage = UsageMetadata(
            provider="gemini",
            model=self.transcription_model_name,
            operation="transcription",
            input_tokens=in_tokens or 0,
            output_tokens=out_tokens or 0,
            estimated_cost=0.0  # Free tier
        )

        result = TranscriptionResult(
            text=response.text.strip(),
            language="en"
        )
        return result, usage

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> tuple[str, UsageMetadata]:
        """Generates regular text/markdown using Gemini."""
        client = self._get_client()
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens
        )

        def _call_api():
            return client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=config
            )

        response = await asyncio.to_thread(_call_api)

        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0

        usage = UsageMetadata(
            provider="gemini",
            model=self.model_name,
            operation="generate_text",
            input_tokens=in_tokens or 0,
            output_tokens=out_tokens or 0,
            estimated_cost=0.0
        )
        return response.text.strip(), usage

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 4096
    ) -> tuple[T, UsageMetadata]:
        """Generates structured output strictly validated against response_schema."""
        client = self._get_client()
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            response_schema=response_schema
        )

        def _call_api():
            return client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=config
            )

        response = await asyncio.to_thread(_call_api)

        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0

        parsed = response_schema.model_validate_json(response.text)
        usage = UsageMetadata(
            provider="gemini",
            model=self.model_name,
            operation="generate_structured",
            input_tokens=in_tokens or 0,
            output_tokens=out_tokens or 0,
            estimated_cost=0.0
        )
        return parsed, usage
