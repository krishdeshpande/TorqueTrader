"""
Redis client — real Redis in production, fakeredis fallback in dev/test.

If REDIS_URL is set in the environment, a real redis.Redis connection is
used.  Otherwise (local dev, CI without Redis), fakeredis provides an
in-process replacement so the app still starts and tests pass.
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)

if settings.REDIS_URL:
    import redis as _redis
    redis_client = _redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    logger.info("Redis: connected to %s", settings.REDIS_URL)
else:
    import fakeredis
    redis_client = fakeredis.FakeRedis(decode_responses=True)
    logger.warning(
        "Redis: REDIS_URL not set — using in-memory fakeredis. "
        "OTP state will NOT persist across restarts. Set REDIS_URL for production."
    )


def get_redis():
    """FastAPI dependency — yields the shared Redis client."""
    return redis_client
