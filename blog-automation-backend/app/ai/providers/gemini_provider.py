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

    async def _call_with_retry_and_fallback(
        self,
        contents: Any,
        config: Any,
        primary_model: str
    ) -> tuple[Any, str]:
        """Calls Gemini API with automatic exponential backoff on 503/429 and fallback models."""
        client = self._get_client()
        candidate_models = [primary_model]
        # Robust production fallback models if primary model is experiencing a high-demand spike
        fallbacks = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"]
        for f in fallbacks:
            if f not in candidate_models:
                candidate_models.append(f)

        last_err = None
        for model in candidate_models:
            for attempt in range(1, 4):
                try:
                    logger.info(f"Gemini invoking model '{model}' (attempt {attempt}/3)...")
                    def _call():
                        return client.models.generate_content(
                            model=model,
                            contents=contents,
                            config=config
                        )
                    response = await asyncio.to_thread(_call)
                    return response, model
                except Exception as e:
                    last_err = e
                    err_str = str(e).lower()
                    is_transient = any(
                        code in err_str
                        for code in ["503", "unavailable", "high demand", "429", "resource_exhausted", "quota", "timeout"]
                    )
                    if is_transient:
                        backoff = 2 ** attempt
                        logger.warning(
                            f"Gemini model '{model}' returned transient error on attempt {attempt}: {e}. "
                            f"Retrying in {backoff}s..."
                        )
                        await asyncio.sleep(backoff)
                    else:
                        logger.error(f"Gemini model '{model}' failed with non-transient error: {e}")
                        break

            logger.warning(f"Gemini model '{model}' exhausted retries. Switching to fallback candidate...")

        raise last_err

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> tuple[str, UsageMetadata]:
        """Generates regular text/markdown using Gemini with auto-retry and fallbacks."""
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens
        )

        response, used_model = await self._call_with_retry_and_fallback(
            contents=user_prompt,
            config=config,
            primary_model=self.model_name
        )

        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0

        usage = UsageMetadata(
            provider="gemini",
            model=used_model,
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
        """Generates structured output strictly validated against response_schema with auto-retry."""
        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
            response_schema=response_schema
        )

        response, used_model = await self._call_with_retry_and_fallback(
            contents=user_prompt,
            config=config,
            primary_model=self.model_name
        )

        in_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
        out_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0

        parsed = response_schema.model_validate_json(response.text)
        usage = UsageMetadata(
            provider="gemini",
            model=used_model,
            operation="generate_structured",
            input_tokens=in_tokens or 0,
            output_tokens=out_tokens or 0,
            estimated_cost=0.0
        )
        return parsed, usage
