"""Pydantic models for simulation settings."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

# Encryption is handled at the application level via setting_key convention.
# Keys whose name *ends with* any of these suffixes are stored encrypted and masked.
ENCRYPTED_KEY_SUFFIXES = (
    "api_key",
    "secret_key",
    "access_token",
    "encryption_key",
    "webhook_secret",
)


def is_sensitive_key(setting_key: str) -> bool:
    """Check if a setting key should be encrypted/masked."""
    return any(setting_key.endswith(suffix) for suffix in ENCRYPTED_KEY_SUFFIXES)


class SettingCreate(BaseModel):
    """Schema for creating/upserting a setting."""

    category: str = Field(..., min_length=1, max_length=50)
    setting_key: str = Field(..., min_length=1, max_length=100)
    setting_value: dict | str | int | float | bool | list


class SettingUpdate(BaseModel):
    """Schema for updating a setting value."""

    setting_value: dict | str | int | float | bool | list


class SettingResponse(BaseModel):
    """Full setting response."""

    id: UUID
    simulation_id: UUID
    category: str
    setting_key: str
    setting_value: dict | str | int | float | bool | list | None = None
    updated_by_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
