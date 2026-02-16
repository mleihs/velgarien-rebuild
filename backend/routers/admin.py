"""Admin endpoints for platform-wide operations."""

from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_supabase
from backend.models.common import CurrentUser, SuccessResponse
from backend.services.materialized_view_service import MaterializedViewService
from supabase import Client

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
)


@router.post("/refresh-views", response_model=SuccessResponse[dict])
async def refresh_views(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Refresh all materialized views. Requires authenticated user."""
    results = await MaterializedViewService.refresh_all(supabase)
    return {"success": True, "data": results}
