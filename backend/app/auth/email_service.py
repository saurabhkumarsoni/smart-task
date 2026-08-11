from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.config import settings


class EmailService:
    @staticmethod
    def _send_email(to_email: str, subject: str, body: str) -> None:
        if not settings.SMTP_HOST:
            print(
                f"[EMAIL] SMTP not configured. To: {to_email} | Subject: {subject} | Body: {body}"
            )
            return

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        message.set_content(body)

        try:
            if settings.SMTP_USE_SSL:
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as client:
                    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                        client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                    client.send_message(message)
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as client:
                    if settings.SMTP_USE_STARTTLS:
                        client.starttls()
                    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                        client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                    client.send_message(message)
        except Exception as exc:
            print(
                f"[EMAIL] SMTP send failed ({exc}). To: {to_email} | Subject: {subject} | Body: {body}"
            )

    @staticmethod
    def send_verification_email(to_email: str, token: str) -> None:
        verify_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        EmailService._send_email(
            to_email,
            "Verify your SmartTask account",
            f"Welcome to SmartTask. Verify your email using this link: {verify_link}",
        )

    @staticmethod
    def send_password_reset_email(to_email: str, token: str) -> None:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        EmailService._send_email(
            to_email,
            "Reset your SmartTask password",
            f"You requested a password reset. Use this link to continue: {reset_link}",
        )
