"""DevScrolls Personal AI Blog Automation Platform — FastAPI Application Factory.
Provides webhook endpoints, background job trigger endpoints, and health monitoring.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.telegram_webhook import router as webhook_router
from app.api.worker import router as worker_router
from app.config.settings import settings
from app.workers.recovery import run_startup_recovery
import app.ai.agents.stage_handlers  # Registers AI agent pipeline stage handlers

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("blog-automation-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: handles cold-start initialization, recovery, and clean shutdown."""
    logger.info(
        f"Starting DevScrolls Blog Automation Backend v{settings.APP_VERSION} "
        f"[Env: {settings.APP_ENV}] [Default AI Provider: {settings.DEFAULT_AI_PROVIDER.upper()}]"
    )

    # 1. Run crash and cold-start recovery check on startup
    try:
        await run_startup_recovery()
    except Exception as e:
        logger.warning(f"Startup recovery encountered an error (continuing startup): {e}")

    yield

    logger.info("DevScrolls Blog Automation Backend shutting down gracefully.")

def create_app() -> FastAPI:
    """Creates and configures the FastAPI application instance."""
    app = FastAPI(
        title="DevScrolls Blog Automation API",
        description=(
            "Telegram-powered multi-agent AI blogging automation backend for DevScrolls. "
            "Supports seamless zero-cost operation via Gemini Free and pluggable upgrade to Claude."
        ),
        version=settings.APP_VERSION,
        lifespan=lifespan
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://devscrolls.dev", "http://localhost:4321"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(health_router)
    app.include_router(webhook_router)
    app.include_router(worker_router)

    return app

app = create_app()
