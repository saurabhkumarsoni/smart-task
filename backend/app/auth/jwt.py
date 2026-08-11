from datetime import datetime
from datetime import timedelta
from datetime import timezone

import jwt

from app.config import settings


def create_access_token(
    subject: str,
) -> str:

    now = datetime.now(timezone.utc)

    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "type": "access",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(
    subject: str,
) -> str:

    now = datetime.now(timezone.utc)

    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_verification_token(
    subject: str,
) -> str:

    now = datetime.now(timezone.utc)

    expire = now + timedelta(days=1)

    payload = {
        "sub": subject,
        "type": "verification",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_password_reset_token(
    subject: str,
) -> str:

    now = datetime.now(timezone.utc)

    expire = now + timedelta(hours=1)

    payload = {
        "sub": subject,
        "type": "password_reset",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict:

    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
