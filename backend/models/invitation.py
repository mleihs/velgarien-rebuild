"""Pydantic models for simulation invitations."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class InvitationCreate(BaseModel):
    """Schema for creating an invitation."""

    invited_email: str | None = Field(default=None, max_length=320)
    invited_role: str = Field(default="viewer", pattern=r"^(viewer|editor|admin)$")
    expires_in_hours: int = Field(default=168, ge=1, le=720)


class InvitationResponse(BaseModel):
    """Full invitation response."""

    id: UUID
    simulation_id: UUID
    invited_email: str | None = None
    invite_token: str
    invited_role: str
    invited_by_id: UUID
    expires_at: datetime
    accepted_at: datetime | None = None
    created_at: datetime


class InvitationPublicResponse(BaseModel):
    """Public invitation info (for token validation, no sensitive data)."""

    simulation_name: str
    invited_role: str
    invited_email: str | None = None
    expires_at: datetime
    is_expired: bool = False
    is_accepted: bool = False
