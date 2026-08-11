from datetime import datetime, timedelta, timezone

from app.config import settings


class TokenBlacklist:
    """In-memory blacklist for revoked refresh tokens.

    This is intentionally simple for development and local testing.
    """

    _tokens: set[str] = set()

    @classmethod
    def add(cls, token: str) -> None:
        cls._tokens.add(token)

    @classmethod
    def contains(cls, token: str) -> bool:
        return token in cls._tokens

    @classmethod
    def clear(cls) -> None:
        cls._tokens.clear()
