"""Pydantic models for epoch chat messages and ready signals."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class EpochChatMessageCreate(BaseModel):
    """Schema for sending a chat message."""

    content: str = Field(..., min_length=1, max_length=2000)
    channel_type: Literal["epoch", "team"] = "epoch"
    team_id: UUID | None = None
    simulation_id: UUID


class EpochChatMessageResponse(BaseModel):
    """Chat message response with sender info."""

    id: UUID
    epoch_id: UUID
    sender_id: UUID
    sender_simulation_id: UUID
    channel_type: str
    team_id: UUID | None = None
    content: str
    created_at: datetime
    sender_name: str | None = None


class ReadySignal(BaseModel):
    """Schema for toggling cycle ready state."""

    simulation_id: UUID
    ready: bool
