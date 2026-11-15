"""Health check endpoint for Render monitoring and uptime checks.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.config.settings import settings

router = APIRouter(tags=["Health"])

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    default_ai_provider: str
    gemini_configured: bool
    anthropic_configured: bool

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns application health and configured AI provider status."""
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        default_ai_provider=settings.DEFAULT_AI_PROVIDER,
        gemini_configured=bool(settings.GEMINI_API_KEY),
        anthropic_configured=bool(settings.ANTHROPIC_API_KEY)
    )

