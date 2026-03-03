"""Unit tests for EmailService — SMTP config validation and message construction."""

from unittest.mock import MagicMock, patch

import pytest

from backend.services.email_service import EmailService


class TestEmailServiceConfig:
    def test_is_configured_false_when_empty(self):
        with patch("backend.services.email_service.settings") as mock_settings:
            mock_settings.smtp_host = ""
            mock_settings.smtp_user = ""
            mock_settings.smtp_password = ""
            assert EmailService._is_configured() is False

    def test_is_configured_false_when_partial(self):
        with patch("backend.services.email_service.settings") as mock_settings:
            mock_settings.smtp_host = "mail.example.com"
            mock_settings.smtp_user = ""
            mock_settings.smtp_password = "pass"
            assert EmailService._is_configured() is False

    def test_is_configured_true_when_complete(self):
        with patch("backend.services.email_service.settings") as mock_settings:
            mock_settings.smtp_host = "mail.example.com"
            mock_settings.smtp_user = "user"
            mock_settings.smtp_password = "pass"
            assert EmailService._is_configured() is True


class TestEmailServiceSendSync:
    @patch("backend.services.email_service.smtplib.SMTP_SSL")
    @patch("backend.services.email_service.settings")
    def test_successful_send(self, mock_settings, mock_smtp_class):
        mock_settings.smtp_host = "mail.example.com"
        mock_settings.smtp_port = 465
        mock_settings.smtp_user = "user"
        mock_settings.smtp_password = "pass"
        mock_settings.smtp_from = "Test <test@example.com>"

        mock_server = MagicMock()
        mock_smtp_class.return_value.__enter__ = MagicMock(return_value=mock_server)
        mock_smtp_class.return_value.__exit__ = MagicMock(return_value=False)

        result = EmailService._send_sync("to@example.com", "Test Subject", "<h1>Hi</h1>")
        assert result is True
        mock_server.login.assert_called_once_with("user", "pass")
        mock_server.sendmail.assert_called_once()

    @patch("backend.services.email_service.smtplib.SMTP_SSL")
    @patch("backend.services.email_service.settings")
    def test_smtp_error_returns_false(self, mock_settings, mock_smtp_class):
        import smtplib

        mock_settings.smtp_host = "mail.example.com"
        mock_settings.smtp_port = 465
        mock_settings.smtp_user = "user"
        mock_settings.smtp_password = "pass"
        mock_settings.smtp_from = "Test <test@example.com>"

        mock_smtp_class.side_effect = smtplib.SMTPException("Auth failed")

        result = EmailService._send_sync("to@example.com", "Test", "<p>Hi</p>")
        assert result is False

    @patch("backend.services.email_service.smtplib.SMTP_SSL")
    @patch("backend.services.email_service.settings")
    def test_timeout_returns_false(self, mock_settings, mock_smtp_class):
        mock_settings.smtp_host = "mail.example.com"
        mock_settings.smtp_port = 465
        mock_settings.smtp_user = "user"
        mock_settings.smtp_password = "pass"
        mock_settings.smtp_from = "Test <test@example.com>"

        mock_smtp_class.side_effect = TimeoutError("Connection timed out")

        result = EmailService._send_sync("to@example.com", "Test", "<p>Hi</p>")
        assert result is False


class TestEmailServiceSendAsync:
    @pytest.mark.asyncio
    async def test_send_returns_false_when_not_configured(self):
        with patch("backend.services.email_service.settings") as mock_settings:
            mock_settings.smtp_host = ""
            mock_settings.smtp_user = ""
            mock_settings.smtp_password = ""
            result = await EmailService.send("to@example.com", "Test", "<p>Hi</p>")
            assert result is False

    @pytest.mark.asyncio
    async def test_send_delegates_to_send_sync(self):
        with (
            patch("backend.services.email_service.settings") as mock_settings,
            patch.object(EmailService, "_send_sync", return_value=True) as mock_sync,
        ):
            mock_settings.smtp_host = "mail.example.com"
            mock_settings.smtp_user = "user"
            mock_settings.smtp_password = "pass"

            result = await EmailService.send("to@example.com", "Test", "<p>Hi</p>")
            assert result is True
            mock_sync.assert_called_once_with("to@example.com", "Test", "<p>Hi</p>")
