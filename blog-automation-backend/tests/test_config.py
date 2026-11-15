"""Tests for configuration parsing, user allowlists, and provider routing.
"""
from app.config.settings import Settings

def test_telegram_user_ids_parsing():
    settings = Settings(
        AUTHORIZED_TELEGRAM_USER_IDS="123456, 789012, 345678"
    )
    assert settings.AUTHORIZED_TELEGRAM_USER_IDS == [123456, 789012, 345678]

def test_default_provider_routing():
    settings = Settings(DEFAULT_AI_PROVIDER="gemini")
    assert settings.get_provider_for_agent("writer") == "gemini"
    assert settings.get_provider_for_agent("analyst") == "gemini"

def test_per_agent_provider_override():
    # Scenario: free Gemini for analysis, Claude for Writer
    settings = Settings(
        DEFAULT_AI_PROVIDER="gemini",
        WRITER_AI_PROVIDER="anthropic"
    )
    assert settings.get_provider_for_agent("analyst") == "gemini"
    assert settings.get_provider_for_agent("research") == "gemini"
    assert settings.get_provider_for_agent("writer") == "anthropic"

