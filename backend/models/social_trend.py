"""Pydantic models for social trends write operations."""

from pydantic import BaseModel, Field


class SocialTrendCreate(BaseModel):
    """Schema for creating a social trend manually."""

    name: str = Field(..., min_length=1, max_length=255)
    platform: str = Field(..., min_length=1)
    raw_data: dict | None = None
    volume: int = Field(default=0, ge=0)
    url: str | None = None
    relevance_score: float | None = Field(default=None, ge=0, le=10)
    sentiment: str | None = None


class FetchTrendsRequest(BaseModel):
    """Request to fetch trends from external source."""

    source: str = Field(..., pattern=r"^(guardian|newsapi)$")
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=50)


class TransformTrendRequest(BaseModel):
    """Request to transform a trend into simulation context."""

    trend_id: str


class IntegrateTrendRequest(BaseModel):
    """Request to integrate a transformed trend as an event."""

    trend_id: str
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    event_type: str | None = None
    impact_level: int = Field(default=5, ge=1, le=10)
    tags: list[str] = Field(default_factory=list)
