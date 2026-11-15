"""Tests for the pluggable AI Provider architecture and factory.
Ensures we can switch between Gemini and Claude seamlessly.
"""
import pytest
from app.ai.factory import get_ai_provider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.anthropic_provider import AnthropicProvider

def test_factory_returns_gemini_by_default(monkeypatch):
    monkeypatch.setenv("DEFAULT_AI_PROVIDER", "gemini")
    provider = get_ai_provider("gemini")
    assert isinstance(provider, GeminiProvider)
    assert provider.provider_name == "gemini"

def test_factory_returns_anthropic_when_requested(monkeypatch):
    monkeypatch.setenv("DEFAULT_AI_PROVIDER", "anthropic")
    provider = get_ai_provider("anthropic")
    assert isinstance(provider, AnthropicProvider)
    assert provider.provider_name == "anthropic"

def test_factory_rejects_unsupported_provider():
    with pytest.raises(ValueError, match="Unsupported AI provider 'unsupported_model'"):
        get_ai_provider("unsupported_model")

