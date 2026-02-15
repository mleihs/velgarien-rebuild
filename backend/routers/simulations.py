from uuid import UUID

from fastapi import APIRouter, Depends, Query

from backend.dependencies import get_current_user, get_supabase, require_role
from backend.models.common import (
    CurrentUser,
    PaginatedResponse,
    PaginationMeta,
    SuccessResponse,
)
from backend.models.simulation import (
    SimulationCreate,
    SimulationDashboardResponse,
    SimulationResponse,
    SimulationUpdate,
)
from backend.services.simulation_service import SimulationService
from supabase import Client

router = APIRouter(prefix="/api/v1/simulations", tags=["simulations"])

_service = SimulationService()


@router.get("", response_model=PaginatedResponse[SimulationResponse])
async def list_simulations(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    status: str | None = Query(default=None, description="Filter by simulation status"),
    limit: int = Query(default=25, ge=1, le=100, description="Max results per page"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
) -> dict:
    """List all simulations the current user is a member of."""
    data, total = await _service.list_simulations(
        supabase=supabase,
        user_id=user.id,
        status_filter=status,
        limit=limit,
        offset=offset,
    )

    return {
        "success": True,
        "data": data,
        "meta": PaginationMeta(
            count=len(data),
            total=total,
            limit=limit,
            offset=offset,
        ),
    }


@router.post("", response_model=SuccessResponse[SimulationResponse], status_code=201)
async def create_simulation(
    body: SimulationCreate,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Create a new simulation. Auto-generates slug if not provided. Creator becomes owner."""
    simulation = await _service.create_simulation(
        supabase=supabase,
        user_id=user.id,
        data=body,
    )

    return {"success": True, "data": simulation}


@router.get("/{simulation_id}", response_model=SuccessResponse[SimulationDashboardResponse])
async def get_simulation(
    simulation_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get a single simulation with aggregated counts from the dashboard view."""
    simulation = await _service.get_simulation(
        supabase=supabase,
        simulation_id=simulation_id,
    )

    return {"success": True, "data": simulation}


@router.put("/{simulation_id}", response_model=SuccessResponse[SimulationResponse])
async def update_simulation(
    simulation_id: UUID,
    body: SimulationUpdate,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("admin")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Update a simulation. Requires admin role or higher."""
    simulation = await _service.update_simulation(
        supabase=supabase,
        simulation_id=simulation_id,
        data=body,
    )

    return {"success": True, "data": simulation}


@router.delete("/{simulation_id}", response_model=SuccessResponse[SimulationResponse])
async def delete_simulation(
    simulation_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("owner")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Soft-delete a simulation. Requires owner role."""
    simulation = await _service.delete_simulation(
        supabase=supabase,
        simulation_id=simulation_id,
    )

    return {"success": True, "data": simulation}
