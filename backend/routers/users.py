from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_supabase
from backend.models.common import CurrentUser, SuccessResponse
from backend.models.user import MembershipInfo, UserWithMemberships
from supabase import Client

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=SuccessResponse[UserWithMemberships])
async def get_me(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get the current user's profile with simulation memberships."""
    # Query memberships joined with simulation names
    response = (
        supabase.table("simulation_members")
        .select("simulation_id, member_role, simulations(name)")
        .eq("user_id", str(user.id))
        .execute()
    )

    memberships = []
    for row in response.data or []:
        sim_name = ""
        if row.get("simulations"):
            sim_name = row["simulations"].get("name", "")

        memberships.append(
            MembershipInfo(
                simulation_id=row["simulation_id"],
                simulation_name=sim_name,
                member_role=row["member_role"],
            )
        )

    user_data = UserWithMemberships(
        id=user.id,
        email=user.email,
        memberships=memberships,
    )

    return {"success": True, "data": user_data}
