from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_supabase
from backend.models.common import CurrentUser, SuccessResponse
from backend.models.user import MembershipInfo, UserWithMemberships
from backend.services.member_service import MemberService
from supabase import Client

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=SuccessResponse[UserWithMemberships])
async def get_me(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get the current user's profile with simulation memberships."""
    rows = await MemberService.get_user_memberships(supabase, user.id)

    memberships = []
    for row in rows:
        sim_data = row.get("simulations") or {}
        memberships.append(
            MembershipInfo(
                simulation_id=row["simulation_id"],
                simulation_name=sim_data.get("name", ""),
                simulation_slug=sim_data.get("slug", ""),
                member_role=row["member_role"],
            )
        )

    user_data = UserWithMemberships(
        id=user.id,
        email=user.email,
        memberships=memberships,
    )

    return {"success": True, "data": user_data}
