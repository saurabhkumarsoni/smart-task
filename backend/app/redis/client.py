import os
from typing import Any

try:
    from redis import Redis
except ModuleNotFoundError:  # pragma: no cover - exercised in tests via import patching
    Redis = None  # type: ignore[assignment]


def get_redis_client() -> Any | None:
    if Redis is None:
        return None

    return Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
    )
