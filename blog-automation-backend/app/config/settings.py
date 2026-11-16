"""Application configuration and environment variable validation using Pydantic Settings.
Designed for easy zero-cost operation on Gemini free tier, with modular pluggability to switch to Claude (Anthropic) or other providers later.
"""
from typing import Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AIProviderType = Literal["gemini", "anthropic", "openai"]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # -------------------------------------------------------------------------
    # App & Environment
    # -------------------------------------------------------------------------
    APP_ENV: str = Field(default="development", description="development | staging | production")
    APP_VERSION: str = Field(default="0.1.6")
    LOG_LEVEL: str = Field(default="INFO")
    INTERNAL_API_SECRET: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key to authenticate background worker endpoints"
    )
    BASE_BLOG_URL: str = Field(default="https://devscrolls.dev")

    # -------------------------------------------------------------------------
    # Pluggable AI Provider Configuration
    # -------------------------------------------------------------------------
    # Global default provider: "gemini" for free tier, "anthropic" for Claude
    DEFAULT_AI_PROVIDER: AIProviderType = Field(
        default="gemini",
        description="Active AI provider: 'gemini' (Free), 'anthropic' (Claude), or 'openai'"
    )

    # Per-Agent Overrides (Allows running Writer on Claude while research/analysis runs on Gemini Free)
    ANALYST_AI_PROVIDER: AIProviderType | None = Field(
        default=None,
        description="Override provider for Perspective Analyst. If None, uses DEFAULT_AI_PROVIDER"
    )
    RESEARCH_AI_PROVIDER: AIProviderType | None = Field(
        default=None,
        description="Override provider for Research Agent query generator. If None, uses DEFAULT_AI_PROVIDER"
    )
    FACTCHECK_AI_PROVIDER: AIProviderType | None = Field(
        default=None,
        description="Override provider for Fact Checker. If None, uses DEFAULT_AI_PROVIDER"
    )
    WRITER_AI_PROVIDER: AIProviderType | None = Field(
        default=None,
        description="Override provider for Blog Writer. If None, uses DEFAULT_AI_PROVIDER"
    )

    # Gemini Settings (Default Free Tier)
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = Field(
        default="gemini-3.5-flash",
        description="Flagship Flash model for multi-agent reasoning, fact-checking, and drafting"
    )
    GEMINI_TRANSCRIPTION_MODEL: str = Field(
        default="gemini-3.5-flash-lite",
        description="Active lightweight Flash model for fast multimodal audio transcription"
    )

    # Anthropic / Claude Settings (For future upgrade)
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API Key (Claude)")
    ANTHROPIC_MODEL: str = Field(default="claude-3-5-sonnet-20241022", description="Claude model for agent generation")

    # OpenAI Settings (Optional fallback)
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API Key")
    OPENAI_MODEL: str = Field(default="gpt-4o", description="OpenAI model name")

    # -------------------------------------------------------------------------
    # Telegram Bot
    # -------------------------------------------------------------------------
    TELEGRAM_BOT_TOKEN: str = Field(default="", description="Telegram Bot API Token from @BotFather")
    TELEGRAM_WEBHOOK_SECRET: str = Field(
        default="dev-webhook-secret",
        description="Secret token passed in X-Telegram-Bot-Api-Secret-Token header"
    )
    AUTHORIZED_TELEGRAM_USER_IDS: list[int] = Field(
        default_factory=list,
        description="List of integer Telegram user IDs authorized to use the bot"
    )

    @field_validator("AUTHORIZED_TELEGRAM_USER_IDS", mode="before")
    @classmethod
    def parse_user_ids(cls, v):
        if isinstance(v, int):
            return [v]
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return []
            if v_str.startswith("[") and v_str.endswith("]"):
                import json
                try:
                    loaded = json.loads(v_str)
                    if isinstance(loaded, list):
                        return [int(x) for x in loaded]
                    elif isinstance(loaded, int):
                        return [loaded]
                except Exception:
                    pass
            return [int(uid.strip()) for uid in v_str.split(",") if uid.strip()]
        if isinstance(v, (list, tuple, set)):
            return [int(x) for x in v]
        return v

    # -------------------------------------------------------------------------
    # Supabase PostgreSQL
    # -------------------------------------------------------------------------
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_SERVICE_KEY: str = Field(
        default="",
        description="Supabase Service Role Key (bypasses RLS for backend service)"
    )

    # -------------------------------------------------------------------------
    # Tavily Web Research
    # -------------------------------------------------------------------------
    TAVILY_API_KEY: str = Field(default="", description="Tavily Search API Key for web research")

    # -------------------------------------------------------------------------
    # GitHub Publishing
    # -------------------------------------------------------------------------
    GITHUB_TOKEN: str = Field(default="", description="GitHub Fine-Grained Personal Access Token with repo write permissions")
    GITHUB_REPO_OWNER: str = Field(default="arcinterface-dev", description="GitHub username / organization")
    GITHUB_REPO_NAME: str = Field(default="devscrolls", description="Target blog repository name")
    GITHUB_BRANCH: str = Field(default="main", description="Target branch for article publishing")

    @field_validator("GITHUB_REPO_OWNER", mode="before")
    @classmethod
    def sanitize_repo_owner(cls, v):
        if not v or str(v).strip().lower() in ["santhanakrishnanstark", "your-github-username", "owner"]:
            return "arcinterface-dev"
        return str(v).strip()

    @field_validator("GITHUB_REPO_NAME", mode="before")
    @classmethod
    def sanitize_repo_name(cls, v):
        if not v or str(v).strip().lower() in ["myblog", "your-repo-name", "repo"]:
            return "devscrolls"
        return str(v).strip()

    # -------------------------------------------------------------------------
    # Kit (ConvertKit) Integration
    # -------------------------------------------------------------------------
    KIT_API_KEY: str = Field(default="", description="Kit (ConvertKit) API Key")
    KIT_API_SECRET: str = Field(default="tjKJdAp4kMrlXlLCehRdJAX1d50x9DXOS-Ob_UnFW7Q", description="Kit (ConvertKit) API Secret for broadcasts and subscribers")

    def get_provider_for_agent(self, agent_role: str) -> AIProviderType:
        """Returns the configured AI provider for a specific agent role,
        falling back to DEFAULT_AI_PROVIDER if no specific override is set.
        """
        role_map = {
            "analyst": self.ANALYST_AI_PROVIDER,
            "research": self.RESEARCH_AI_PROVIDER,
            "factcheck": self.FACTCHECK_AI_PROVIDER,
            "writer": self.WRITER_AI_PROVIDER,
        }
        override = role_map.get(agent_role)
        return override if override is not None else self.DEFAULT_AI_PROVIDER


settings = Settings()

