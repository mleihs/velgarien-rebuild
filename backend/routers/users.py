from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user, get_supabase
from backend.models.common import CurrentUser, SuccessResponse
from backend.models.notification import NotificationPreferencesResponse, NotificationPreferencesUpdate
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


@router.get(
    "/me/notification-preferences",
    response_model=SuccessResponse[NotificationPreferencesResponse],
)
async def get_notification_preferences(
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Get the current user's notification preferences.

    Returns defaults if no preferences have been saved yet.
    """
    resp = (
        supabase.table("notification_preferences")
        .select("cycle_resolved, phase_changed, epoch_completed, email_locale")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )

    if resp.data:
        prefs = resp.data
    else:
        # Return defaults
        prefs = {
            "cycle_resolved": True,
            "phase_changed": True,
            "epoch_completed": True,
            "email_locale": "en",
        }

    return {"success": True, "data": prefs}


@router.post(
    "/me/notification-preferences",
    response_model=SuccessResponse[NotificationPreferencesResponse],
)
async def update_notification_preferences(
    body: NotificationPreferencesUpdate,
    user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Update the current user's notification preferences (upsert)."""
    data = {
        "user_id": str(user.id),
        "cycle_resolved": body.cycle_resolved,
        "phase_changed": body.phase_changed,
        "epoch_completed": body.epoch_completed,
        "email_locale": body.email_locale,
    }

    resp = (
        supabase.table("notification_preferences")
        .upsert(data, on_conflict="user_id")
        .execute()
    )

    result = resp.data[0] if resp.data else data
    return {
        "success": True,
        "data": {
            "cycle_resolved": result["cycle_resolved"],
            "phase_changed": result["phase_changed"],
            "epoch_completed": result["epoch_completed"],
            "email_locale": result["email_locale"],
        },
    }
