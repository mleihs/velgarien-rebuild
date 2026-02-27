"""Epoch CRUD, lifecycle, participation, and team management endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_current_user, get_supabase
from backend.models.common import CurrentUser, PaginatedResponse, PaginationMeta, SuccessResponse
from backend.models.epoch import (
    EpochCreate,
    EpochResponse,
    EpochUpdate,
    ParticipantJoin,
    ParticipantResponse,
    TeamCreate,
    TeamResponse,
)
from backend.services.battle_log_service import BattleLogService
from backend.services.epoch_service import EpochService
from supabase import Client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/epochs", tags=["epochs"])


# ── Epoch CRUD ──────────────────────────────────────────


@router.get("", response_model=PaginatedResponse[EpochResponse])
async def list_epochs(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    status: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List all epochs with optional status filter."""
    data, total = await EpochService.list_epochs(
        supabase, status_filter=status, limit=limit, offset=offset
    )
    return {
        "success": True,
        "data": data,
        "meta": PaginationMeta(count=len(data), total=total, limit=limit, offset=offset),
    }


@router.get("/active", response_model=SuccessResponse[EpochResponse | None])
async def get_active_epoch(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get the currently active epoch (if any)."""
    data = await EpochService.get_active_epoch(supabase)
    return {"success": True, "data": data}


@router.get("/{epoch_id}", response_model=SuccessResponse[EpochResponse])
async def get_epoch(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get a single epoch by ID."""
    data = await EpochService.get(supabase, epoch_id)
    return {"success": True, "data": data}


@router.post("", response_model=SuccessResponse[EpochResponse], status_code=201)
async def create_epoch(
    body: EpochCreate,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Create a new epoch (lobby phase)."""
    data = await EpochService.create(
        supabase,
        user.id,
        name=body.name,
        description=body.description,
        config=body.config.model_dump() if body.config else None,
    )
    return {"success": True, "data": data}


@router.patch("/{epoch_id}", response_model=SuccessResponse[EpochResponse])
async def update_epoch(
    epoch_id: UUID,
    body: EpochUpdate,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Update epoch configuration (lobby phase only)."""
    updates = body.model_dump(exclude_none=True)
    if "config" in updates and updates["config"]:
        cfg = updates["config"]
        updates["config"] = cfg.model_dump() if hasattr(cfg, "model_dump") else cfg
    data = await EpochService.update(supabase, epoch_id, updates)
    return {"success": True, "data": data}


# ── Lifecycle ───────────────────────────────────────────


@router.post("/{epoch_id}/start", response_model=SuccessResponse[EpochResponse])
async def start_epoch(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Start an epoch (lobby -> foundation)."""
    data = await EpochService.start_epoch(supabase, epoch_id)
    await BattleLogService.log_phase_change(
        supabase, epoch_id, 1, "lobby", "foundation"
    )
    return {"success": True, "data": data}


@router.post("/{epoch_id}/advance", response_model=SuccessResponse[EpochResponse])
async def advance_phase(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Advance to next epoch phase."""
    epoch = await EpochService.get(supabase, epoch_id)
    old_status = epoch["status"]
    data = await EpochService.advance_phase(supabase, epoch_id)
    await BattleLogService.log_phase_change(
        supabase, epoch_id, epoch.get("current_cycle", 1), old_status, data["status"]
    )
    return {"success": True, "data": data}


@router.post("/{epoch_id}/cancel", response_model=SuccessResponse[EpochResponse])
async def cancel_epoch(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Cancel an epoch."""
    epoch = await EpochService.get(supabase, epoch_id)
    data = await EpochService.cancel_epoch(supabase, epoch_id)
    await BattleLogService.log_phase_change(
        supabase, epoch_id, epoch.get("current_cycle", 0), epoch["status"], "cancelled"
    )
    return {"success": True, "data": data}


@router.post("/{epoch_id}/resolve-cycle", response_model=SuccessResponse[EpochResponse])
async def resolve_cycle(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Resolve the current cycle (allocate RP, advance cycle counter)."""
    data = await EpochService.resolve_cycle(supabase, epoch_id)
    return {"success": True, "data": data}


# ── Participants ────────────────────────────────────────


@router.get(
    "/{epoch_id}/participants",
    response_model=SuccessResponse[list[ParticipantResponse]],
)
async def list_participants(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """List all participants in an epoch."""
    data = await EpochService.list_participants(supabase, epoch_id)
    return {"success": True, "data": data}


@router.post(
    "/{epoch_id}/participants",
    response_model=SuccessResponse[ParticipantResponse],
    status_code=201,
)
async def join_epoch(
    epoch_id: UUID,
    body: ParticipantJoin,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Join an epoch with a simulation."""
    data = await EpochService.join_epoch(supabase, epoch_id, body.simulation_id)
    return {"success": True, "data": data}


@router.delete("/{epoch_id}/participants/{simulation_id}")
async def leave_epoch(
    epoch_id: UUID,
    simulation_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Leave an epoch (lobby phase only)."""
    await EpochService.leave_epoch(supabase, epoch_id, simulation_id)
    return {"success": True, "data": {"message": "Left epoch."}}


# ── Teams / Alliances ──────────────────────────────────


@router.get(
    "/{epoch_id}/teams",
    response_model=SuccessResponse[list[TeamResponse]],
)
async def list_teams(
    epoch_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """List all teams in an epoch."""
    data = await EpochService.list_teams(supabase, epoch_id)
    return {"success": True, "data": data}


@router.post(
    "/{epoch_id}/teams",
    response_model=SuccessResponse[TeamResponse],
    status_code=201,
)
async def create_team(
    epoch_id: UUID,
    body: TeamCreate,
    simulation_id: UUID = Query(..., description="Your simulation ID"),
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Create a new alliance/team."""
    data = await EpochService.create_team(supabase, epoch_id, simulation_id, body.name)
    epoch = await EpochService.get(supabase, epoch_id)
    await BattleLogService.log_alliance_formed(
        supabase, epoch_id, epoch.get("current_cycle", 0), body.name, [simulation_id]
    )
    return {"success": True, "data": data}


@router.post("/{epoch_id}/teams/{team_id}/join")
async def join_team(
    epoch_id: UUID,
    team_id: UUID,
    simulation_id: UUID = Query(..., description="Your simulation ID"),
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Join an existing team."""
    data = await EpochService.join_team(supabase, epoch_id, team_id, simulation_id)
    return {"success": True, "data": data}


@router.post("/{epoch_id}/teams/leave")
async def leave_team(
    epoch_id: UUID,
    simulation_id: UUID = Query(..., description="Your simulation ID"),
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Leave your current team."""
    data = await EpochService.leave_team(supabase, epoch_id, simulation_id)
    return {"success": True, "data": data}
