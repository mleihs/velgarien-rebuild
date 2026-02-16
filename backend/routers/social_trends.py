"""Social trends endpoints — fetch, transform, and integrate as events."""

import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.dependencies import get_current_user, get_supabase, require_role
from backend.models.common import CurrentUser, PaginatedResponse, SuccessResponse
from backend.models.social import SocialTrendResponse
from backend.models.social_trend import (
    FetchTrendsRequest,
    IntegrateTrendRequest,
    TransformTrendRequest,
)
from backend.services.external_service_resolver import ExternalServiceResolver
from backend.services.social_trends_service import SocialTrendsService
from supabase import Client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/simulations/{simulation_id}/social-trends",
    tags=["social-trends"],
)


@router.get("", response_model=PaginatedResponse[SocialTrendResponse])
async def list_trends(
    simulation_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("viewer")),
    supabase: Client = Depends(get_supabase),
    platform: str | None = None,
    sentiment: str | None = None,
    is_processed: bool | None = None,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List social trends with optional filters."""
    data, total = await SocialTrendsService.list_trends(
        supabase,
        simulation_id,
        platform=platform,
        sentiment=sentiment,
        is_processed=is_processed,
        limit=limit,
        offset=offset,
    )
    return {
        "success": True,
        "data": data,
        "meta": {"count": len(data), "total": total, "limit": limit, "offset": offset},
    }


@router.post("/fetch", response_model=SuccessResponse[list[SocialTrendResponse]])
async def fetch_trends(
    simulation_id: UUID,
    body: FetchTrendsRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Fetch trends from an external news source."""
    resolver = ExternalServiceResolver(supabase, simulation_id)

    try:
        if body.source == "guardian":
            config = await resolver.get_guardian_config()
            if not config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Guardian API not configured for this simulation.",
                )
            from backend.services.external.guardian import GuardianService

            service = GuardianService(config.api_key)
            raw_trends = await service.search(body.query, limit=body.limit)

        elif body.source == "newsapi":
            config = await resolver.get_newsapi_config()
            if not config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="NewsAPI not configured for this simulation.",
                )
            from backend.services.external.newsapi import NewsAPIService

            service = NewsAPIService(config.api_key)
            raw_trends = await service.search(body.query, limit=body.limit)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown source: {body.source}",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("External news API error for source=%s", body.source)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External API error: {exc}",
        ) from exc

    stored = await SocialTrendsService.store_fetched_trends(
        supabase, simulation_id, raw_trends
    )
    return {"success": True, "data": stored}


@router.post("/transform", response_model=SuccessResponse[dict])
async def transform_trend(
    simulation_id: UUID,
    body: TransformTrendRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Transform a trend into the simulation context using AI."""
    trend = await SocialTrendsService.get_trend(
        supabase, simulation_id, UUID(body.trend_id)
    )

    resolver = ExternalServiceResolver(supabase, simulation_id)
    ai_config = await resolver.get_ai_provider_config()

    from backend.services.generation_service import GenerationService

    gen = GenerationService(supabase, simulation_id, ai_config.openrouter_api_key)

    # Build content from raw_data if available
    raw = trend.get("raw_data") or {}
    news_content_parts = [
        raw.get("trail_text") or raw.get("description") or "",
        f"Source: {trend['platform']}",
    ]
    if trend.get("url"):
        news_content_parts.append(f"URL: {trend['url']}")
    if raw.get("byline") or raw.get("author"):
        news_content_parts.append(f"Author: {raw.get('byline') or raw.get('author')}")

    try:
        result = await gen.generate_news_transformation(
            news_title=trend["name"],
            news_content="\n".join(news_content_parts),
        )
    except Exception as exc:
        logger.exception("AI transformation failed for trend=%s", body.trend_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI transformation failed: {exc}",
        ) from exc

    return {
        "success": True,
        "data": {
            "trend_id": body.trend_id,
            "original_title": trend["name"],
            "transformation": result,
        },
    }


@router.post("/integrate", response_model=SuccessResponse[dict], status_code=201)
async def integrate_trend(
    simulation_id: UUID,
    body: IntegrateTrendRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Integrate a transformed trend as an event."""
    from backend.services.audit_service import AuditService
    from backend.services.base_service import _serialize_for_json
    from backend.services.event_service import EventService

    event_data = _serialize_for_json({
        "title": body.title,
        "description": body.description,
        "event_type": body.event_type or "news",
        "impact_level": body.impact_level,
        "tags": [*body.tags, "imported", "news"],
        "data_source": "imported",
        "occurred_at": datetime.now(UTC).isoformat(),
    })

    event = await EventService.create(
        supabase,
        simulation_id,
        user.id,
        event_data,
    )

    await SocialTrendsService.mark_processed(
        supabase, simulation_id, UUID(body.trend_id)
    )

    await AuditService.log_action(
        supabase,
        simulation_id=simulation_id,
        user_id=user.id,
        entity_type="events",
        entity_id=UUID(event["id"]),
        action="create",
        changes={"source": "social_trend", "trend_id": body.trend_id},
    )

    return {"success": True, "data": event}


@router.post("/workflow", response_model=SuccessResponse[dict])
async def workflow(
    simulation_id: UUID,
    body: FetchTrendsRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Full workflow: Fetch trends from external source and store them."""
    resolver = ExternalServiceResolver(supabase, simulation_id)

    try:
        if body.source == "guardian":
            config = await resolver.get_guardian_config()
            if not config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Guardian API not configured.",
                )
            from backend.services.external.guardian import GuardianService

            service = GuardianService(config.api_key)
            raw_trends = await service.search(body.query, limit=body.limit)
        else:
            config = await resolver.get_newsapi_config()
            if not config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="NewsAPI not configured.",
                )
            from backend.services.external.newsapi import NewsAPIService

            service = NewsAPIService(config.api_key)
            raw_trends = await service.search(body.query, limit=body.limit)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("External news API error for source=%s", body.source)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"External API error: {exc}",
        ) from exc

    stored = await SocialTrendsService.store_fetched_trends(
        supabase, simulation_id, raw_trends
    )

    return {
        "success": True,
        "data": {
            "fetched": len(raw_trends),
            "stored": len(stored),
            "trends": stored,
        },
    }
