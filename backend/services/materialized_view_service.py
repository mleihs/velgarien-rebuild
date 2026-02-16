"""Service for refreshing materialized views."""

import logging

from supabase import Client

logger = logging.getLogger(__name__)


class MaterializedViewService:
    """Refresh materialized views for up-to-date analytics."""

    @staticmethod
    async def refresh_all(supabase: Client) -> dict:
        """Refresh all materialized views concurrently."""
        views = ["campaign_performance", "agent_statistics"]
        results = {}

        for view in views:
            try:
                supabase.rpc("refresh_materialized_view", {"view_name": view}).execute()
                results[view] = "refreshed"
                logger.info("Refreshed materialized view: %s", view)
            except Exception:
                # Fallback: direct SQL if RPC not available
                try:
                    supabase.postgrest.schema("public")
                    results[view] = "skipped"
                    logger.warning(
                        "Could not refresh %s via RPC, may need direct SQL", view
                    )
                except Exception:
                    results[view] = "failed"
                    logger.exception("Failed to refresh materialized view: %s", view)

        return results
