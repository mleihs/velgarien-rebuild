"""Shared email service — sends HTML emails via SMTP SSL.

Wraps smtplib.SMTP_SSL in asyncio.to_thread() for async compatibility.
Falls back gracefully if SMTP config is missing (logs warning, returns False).
"""

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Sends HTML emails via SMTP SSL (port 465)."""

    @staticmethod
    def _is_configured() -> bool:
        return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)

    @staticmethod
    def _send_sync(to: str, subject: str, html_body: str) -> bool:
        """Synchronous SMTP SSL send."""
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.smtp_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from, [to], msg.as_string())
            logger.info("Email sent to %s: %s", to, subject[:60])
            return True
        except smtplib.SMTPException as e:
            logger.error("SMTP error sending to %s: %s", to, e)
            return False
        except (TimeoutError, OSError) as e:
            logger.error("Connection error sending to %s: %s", to, e)
            return False

    @classmethod
    async def send(cls, to: str, subject: str, html_body: str) -> bool:
        """Send an HTML email asynchronously via SMTP SSL.

        Returns True on success, False on failure or missing config.
        """
        if not cls._is_configured():
            logger.warning("SMTP not configured, skipping email to %s", to)
            return False

        return await asyncio.to_thread(cls._send_sync, to, subject, html_body)
