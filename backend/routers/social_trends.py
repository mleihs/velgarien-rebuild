"""Social trends endpoints."""

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

    # Resolve AI config
    resolver = ExternalServiceResolver(supabase, simulation_id)
    ai_config = await resolver.get_ai_provider_config()

    from backend.services.generation_service import GenerationService

    gen = GenerationService(supabase, simulation_id, ai_config.openrouter_api_key)
    result = await gen.generate_news_transformation(
        headline=trend["name"],
        source=trend["platform"],
        url=trend.get("url", ""),
    )

    return {"success": True, "data": {"trend_id": body.trend_id, "transformation": result}}


@router.post("/integrate", response_model=SuccessResponse[dict], status_code=201)
async def integrate_trend(
    simulation_id: UUID,
    body: IntegrateTrendRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Integrate a trend as a campaign."""
    from backend.services.campaign_service import CampaignService

    campaign = await CampaignService.create_campaign(
        supabase,
        simulation_id,
        {
            "title": body.campaign_title,
            "campaign_type": body.campaign_type,
            "target_demographic": body.target_demographic,
            "urgency_level": body.urgency_level,
            "source_trend_id": body.trend_id,
        },
    )

    # Mark trend as processed
    await SocialTrendsService.mark_processed(
        supabase, simulation_id, UUID(body.trend_id)
    )

    return {"success": True, "data": campaign}


@router.post("/workflow", response_model=SuccessResponse[dict])
async def workflow(
    simulation_id: UUID,
    body: FetchTrendsRequest,
    user: CurrentUser = Depends(get_current_user),
    _role_check: str = Depends(require_role("editor")),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Full workflow: Fetch trends from source."""
    # Step 1: Fetch
    resolver = ExternalServiceResolver(supabase, simulation_id)

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

    # Step 2: Store
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
