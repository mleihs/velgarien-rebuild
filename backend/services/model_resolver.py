"""Model fallback chain for AI generation."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

from supabase import Client

logger = logging.getLogger(__name__)

# Platform defaults — used when simulation has no model configured
PLATFORM_DEFAULT_MODELS: dict[str, str] = {
    "agent_description": "deepseek/deepseek-v3.2",
    "agent_reactions": "deepseek/deepseek-v3.2",
    "building_description": "deepseek/deepseek-v3.2",
    "event_generation": "deepseek/deepseek-v3.2",
    "chat_response": "deepseek/deepseek-v3.2",
    "news_transformation": "deepseek/deepseek-v3.2",
    "social_trends": "deepseek/deepseek-v3.2",
    "default": "deepseek/deepseek-v3.2",
    "fallback": "deepseek/deepseek-r1-0528:free",
}

PLATFORM_DEFAULT_IMAGE_MODELS: dict[str, dict[str, str]] = {
    "agent_portrait": {
        "model": "stability-ai/stable-diffusion",
        "version": "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    },
    "building_image": {
        "model": "stability-ai/stable-diffusion",
        "version": "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    },
    "fallback": {
        "model": "stability-ai/stable-diffusion",
        "version": "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    },
}

PLATFORM_DEFAULT_PARAMS: dict[str, float | int | str] = {
    "temperature": 0.8,
    "max_tokens": 1500,
    "image_width_portrait": 512,
    "image_height_portrait": 768,
    "image_width_building": 768,
    "image_height_building": 512,
    "guidance_scale": 7.5,
    "num_inference_steps": 50,
    "scheduler": "K_EULER",
    "negative_prompt_agent": (
        "cartoon, anime, illustration, painting, drawing, artistic, "
        "distorted, deformed, low quality, blurry, text, watermark, signature, "
        "multiple people, group, crowd, couple, two people, two faces, "
        "extra limbs, extra fingers, cropped, out of frame, full body, "
        "bright colors, cheerful, happy, colorful, vibrant, sunny"
    ),
    "negative_prompt_building": (
        "people, humans, characters, faces, text, watermark, "
        "cartoon, anime, low quality, blurry, distorted, "
        "bright colors, cheerful, happy, colorful, vibrant, sunny, "
        "modern glass, clean minimalist, utopian"
    ),
}


@dataclass
class ResolvedModel:
    """Resolved model with all parameters."""

    model_id: str
    temperature: float = 0.8
    max_tokens: int = 1500
    source: str = "platform_default"


@dataclass
class ResolvedImageModel:
    """Resolved image model with generation parameters."""

    model: str
    version: str
    width: int = 512
    height: int = 512
    guidance_scale: float = 7.5
    num_inference_steps: int = 50
    scheduler: str = "K_EULER"
    negative_prompt: str = ""
    source: str = "platform_default"


class ModelResolver:
    """Resolves the best model for a given purpose using a 4-level fallback chain.

    Resolution order:
    1. Simulation-specific model (ai.models.{purpose})
    2. Simulation default model (ai.models.default)
    3. Platform default model
    4. Platform fallback model
    """

    def __init__(self, supabase: Client, simulation_id: UUID):
        self._supabase = supabase
        self._simulation_id = simulation_id
        self._settings_cache: dict[str, str] | None = None

    async def _load_settings(self) -> dict[str, str]:
        """Load all AI-related settings for this simulation."""
        if self._settings_cache is not None:
            return self._settings_cache

        response = (
            self._supabase.table("simulation_settings")
            .select("setting_key, setting_value")
            .eq("simulation_id", str(self._simulation_id))
            .eq("category", "ai")
            .execute()
        )

        self._settings_cache = {}
        for row in response.data or []:
            key = row["setting_key"]
            value = row["setting_value"]
            if isinstance(value, str):
                self._settings_cache[key] = value
            elif isinstance(value, dict | list):
                # JSON values stored as-is
                self._settings_cache[key] = str(value)
            else:
                self._settings_cache[key] = str(value) if value is not None else ""

        return self._settings_cache

    async def resolve_text_model(self, purpose: str) -> ResolvedModel:
        """Resolve the best text model for the given purpose.

        Fallback chain:
        1. ai.models.{purpose} (simulation)
        2. ai.models.default (simulation)
        3. Platform default for purpose
        4. Platform fallback
        """
        ai_settings = await self._load_settings()

        # 1. Simulation-specific model for this purpose
        sim_model = ai_settings.get(f"model_{purpose}")
        if sim_model:
            temp = self._get_float(ai_settings, "default_temperature", 0.8)
            tokens = self._get_int(ai_settings, "default_max_tokens", 1500)
            return ResolvedModel(
                model_id=sim_model,
                temperature=temp,
                max_tokens=tokens,
                source=f"simulation.{purpose}",
            )

        # 2. Simulation default model
        sim_default = ai_settings.get("model_fallback")
        if sim_default:
            temp = self._get_float(ai_settings, "default_temperature", 0.8)
            tokens = self._get_int(ai_settings, "default_max_tokens", 1500)
            return ResolvedModel(
                model_id=sim_default,
                temperature=temp,
                max_tokens=tokens,
                source="simulation.default",
            )

        # 3. Platform default for purpose
        platform_model = PLATFORM_DEFAULT_MODELS.get(purpose)
        if platform_model:
            return ResolvedModel(
                model_id=platform_model,
                temperature=float(PLATFORM_DEFAULT_PARAMS.get("temperature", 0.8)),
                max_tokens=int(PLATFORM_DEFAULT_PARAMS.get("max_tokens", 1500)),
                source=f"platform.{purpose}",
            )

        # 4. Platform fallback
        return ResolvedModel(
            model_id=PLATFORM_DEFAULT_MODELS["fallback"],
            temperature=0.7,
            max_tokens=1500,
            source="platform.fallback",
        )

    async def resolve_image_model(self, purpose: str) -> ResolvedImageModel:
        """Resolve the best image model for the given purpose."""
        ai_settings = await self._load_settings()

        # Check simulation-specific image model (not yet exposed in UI)
        sim_model = ai_settings.get(f"image_model_{purpose}")
        sim_version = ai_settings.get(f"image_model_{purpose}_version")

        if not sim_model:
            # Fall back to platform defaults
            platform = PLATFORM_DEFAULT_IMAGE_MODELS.get(
                purpose, PLATFORM_DEFAULT_IMAGE_MODELS["fallback"],
            )
            sim_model = platform["model"]
            sim_version = platform["version"]

        # Load image parameters — use purpose-specific defaults
        is_portrait = "portrait" in purpose
        default_w = 512 if is_portrait else 768
        default_h = 768 if is_portrait else 512
        width = self._get_int(ai_settings, "image_width", default_w)
        height = self._get_int(ai_settings, "image_height", default_h)
        guidance = self._get_float(ai_settings, "image_guidance_scale", 7.5)
        steps = self._get_int(ai_settings, "image_num_inference_steps", 50)
        scheduler = ai_settings.get(
            "image_scheduler",
            str(PLATFORM_DEFAULT_PARAMS.get("scheduler", "K_EULER")),
        )

        # Negative prompt per purpose type
        neg_key = "agent" if "portrait" in purpose else "building"
        negative = ai_settings.get(
            f"negative_prompt_{neg_key}",
            str(PLATFORM_DEFAULT_PARAMS.get(f"negative_prompt_{neg_key}", "")),
        )

        return ResolvedImageModel(
            model=sim_model,
            version=sim_version or "",
            width=width,
            height=height,
            guidance_scale=guidance,
            num_inference_steps=steps,
            scheduler=scheduler,
            negative_prompt=negative,
            source="simulation" if ai_settings.get(f"image_model_{purpose}") else "platform",
        )

    @staticmethod
    def _get_float(settings: dict[str, str], key: str, default: float) -> float:
        val = settings.get(key)
        if val is None:
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _get_int(settings: dict[str, str], key: str, default: int) -> int:
        val = settings.get(key)
        if val is None:
            return default
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return default
