"""Source Extractor & Priority Ranking for Technical Verification.
Classifies external URLs and excerpts into a 4-tier hierarchy to prioritize authoritative documentation
over community forums and personal blogs.
"""
import re
from typing import Tuple
from urllib.parse import urlparse
from app.schemas.research import SourceType

# Priority 1: Official Technical Specifications & Language / Framework Docs
OFFICIAL_DOC_DOMAINS = {
    "react.dev",
    "legacy.reactjs.org",
    "developer.mozilla.org",
    "tc39.es",
    "w3.org",
    "whatwg.org",
    "nodejs.org",
    "python.org",
    "docs.python.org",
    "typescriptlang.org",
    "astro.build",
    "docs.astro.build",
    "nextjs.org",
    "vuejs.org",
    "angular.dev",
    "vite.dev",
    "vitejs.dev",
    "tailwindcss.com",
    "graphql.org",
    "pydantic.dev",
    "fastapi.tiangolo.com",
    "supabase.com",
    "tanstack.com",
    "redux.js.org",
    "prisma.io",
    "postgresql.org",
    "docker.com",
    "kubernetes.io",
}

# Priority 2: Academic Publications & Official Engineering Publications
ACADEMIC_ENGINEERING_DOMAINS = {
    "arxiv.org",
    "acm.org",
    "ieee.org",
    "engineering.fb.com",
    "netflixtechblog.com",
    "aws.amazon.com",
    "cloud.google.com",
    "microsoft.com",
    "uber.com",
    "blog.cloudflare.com",
    "shopify.engineering",
    "github.blog",
    "slack.engineering",
}

# Priority 3: Reputable Technology Publications & Industry Leaders
TECH_PUBLICATION_DOMAINS = {
    "web.dev",
    "infoq.com",
    "smashingmagazine.com",
    "martinfowler.com",
    "css-tricks.com",
    "increment.com",
    "dzone.com",
    "thenewstack.io",
}

# Priority 4: Community Discussions & Developer Forums (Real issues, but NOT formal specs)
COMMUNITY_DOMAINS = {
    "stackoverflow.com",
    "stackexchange.com",
    "reddit.com",
    "dev.to",
    "medium.com",
    "hashnode.com",
    "news.ycombinator.com",
    "quora.com",
}

def classify_source_url(url: str) -> Tuple[SourceType, float]:
    """Analyzes a URL's domain and path to determine its source tier and reliability score.

    Returns:
        (source_type, reliability_score)
    """
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        # Remove 'www.' prefix
        if netloc.startswith("www."):
            netloc = netloc[4:]
    except Exception:
        return "other", 0.60

    # 1. Official Documentation check
    for d in OFFICIAL_DOC_DOMAINS:
        if netloc == d or netloc.endswith(f".{d}"):
            return "official_docs", 1.0

    # Special case: Official GitHub repository specifications / RFCs
    if "github.com" in netloc:
        path = parsed.path.lower()
        if any(sub in path for sub in ["/rfcs", "/spec", "/documentation", "/wiki"]):
            return "official_docs", 0.95
        if "/discussions" in path or "/issues" in path:
            return "community", 0.50

    # 2. Academic / Official Engineering
    for d in ACADEMIC_ENGINEERING_DOMAINS:
        if netloc == d or netloc.endswith(f".{d}"):
            return "academic", 0.85

    # 3. Reputable Tech Publications
    for d in TECH_PUBLICATION_DOMAINS:
        if netloc == d or netloc.endswith(f".{d}"):
            return "tech_publication", 0.70

    # 4. Community Forums
    for d in COMMUNITY_DOMAINS:
        if netloc == d or netloc.endswith(f".{d}"):
            return "community", 0.50

    # Default fallback for reputable domains
    return "other", 0.65

def clean_excerpt(text: str, max_length: int = 400) -> str:
    """Cleans up and normalizes whitespace in an excerpt."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    if len(cleaned) > max_length:
        return cleaned[:max_length - 3] + "..."
    return cleaned
