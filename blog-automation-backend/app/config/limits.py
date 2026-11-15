"""Budget limits and operational safeguards to enforce strictly zero-cost operations on free tiers.
"""

# Maximum complete articles generated and published per calendar month
MONTHLY_ARTICLE_LIMIT: int = 5

# Maximum Tavily research API search credits allowed per single article
RESEARCH_CREDITS_PER_ARTICLE: int = 120

# Hard ceiling for Tavily research search credits per calendar month (Free tier has 1000)
MONTHLY_RESEARCH_CREDITS_CEILING: int = 800

# Maximum internal editorial self-correction iterations before prompting author
MAX_WRITER_CORRECTION_CYCLES: int = 2

# Maximum clarification interaction rounds when a voice idea is ambiguous
MAX_CLARIFICATION_CYCLES: int = 3

# Maximum automated generation attempts before marking a job failed
MAX_GENERATION_ATTEMPTS: int = 3

# Cache TTL for Tavily search results (in days) to save credits during article revisions
RESEARCH_CACHE_TTL_DAYS: int = 7

# Timeout in minutes before considering an active processing job stale
JOB_STALE_TIMEOUT_MINUTES: int = 30

