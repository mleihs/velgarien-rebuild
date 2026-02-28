"""Unit tests for EpochChatService — message validation, team checks, ready toggle."""

from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from backend.services.epoch_chat_service import EpochChatService

# ── Helpers ───────────────────────────────────────────────

EPOCH_ID = uuid4()
SENDER_ID = uuid4()
SIM_ID = uuid4()
TEAM_ID = uuid4()


def _mock_supabase(
    epoch_data=None,
    participant_data=None,
    insert_data=None,
    sim_data=None,
    select_data=None,
    update_data=None,
    select_count=None,
):
    """Create a mock Supabase client with chained query responses."""
    sb = MagicMock()

    # game_epochs query
    epoch_chain = MagicMock()
    epoch_chain.select.return_value = epoch_chain
    epoch_chain.eq.return_value = epoch_chain
    epoch_chain.limit.return_value = epoch_chain
    epoch_chain.execute.return_value = MagicMock(data=epoch_data)

    # epoch_participants query
    participant_chain = MagicMock()
    participant_chain.select.return_value = participant_chain
    participant_chain.eq.return_value = participant_chain
    participant_chain.limit.return_value = participant_chain
    participant_chain.execute.return_value = MagicMock(data=participant_data)

    # epoch_chat_messages insert
    insert_chain = MagicMock()
    insert_chain.insert.return_value = insert_chain
    insert_chain.execute.return_value = MagicMock(data=insert_data)

    # epoch_chat_messages select (list)
    chat_select_chain = MagicMock()
    chat_select_chain.select.return_value = chat_select_chain
    chat_select_chain.eq.return_value = chat_select_chain
    chat_select_chain.lt.return_value = chat_select_chain
    chat_select_chain.order.return_value = chat_select_chain
    chat_select_chain.limit.return_value = chat_select_chain
    chat_select_chain.in_.return_value = chat_select_chain
    chat_select_chain.execute.return_value = MagicMock(
        data=select_data or [], count=select_count or 0
    )

    # simulations query
    sim_chain = MagicMock()
    sim_chain.select.return_value = sim_chain
    sim_chain.eq.return_value = sim_chain
    sim_chain.limit.return_value = sim_chain
    sim_chain.in_.return_value = sim_chain
    sim_chain.execute.return_value = MagicMock(data=sim_data or [])

    # update chain
    update_chain = MagicMock()
    update_chain.update.return_value = update_chain
    update_chain.eq.return_value = update_chain
    update_chain.execute.return_value = MagicMock(data=update_data)

    def table_side_effect(name):
        if name == "game_epochs":
            return epoch_chain
        if name == "epoch_participants":
            if update_data is not None:
                return update_chain
            return participant_chain
        if name == "epoch_chat_messages":
            if insert_data is not None:
                return insert_chain
            return chat_select_chain
        if name == "simulations":
            return sim_chain
        return MagicMock()

    sb.table.side_effect = table_side_effect
    return sb


# ── send_message tests ────────────────────────────────────


class TestSendMessage:
    @pytest.mark.asyncio
    async def test_rejects_when_epoch_not_found(self):
        sb = _mock_supabase(epoch_data=[])
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello"
            )
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_rejects_when_epoch_completed(self):
        sb = _mock_supabase(epoch_data=[{"id": str(EPOCH_ID), "status": "completed"}])
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello"
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_when_epoch_cancelled(self):
        sb = _mock_supabase(epoch_data=[{"id": str(EPOCH_ID), "status": "cancelled"}])
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello"
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_team_message_without_team_id(self):
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "competition"}],
        )
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello", channel_type="team"
            )
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_team_message_wrong_team(self):
        wrong_team = uuid4()
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "competition"}],
            participant_data=[{"id": "p1", "team_id": str(wrong_team)}],
        )
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello",
                channel_type="team", team_id=TEAM_ID,
            )
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_rejects_team_message_non_participant(self):
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "competition"}],
            participant_data=[],
        )
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.send_message(
                sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello",
                channel_type="team", team_id=TEAM_ID,
            )
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_successful_epoch_message(self):
        msg_data = {
            "id": str(uuid4()),
            "epoch_id": str(EPOCH_ID),
            "sender_id": str(SENDER_ID),
            "sender_simulation_id": str(SIM_ID),
            "channel_type": "epoch",
            "content": "Hello everyone",
            "created_at": "2026-02-28T12:00:00Z",
        }
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "foundation"}],
            insert_data=[msg_data],
            sim_data=[{"id": str(SIM_ID), "name": "Velgarien"}],
        )
        result = await EpochChatService.send_message(
            sb, EPOCH_ID, SENDER_ID, SIM_ID, "Hello everyone"
        )
        assert result["content"] == "Hello everyone"
        assert result["sender_name"] == "Velgarien"


# ── toggle_ready tests ────────────────────────────────────


class TestToggleReady:
    @pytest.mark.asyncio
    async def test_rejects_when_epoch_not_active(self):
        sb = _mock_supabase(epoch_data=[{"id": str(EPOCH_ID), "status": "lobby"}])
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.toggle_ready(sb, EPOCH_ID, SIM_ID, True)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_when_epoch_completed(self):
        sb = _mock_supabase(epoch_data=[{"id": str(EPOCH_ID), "status": "completed"}])
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.toggle_ready(sb, EPOCH_ID, SIM_ID, True)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_non_participant(self):
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "competition"}],
            update_data=[],
        )
        with pytest.raises(HTTPException) as exc:
            await EpochChatService.toggle_ready(sb, EPOCH_ID, SIM_ID, True)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_successful_ready_toggle(self):
        participant_data = {
            "id": "p1",
            "epoch_id": str(EPOCH_ID),
            "simulation_id": str(SIM_ID),
            "cycle_ready": True,
        }
        sb = _mock_supabase(
            epoch_data=[{"id": str(EPOCH_ID), "status": "foundation"}],
            update_data=[participant_data],
        )
        result = await EpochChatService.toggle_ready(sb, EPOCH_ID, SIM_ID, True)
        assert result["cycle_ready"] is True


# ── list_messages tests ───────────────────────────────────


class TestListMessages:
    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        sb = _mock_supabase(select_data=[], select_count=0)
        messages, total = await EpochChatService.list_messages(sb, EPOCH_ID)
        assert messages == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_returns_messages_in_chronological_order(self):
        raw_msgs = [
            {"id": "m2", "sender_simulation_id": str(SIM_ID), "created_at": "2026-02-28T13:00:00Z"},
            {"id": "m1", "sender_simulation_id": str(SIM_ID), "created_at": "2026-02-28T12:00:00Z"},
        ]
        sb = _mock_supabase(
            select_data=raw_msgs,
            select_count=2,
            sim_data=[{"id": str(SIM_ID), "name": "Velgarien"}],
        )
        messages, total = await EpochChatService.list_messages(sb, EPOCH_ID)
        assert total == 2
        # Messages should be reversed (oldest first)
        assert messages[0]["id"] == "m1"
        assert messages[1]["id"] == "m2"

    @pytest.mark.asyncio
    async def test_enriches_sender_names(self):
        raw_msgs = [
            {"id": "m1", "sender_simulation_id": str(SIM_ID), "created_at": "2026-02-28T12:00:00Z"},
        ]
        sb = _mock_supabase(
            select_data=raw_msgs,
            select_count=1,
            sim_data=[{"id": str(SIM_ID), "name": "TestSim"}],
        )
        messages, _ = await EpochChatService.list_messages(sb, EPOCH_ID)
        assert messages[0]["sender_name"] == "TestSim"
