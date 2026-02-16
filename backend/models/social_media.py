"""Pydantic models for social media write operations."""

from pydantic import BaseModel, Field


class TransformPostRequest(BaseModel):
    """Request to transform a social media post."""

    transformation_type: str = Field(
        default="dystopian",
        pattern=r"^(dystopian|propaganda|surveillance)$",
    )


class AnalyzeSentimentRequest(BaseModel):
    """Request to analyze post sentiment."""

    detail_level: str = Field(default="detailed", pattern=r"^(detailed|quick)$")


class GenerateReactionsRequest(BaseModel):
    """Request to generate agent reactions to a post."""

    agent_ids: list[str] | None = None
    max_agents: int = Field(default=5, ge=1, le=20)
