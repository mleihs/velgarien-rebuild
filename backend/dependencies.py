from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Path, status
from jose import JWTError, jwt

from backend.config import settings
from backend.models.common import CurrentUser
from supabase import Client, create_client

# Role hierarchy: higher index = more privileges
ROLE_HIERARCHY: dict[str, int] = {
    "viewer": 0,
    "editor": 1,
    "admin": 2,
    "owner": 3,
}


async def get_current_user(
    authorization: Annotated[str, Header()],
) -> CurrentUser:
    """Extract and validate the current user from the JWT Bearer token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'.",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        ) from e

    user_id = payload.get("sub")
    email = payload.get("email", "")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim.",
        )

    return CurrentUser(id=UUID(user_id), email=email, access_token=token)


async def get_supabase(
    user: CurrentUser = Depends(get_current_user),
) -> Client:
    """Create a Supabase client authenticated with the user's JWT.

    This ensures RLS policies are applied for the current user.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.auth.set_session(user.access_token, "")
    return client


async def get_admin_supabase() -> Client:
    """Create a Supabase client with the service role key.

    Use sparingly -- bypasses RLS. Only for admin operations.
    """
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def require_role(required_role: str):
    """Dependency factory that checks the user has the required role in a simulation.

    Usage:
        @router.put("/simulations/{simulation_id}")
        async def update(
            simulation_id: UUID,
            user: CurrentUser = Depends(get_current_user),
            _role_check = Depends(require_role("admin")),
            supabase: Client = Depends(get_supabase),
        ):
    """

    async def _check_role(
        simulation_id: Annotated[UUID, Path()],
        user: CurrentUser = Depends(get_current_user),
        supabase: Client = Depends(get_supabase),
    ) -> str:
        """Verify the user has the required role for this simulation."""
        response = (
            supabase.table("simulation_members")
            .select("member_role")
            .eq("simulation_id", str(simulation_id))
            .eq("user_id", str(user.id))
            .maybe_single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this simulation.",
            )

        actual_role = response.data["member_role"]
        required_level = ROLE_HIERARCHY.get(required_role, 0)
        actual_level = ROLE_HIERARCHY.get(actual_role, 0)

        if actual_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires '{required_role}' role. You have '{actual_role}'.",
            )

        return actual_role

    return _check_role
