"""Pydantic models for agent aptitudes."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

OperativeType = Literal[
    "spy", "guardian", "saboteur", "propagandist", "infiltrator", "assassin"
]

OPERATIVE_TYPES: list[str] = [
    "spy", "guardian", "saboteur", "propagandist", "infiltrator", "assassin"
]

APTITUDE_BUDGET = 36
APTITUDE_MIN = 3
APTITUDE_MAX = 9


class AptitudeSet(BaseModel):
    """Batch aptitude assignment — one level per operative type, budget = 36."""

    spy: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)
    guardian: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)
    saboteur: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)
    propagandist: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)
    infiltrator: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)
    assassin: int = Field(6, ge=APTITUDE_MIN, le=APTITUDE_MAX)

    @model_validator(mode="after")
    def validate_budget(self) -> "AptitudeSet":
        total = (
            self.spy + self.guardian + self.saboteur
            + self.propagandist + self.infiltrator + self.assassin
        )
        if total != APTITUDE_BUDGET:
            msg = f"Aptitude budget must equal {APTITUDE_BUDGET}, got {total}."
            raise ValueError(msg)
        return self


class AptitudeResponse(BaseModel):
    """Single aptitude row response."""

    id: UUID
    agent_id: UUID
    simulation_id: UUID
    operative_type: str
    aptitude_level: int
    created_at: datetime
    updated_at: datetime


class DraftRequest(BaseModel):
    """Request to lock in a draft roster."""

    agent_ids: list[UUID] = Field(..., min_length=1, max_length=8)
