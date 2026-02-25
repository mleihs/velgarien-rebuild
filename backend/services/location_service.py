"""Service layer for location operations (cities, zones, streets)."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status

from supabase import Client


class LocationService:
    """Service for cities, zones, and streets — not using BaseService since no soft-delete."""

    # --- Generic helpers ---

    @staticmethod
    async def _list(
        supabase: Client,
        table: str,
        simulation_id: UUID,
        filters: dict | None = None,
        limit: int = 25,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        """Generic list with optional equality filters."""
        query = (
            supabase.table(table)
            .select("*", count="exact")
            .eq("simulation_id", str(simulation_id))
            .order("name")
        )
        for key, value in (filters or {}).items():
            if value is not None:
                query = query.eq(key, str(value))
        query = query.range(offset, offset + limit - 1)
        response = query.execute()
        total = response.count if response.count is not None else len(response.data or [])
        return response.data or [], total

    @staticmethod
    async def _get(
        supabase: Client,
        table: str,
        simulation_id: UUID,
        entity_id: UUID,
        label: str,
    ) -> dict:
        """Generic get-by-id."""
        response = (
            supabase.table(table)
            .select("*")
            .eq("simulation_id", str(simulation_id))
            .eq("id", str(entity_id))
            .limit(1)
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} '{entity_id}' not found.")
        return response.data[0]

    @staticmethod
    async def _create(
        supabase: Client,
        table: str,
        simulation_id: UUID,
        data: dict,
        label: str,
    ) -> dict:
        """Generic create."""
        response = (
            supabase.table(table)
            .insert({**data, "simulation_id": str(simulation_id)})
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create {label.lower()}.",
            )
        return response.data[0]

    @staticmethod
    async def _update(
        supabase: Client,
        table: str,
        simulation_id: UUID,
        entity_id: UUID,
        data: dict,
        label: str,
    ) -> dict:
        """Generic update."""
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update.")
        data["updated_at"] = datetime.now(UTC).isoformat()
        response = (
            supabase.table(table)
            .update(data)
            .eq("simulation_id", str(simulation_id))
            .eq("id", str(entity_id))
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} '{entity_id}' not found.")
        return response.data[0]

    # --- Cities ---

    @classmethod
    async def list_cities(cls, supabase: Client, simulation_id: UUID, limit: int = 25, offset: int = 0):
        return await cls._list(supabase, "cities", simulation_id, limit=limit, offset=offset)

    @classmethod
    async def get_city(cls, supabase: Client, simulation_id: UUID, city_id: UUID):
        return await cls._get(supabase, "cities", simulation_id, city_id, "City")

    @classmethod
    async def create_city(cls, supabase: Client, simulation_id: UUID, data: dict):
        return await cls._create(supabase, "cities", simulation_id, data, "City")

    @classmethod
    async def update_city(cls, supabase: Client, simulation_id: UUID, city_id: UUID, data: dict):
        return await cls._update(supabase, "cities", simulation_id, city_id, data, "City")

    # --- Zones ---

    @classmethod
    async def list_zones(
        cls, supabase: Client, simulation_id: UUID, city_id: UUID | None = None, limit: int = 25, offset: int = 0,
    ):
        filters = {"city_id": city_id}
        return await cls._list(supabase, "zones", simulation_id, filters=filters, limit=limit, offset=offset)

    @classmethod
    async def get_zone(cls, supabase: Client, simulation_id: UUID, zone_id: UUID):
        return await cls._get(supabase, "zones", simulation_id, zone_id, "Zone")

    @classmethod
    async def create_zone(cls, supabase: Client, simulation_id: UUID, data: dict):
        return await cls._create(supabase, "zones", simulation_id, data, "Zone")

    @classmethod
    async def update_zone(cls, supabase: Client, simulation_id: UUID, zone_id: UUID, data: dict):
        return await cls._update(supabase, "zones", simulation_id, zone_id, data, "Zone")

    # --- Streets ---

    @classmethod
    async def list_streets(
        cls,
        supabase: Client,
        simulation_id: UUID,
        city_id: UUID | None = None,
        zone_id: UUID | None = None,
        limit: int = 25,
        offset: int = 0,
    ):
        return await cls._list(
            supabase, "city_streets", simulation_id,
            filters={"city_id": city_id, "zone_id": zone_id},
            limit=limit, offset=offset,
        )

    @classmethod
    async def create_street(cls, supabase: Client, simulation_id: UUID, data: dict):
        return await cls._create(supabase, "city_streets", simulation_id, data, "Street")

    @classmethod
    async def update_street(cls, supabase: Client, simulation_id: UUID, street_id: UUID, data: dict):
        return await cls._update(supabase, "city_streets", simulation_id, street_id, data, "Street")
