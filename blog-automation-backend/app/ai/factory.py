"""AI Provider Factory.
Provides singletons of the configured AI providers. Allows seamless switching between Gemini and Claude,
or even mixing models across agents (e.g. Gemini for analysis + Claude for the Writer).
"""
import logging
from typing import Dict
from app.ai.provider_interface import AIProvider
from app.config.settings import settings

logger = logging.getLogger(__name__)

_providers: Dict[str, AIProvider] = {}

def get_ai_provider(provider_name: str | None = None) -> AIProvider:
    """Returns an instance of the requested AI provider (e.g. 'gemini', 'anthropic').
    If provider_name is None, uses settings.DEFAULT_AI_PROVIDER.
    """
    target = (provider_name or settings.DEFAULT_AI_PROVIDER).lower()

    if target in _providers:
        return _providers[target]

    if target == "gemini":
        from app.ai.providers.gemini_provider import GeminiProvider
        provider = GeminiProvider()
        _providers["gemini"] = provider
        logger.info("Initialized Gemini AI Provider (Free Tier)")
        return provider

    elif target == "anthropic":
        from app.ai.providers.anthropic_provider import AnthropicProvider
        provider = AnthropicProvider()
        _providers["anthropic"] = provider
        logger.info("Initialized Anthropic Claude AI Provider")
        return provider

    else:
        raise ValueError(
            f"Unsupported AI provider '{target}'. Supported providers: 'gemini', 'anthropic'."
        )

def get_agent_provider(agent_role: str) -> AIProvider:
    """Returns the specific provider designated for a given agent role,
    allowing hybrid workflows (e.g., Writer on Claude, Analysis on Gemini).
    """
    provider_name = settings.get_provider_for_agent(agent_role)
    return get_ai_provider(provider_name)


class AIFactory:
    """Factory alias supporting create_provider."""

    @staticmethod
    def create_provider(provider_name: str | None = None) -> AIProvider:
        return get_ai_provider(provider_name)

    @staticmethod
    def get_provider(provider_name: str | None = None) -> AIProvider:
        return get_ai_provider(provider_name)

