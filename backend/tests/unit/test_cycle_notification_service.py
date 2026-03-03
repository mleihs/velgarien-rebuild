"""Unit tests for CycleNotificationService — recipient resolution and briefing assembly."""

from __future__ import annotations

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from backend.services.cycle_notification_service import CycleNotificationService

# ── Helpers ────────────────────────────────────────────────────

EPOCH_ID = str(uuid4())
SIM_A = str(uuid4())
SIM_B = str(uuid4())
TEMPLATE_A = str(uuid4())
TEMPLATE_B = str(uuid4())
USER_A = str(uuid4())
USER_B = str(uuid4())


def _make_chain(**kwargs):
    """Create a mock Supabase query chain."""
    c = MagicMock()
    c.select.return_value = c
    c.eq.return_value = c
    c.in_.return_value = c
    c.or_.return_value = c
    c.single.return_value = c
    c.maybe_single.return_value = c
    c.limit.return_value = c
    c.order.return_value = c
    c.range.return_value = c
    c.neq.return_value = c
    for k, v in kwargs.items():
        setattr(c, k, v)
    return c


# ── Recipient Resolution ──────────────────────────────────────


class TestResolveRecipients:
    @pytest.mark.asyncio
    async def test_filters_out_bots(self):
        """Bot participants should not receive email notifications."""
        admin_sb = MagicMock()

        # Participants: 1 human, 1 bot
        participants_chain = _make_chain()
        participants_chain.execute.return_value = MagicMock(data=[
            {
                "simulation_id": SIM_A,
                "is_bot": False,
                "simulations": {"name": "Velgarien", "source_template_id": TEMPLATE_A},
            },
        ])

        members_chain = _make_chain()
        members_chain.execute.return_value = MagicMock(data=[
            {"user_id": USER_A, "simulation_id": TEMPLATE_A},
        ])

        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=[
            {"id": USER_A, "email": "player@test.com"},
        ])

        prefs_chain = _make_chain()
        prefs_chain.execute.return_value = MagicMock(data=[])

        call_count = 0

        def table_side_effect(name):
            nonlocal call_count
            call_count += 1
            if name == "epoch_participants":
                return participants_chain
            if name == "simulation_members":
                return members_chain
            if name == "notification_preferences":
                return prefs_chain
            return _make_chain()

        admin_sb.table.side_effect = table_side_effect
        admin_sb.rpc.return_value = rpc_mock

        recipients = await CycleNotificationService._resolve_recipients(
            admin_sb, EPOCH_ID, notification_type="cycle_resolved",
        )

        assert len(recipients) == 1
        assert recipients[0]["email"] == "player@test.com"

    @pytest.mark.asyncio
    async def test_respects_notification_preference_opt_out(self):
        """Users who opt out of cycle_resolved should not receive cycle emails."""
        admin_sb = MagicMock()

        participants_chain = _make_chain()
        participants_chain.execute.return_value = MagicMock(data=[
            {
                "simulation_id": SIM_A,
                "is_bot": False,
                "simulations": {"name": "Velgarien", "source_template_id": TEMPLATE_A},
            },
        ])

        members_chain = _make_chain()
        members_chain.execute.return_value = MagicMock(data=[
            {"user_id": USER_A, "simulation_id": TEMPLATE_A},
        ])

        rpc_mock = MagicMock()
        rpc_mock.execute.return_value = MagicMock(data=[
            {"id": USER_A, "email": "player@test.com"},
        ])

        prefs_chain = _make_chain()
        prefs_chain.execute.return_value = MagicMock(data=[
            {"user_id": USER_A, "cycle_resolved": False, "phase_changed": True, "epoch_completed": True, "email_locale": "en"},
        ])

        def table_side_effect(name):
            if name == "epoch_participants":
                return participants_chain
            if name == "simulation_members":
                return members_chain
            if name == "notification_preferences":
                return prefs_chain
            return _make_chain()

        admin_sb.table.side_effect = table_side_effect
        admin_sb.rpc.return_value = rpc_mock

        recipients = await CycleNotificationService._resolve_recipients(
            admin_sb, EPOCH_ID, notification_type="cycle_resolved",
        )

        assert len(recipients) == 0

    @pytest.mark.asyncio
    async def test_empty_participants_returns_empty(self):
        """No participants → no recipients."""
        admin_sb = MagicMock()

        participants_chain = _make_chain()
        participants_chain.execute.return_value = MagicMock(data=[])

        admin_sb.table.return_value = participants_chain

        recipients = await CycleNotificationService._resolve_recipients(
            admin_sb, EPOCH_ID,
        )

        assert recipients == []


