from __future__ import annotations

from app.config import settings


class EmailService:
    @staticmethod
    def send_verification_email(to_email: str, token: str) -> None:
        print(
            f"[EMAIL] Verification email to {to_email}:"
            f" verify at http://localhost:8000/verify?token={token}"
        )

    @staticmethod
    def send_password_reset_email(to_email: str, token: str) -> None:
        print(
            f"[EMAIL] Password reset email to {to_email}:"
            f" reset at http://localhost:8000/reset-password?token={token}"
        )
