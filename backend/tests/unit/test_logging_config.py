"""Unit tests for logging_config.py — structlog setup, renderer selection, noisy logger suppression."""

import logging
from unittest.mock import patch

import structlog


class TestSetupLogging:
    def test_configures_structlog(self):
        """Verify structlog.configure() is called with expected processors."""
        with patch("backend.logging_config.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "json"

            from backend.logging_config import setup_logging

            setup_logging()

            config = structlog.get_config()
            processors = config["processors"]
            processor_types = [type(p) for p in processors]
            # Core processors must be present
            assert structlog.stdlib.ExtraAdder in processor_types
            # wrap_for_formatter is a function, check by identity
            assert structlog.stdlib.ProcessorFormatter.wrap_for_formatter in processors

    def test_json_renderer_when_log_format_json(self):
        """When log_format='json', JSONRenderer should be used in stdlib formatter."""
        with patch("backend.logging_config.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "json"

            from backend.logging_config import setup_logging

            setup_logging()

            # Check the stdlib handler's formatter uses JSONRenderer
            root = logging.getLogger()
            handler = root.handlers[-1]
            formatter = handler.formatter
            # The last processor in the formatter chain should be JSONRenderer
            renderer = formatter.processors[-1]
            assert isinstance(renderer, structlog.processors.JSONRenderer)

    def test_console_renderer_when_tty(self):
        """When log_format='auto' and stderr is a TTY, ConsoleRenderer should be used."""
        with (
            patch("backend.logging_config.settings") as mock_settings,
            patch("backend.logging_config.sys") as mock_sys,
        ):
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "auto"
            mock_sys.stderr.isatty.return_value = True

            from backend.logging_config import setup_logging

            setup_logging()

            root = logging.getLogger()
            handler = root.handlers[-1]
            formatter = handler.formatter
            renderer = formatter.processors[-1]
            assert isinstance(renderer, structlog.dev.ConsoleRenderer)

    def test_noisy_loggers_suppressed(self):
        """httpx, httpcore, supabase, hpack should be at WARNING level."""
        with patch("backend.logging_config.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.log_format = "json"

            from backend.logging_config import setup_logging

            setup_logging()

            for name in ("httpx", "httpcore", "supabase", "hpack"):
                assert logging.getLogger(name).getEffectiveLevel() >= logging.WARNING

    def test_log_level_from_settings(self):
        """Root logger level should match settings.log_level."""
        with patch("backend.logging_config.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.log_format = "json"

            from backend.logging_config import setup_logging

            setup_logging()

            root = logging.getLogger()
            assert root.level == logging.DEBUG

    def test_extra_adder_in_foreign_pre_chain(self):
        """ExtraAdder must be in the foreign_pre_chain so stdlib extra={} fields propagate."""
        with patch("backend.logging_config.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.log_format = "json"

            from backend.logging_config import setup_logging

            setup_logging()

        root = logging.getLogger()
        handler = root.handlers[-1]
        formatter = handler.formatter
        # foreign_pre_chain contains the processors for stdlib-originated logs
        pre_chain_types = [type(p) for p in formatter.foreign_pre_chain]
        assert structlog.stdlib.ExtraAdder in pre_chain_types