# ── Player Briefing Data ──────────────────────────────────────


class TestBuildPlayerBriefing:
    @pytest.mark.asyncio
    async def test_returns_expected_keys(self):
        """Briefing data should contain all expected fields."""
        admin_sb = MagicMock()

        # Current scores
        current_chain = _make_chain()
        current_chain.execute.return_value = MagicMock(data=[
            {
                "simulation_id": SIM_A,
                "composite_score": 72.3,
                "stability_score": 60.0,
                "influence_score": 45.0,
                "sovereignty_score": 88.0,
                "diplomatic_score": 55.0,
                "military_score": 30.0,
            },
        ])

        # Previous scores (cycle 0 → no previous)
        prev_chain = _make_chain()
        prev_chain.execute.return_value = MagicMock(data=[])

        # Operatives
        ops_chain = _make_chain()
        ops_chain.execute.return_value = MagicMock(data=[
            {"operative_type": "spy", "status": "active"},
            {"operative_type": "guardian", "status": "active"},
            {"operative_type": "saboteur", "status": "success"},
        ])

        # RP
        rp_chain = _make_chain()
        rp_chain.execute.return_value = MagicMock(data={"resource_points": 18})

        # Battle log
        log_chain = _make_chain()
        log_chain.execute.return_value = MagicMock(data=[
            {"narrative": "An operative was detected.", "event_type": "detection"},
        ])

        call_count = {"scores": 0}

        def table_side_effect(name):
            if name == "epoch_scores":
                call_count["scores"] += 1
                # First 2 calls: current scores (ordered + prev ordered)
                # Then prev detail
                if call_count["scores"] <= 2:
                    return current_chain
                return prev_chain
            if name == "operative_missions":
                return ops_chain
            if name == "epoch_participants":
                return rp_chain
            if name == "battle_log":
                return log_chain
            return _make_chain()

        admin_sb.table.side_effect = table_side_effect

        briefing = await CycleNotificationService._build_player_briefing(
            admin_sb, EPOCH_ID, SIM_A, 1, "Test Epoch", "competition",
        )

        assert briefing["epoch_name"] == "Test Epoch"
        assert briefing["cycle_number"] == 1
        assert briefing["rank"] == 1
        assert briefing["composite"] == 72.3
        assert len(briefing["dimensions"]) == 5
        assert briefing["active_ops"] == 2  # spy + guardian
        assert briefing["success_ops"] == 1  # saboteur
        assert briefing["guardians"] == 1
        assert briefing["rp_balance"] == 18
        assert len(briefing["public_events"]) == 1


# ── Send Methods ──────────────────────────────────────────────


class TestSendCycleNotifications:
    @pytest.mark.asyncio
    async def test_skips_when_smtp_not_configured(self):
        """Should return False when SMTP is not configured."""
        with patch("backend.services.email_service.settings") as mock_settings:
            mock_settings.smtp_host = ""
            mock_settings.smtp_user = ""
            mock_settings.smtp_password = ""

            from backend.services.email_service import EmailService

            result = await EmailService.send(
                "test@example.com", "Test Subject", "<p>Test</p>"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_via_smtp(self):
        """Should return True when SMTP send succeeds."""
        from backend.services.email_service import EmailService

        with patch.object(EmailService, "_send_sync", return_value=True) as mock_sync:
            with patch("backend.services.email_service.settings") as mock_settings:
                mock_settings.smtp_host = "mail.example.com"
                mock_settings.smtp_user = "user"
                mock_settings.smtp_password = "pass"

                result = await EmailService.send(
                    "test@example.com", "Test Subject", "<p>Test</p>"
                )

                assert result is True
                mock_sync.assert_called_once()
