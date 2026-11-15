"""
Deployment Monitor for DevScrolls.
Monitors deployment pipelines (Vercel / GitHub Pages) by verifying that the live
canonical article URL returns an HTTP 200 OK status.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class DeploymentMonitor:
    """Verifies that an article is live on the public DevScrolls blog."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.BASE_BLOG_URL

    async def verify_deployment(
        self,
        slug: str,
        max_attempts: int = 12,
        initial_delay_seconds: float = 10.0,
        poll_interval_seconds: float = 10.0
    ) -> Dict[str, Any]:
        """
        Polls the public blog endpoint to check if the new article is live.

        Args:
            slug: URL slug of the article.
            max_attempts: Maximum polling checks before concluding still propagating.
            initial_delay_seconds: Seconds to wait before first check (build pipeline warmup).
            poll_interval_seconds: Seconds between subsequent requests.

        Returns:
            Dict containing is_live, status_code, attempts, and article_url.
        """
        article_url = f"{self.base_url.rstrip('/')}/articles/{slug}/"
        logger.info(f"Monitoring deployment for {article_url} (warmup: {initial_delay_seconds}s)...")

        # Initial warmup sleep for CI/CD build to start
        if initial_delay_seconds > 0:
            await asyncio.sleep(initial_delay_seconds)

        attempts = 0
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            while attempts < max_attempts:
                attempts += 1
                try:
                    resp = await client.get(
                        article_url,
                        headers={"User-Agent": "DevScrolls-Deployment-Monitor/1.0"}
                    )
                    logger.debug(f"Check {attempts}/{max_attempts} for {article_url} returned status {resp.status_code}")

                    if resp.status_code == 200:
                        logger.info(f"Article is LIVE and verified at {article_url} (attempt {attempts})")
                        return {
                            "is_live": True,
                            "status_code": 200,
                            "attempts": attempts,
                            "article_url": article_url,
                            "message": "Deployment confirmed. Live URL is responding with 200 OK."
                        }
                    elif resp.status_code == 404:
                        # Build still propagating
                        pass
                    else:
                        logger.warning(f"Unexpected HTTP status {resp.status_code} during deployment check.")

                except Exception as e:
                    logger.debug(f"Network error probing {article_url} on attempt {attempts}: {e}")

                if attempts < max_attempts:
                    await asyncio.sleep(poll_interval_seconds)

        # Reached max attempts
        logger.info(f"Deployment monitoring completed: article committed but not yet live after {attempts} checks.")
        return {
            "is_live": False,
            "status_code": 404,
            "attempts": attempts,
            "article_url": article_url,
            "message": "Commit succeeded. Deployment is still propagating through the build pipeline."
        }


deployment_monitor = DeploymentMonitor()
