"""Pydantic models for notification preferences."""

from pydantic import BaseModel, Field


class NotificationPreferencesUpdate(BaseModel):
    """Request body for updating notification preferences."""

    cycle_resolved: bool = Field(True, description="Email when a cycle resolves")
    phase_changed: bool = Field(True, description="Email when epoch phase changes")
    epoch_completed: bool = Field(True, description="Email when epoch completes")
    email_locale: str = Field("en", description="Locale for email content", pattern="^(en|de)$")


class NotificationPreferencesResponse(BaseModel):
    """Response model for notification preferences."""

    cycle_resolved: bool
    phase_changed: bool
    epoch_completed: bool
    email_locale: str
