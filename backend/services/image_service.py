"""End-to-end image generation pipeline."""

from __future__ import annotations

import io
import logging
from uuid import UUID, uuid4

from backend.services.external.replicate import ReplicateService
from backend.services.generation_service import GenerationService
from backend.services.model_resolver import ModelResolver
from supabase import Client

logger = logging.getLogger(__name__)

MAX_IMAGE_DIMENSION = 1024
AVIF_QUALITY = 85


class ImageService:
    """Orchestrates image generation: description -> Replicate -> AVIF -> Storage."""

    def __init__(
        self,
        supabase: Client,
        simulation_id: UUID,
        replicate_api_key: str | None = None,
        openrouter_api_key: str | None = None,
    ):
        self._supabase = supabase
        self._simulation_id = simulation_id
        self._replicate = ReplicateService(api_key=replicate_api_key)
        self._generation = GenerationService(
            supabase, simulation_id, openrouter_api_key=openrouter_api_key,
        )
        self._model_resolver = ModelResolver(supabase, simulation_id)

    async def generate_agent_portrait(
        self,
        agent_id: UUID,
        agent_name: str,
        agent_data: dict | None = None,
        description_override: str | None = None,
    ) -> str:
        """Generate a portrait for an agent and upload to storage.

        Returns the public URL of the uploaded portrait.

        If description_override is provided, skip LLM generation and use it
        directly as the image prompt (still appends style prompt).
        If agent_data contains is_ambassador=True and no override, auto-detect
        embassy data and use ambassador-specific prompt generation.
        """
        data = agent_data or {}

        if description_override:
            description = description_override
            logger.info(
                "Using description override for '%s': %s",
                agent_name,
                description[:100],
            )
        elif data.get("is_ambassador"):
            description = await self._generate_ambassador_description(
                agent_name, data,
            )
        else:
            description = await self._generation.generate_portrait_description(
                agent_name=agent_name,
                agent_data=agent_data,
                locale="en",
            )

        logger.info(
            "Portrait description for '%s': %s",
            agent_name,
            description[:100],
        )

        # 2. Append style prompt from settings
        style_prompt = await self._model_resolver.resolve_style_prompt("portrait")
        if style_prompt:
            description = f"{description}, {style_prompt}"

        # 3. Generate image via Replicate
        image_model = await self._model_resolver.resolve_image_model(
            "agent_portrait",
        )
        raw_bytes = await self._replicate.generate_image(
            model=image_model.model,
            prompt=description,
            **image_model.to_replicate_params(),
        )

        # 4. Convert to AVIF
        avif_bytes = _convert_to_avif(raw_bytes)

        # 5. Upload to Supabase Storage
        filename = f"{self._simulation_id}/{agent_id}/{uuid4()}.avif"
        url = await self._upload_to_storage(
            bucket="agent.portraits",
            path=filename,
            data=avif_bytes,
        )

        # 6. Update agent record
        self._supabase.table("agents").update(
            {"portrait_image_url": url},
        ).eq("id", str(agent_id)).execute()

        logger.info("Portrait uploaded for agent %s: %s", agent_id, url)
        return url

    async def generate_building_image(
        self,
        building_id: UUID,
        building_name: str,
        building_type: str,
        building_data: dict | None = None,
        description_override: str | None = None,
    ) -> str:
        """Generate an image for a building and upload to storage.

        Uses a dedicated building_image_description template (same pattern as
        portrait generation) to produce a proper image-generation prompt that
        reflects the building's game-state properties.

        If description_override is provided, skip LLM generation and use it
        directly as the image prompt (still appends style prompt).
        If building_data contains special_type='embassy' and no override,
        auto-detect embassy data and use embassy-specific prompt generation.
        """
        data = building_data or {}

        if description_override:
            description = description_override
            logger.info(
                "Using description override for '%s': %s",
                building_name,
                description[:100],
            )
        elif data.get("special_type") == "embassy":
            description = await self._generate_embassy_description(
                building_name, data,
            )
        else:
            description = await self._generation.generate_building_image_description(
                building_name=building_name,
                building_type=building_type,
                building_data=building_data,
            )

        logger.info(
            "Building image description for '%s': %s",
            building_name,
            description[:100],
        )

        # 2. Append style prompt from settings
        style_prompt = await self._model_resolver.resolve_style_prompt("building")
        if style_prompt:
            description = f"{description}, {style_prompt}"

        # 3. Generate image
        image_model = await self._model_resolver.resolve_image_model(
            "building_image",
        )
        raw_bytes = await self._replicate.generate_image(
            model=image_model.model,
            prompt=description,
            **image_model.to_replicate_params(),
        )

        # 4. Convert to AVIF
        avif_bytes = _convert_to_avif(raw_bytes)

        # 5. Upload
        filename = f"{self._simulation_id}/{building_id}/{uuid4()}.avif"
        url = await self._upload_to_storage(
            bucket="building.images",
            path=filename,
            data=avif_bytes,
        )

        # 6. Update building record
        self._supabase.table("buildings").update(
            {"image_url": url},
        ).eq("id", str(building_id)).execute()

        logger.info("Image uploaded for building %s: %s", building_id, url)
        return url

    async def _generate_embassy_description(
        self,
        building_name: str,
        building_data: dict,
    ) -> str:
        """Fetch embassy context and generate an embassy building image description."""
        embassy_id = building_data.get("embassy_id")
        if not embassy_id:
            # Try to find embassy via special_attributes
            attrs = building_data.get("special_attributes") or {}
            embassy_id = attrs.get("embassy_id")

        if not embassy_id:
            logger.warning(
                "Embassy building '%s' has no embassy_id — falling back to standard",
                building_name,
            )
            return await self._generation.generate_building_image_description(
                building_name=building_name,
                building_type=building_data.get("building_type", ""),
                building_data=building_data,
            )

        # Fetch embassy record
        embassy_resp = (
            self._supabase.table("embassies")
            .select("*")
            .eq("id", str(embassy_id))
            .limit(1)
            .execute()
        )
        if not embassy_resp.data:
            logger.warning("Embassy %s not found — falling back to standard", embassy_id)
            return await self._generation.generate_building_image_description(
                building_name=building_name,
                building_type=building_data.get("building_type", ""),
                building_data=building_data,
            )

        embassy = embassy_resp.data[0]

        # Determine partner simulation ID
        partner_sim_id = building_data.get("partner_simulation_id")
        if not partner_sim_id:
            attrs = building_data.get("special_attributes") or {}
            partner_sim_id = attrs.get("partner_simulation_id")
        if not partner_sim_id:
            # Derive from embassy: the partner is whichever sim is not ours
            if str(embassy["simulation_a_id"]) == str(self._simulation_id):
                partner_sim_id = embassy["simulation_b_id"]
            else:
                partner_sim_id = embassy["simulation_a_id"]

        # Fetch partner simulation name
        partner_resp = (
            self._supabase.table("simulations")
            .select("name")
            .eq("id", str(partner_sim_id))
            .limit(1)
            .execute()
        )
        partner_name = (
            partner_resp.data[0]["name"] if partner_resp.data else "Unknown"
        )

        # Fetch partner style prompt
        partner_style_resp = (
            self._supabase.table("simulation_settings")
            .select("setting_value")
            .eq("simulation_id", str(partner_sim_id))
            .eq("setting_key", "ai.image_style_prompt_building")
            .limit(1)
            .execute()
        )
        partner_theme = (
            partner_style_resp.data[0]["setting_value"]
            if partner_style_resp.data else ""
        )

        # Fetch our own style prompt for the template
        own_style_resp = (
            self._supabase.table("simulation_settings")
            .select("setting_value")
            .eq("simulation_id", str(self._simulation_id))
            .eq("setting_key", "ai.image_style_prompt_building")
            .limit(1)
            .execute()
        )
        own_theme = (
            own_style_resp.data[0]["setting_value"]
            if own_style_resp.data else ""
        )

        building_data_with_theme = {**building_data, "simulation_theme": own_theme}

        return await self._generation.generate_embassy_building_image_description(
            building_name=building_name,
            building_data=building_data_with_theme,
            partner_simulation={"name": partner_name, "theme": partner_theme},
            embassy_data=embassy,
        )

    async def _generate_ambassador_description(
        self,
        agent_name: str,
        agent_data: dict,
    ) -> str:
        """Fetch embassy context and generate an ambassador portrait description."""
        # Find the first embassy this agent is associated with via embassy_metadata
        # Ambassadors are named in embassy_metadata.ambassador_a/b.name
        embassy_resp = (
            self._supabase.table("embassies")
            .select("*")
            .or_(
                f"simulation_a_id.eq.{self._simulation_id},"
                f"simulation_b_id.eq.{self._simulation_id}",
            )
            .eq("status", "active")
            .limit(1)
            .execute()
        )

        if not embassy_resp.data:
            logger.warning(
                "No embassy found for ambassador '%s' — falling back to standard",
                agent_name,
            )
            return await self._generation.generate_portrait_description(
                agent_name=agent_name,
                agent_data=agent_data,
                locale="en",
            )

        embassy = embassy_resp.data[0]

        # Determine partner simulation
        if str(embassy["simulation_a_id"]) == str(self._simulation_id):
            partner_sim_id = embassy["simulation_b_id"]
        else:
            partner_sim_id = embassy["simulation_a_id"]

        # Fetch partner simulation name
        partner_resp = (
            self._supabase.table("simulations")
            .select("name")
            .eq("id", str(partner_sim_id))
            .limit(1)
            .execute()
        )
        partner_name = (
            partner_resp.data[0]["name"] if partner_resp.data else "Unknown"
        )

        # Fetch partner style prompt (portrait)
        partner_style_resp = (
            self._supabase.table("simulation_settings")
            .select("setting_value")
            .eq("simulation_id", str(partner_sim_id))
            .eq("setting_key", "ai.image_style_prompt_portrait")
            .limit(1)
            .execute()
        )
        partner_theme = (
            partner_style_resp.data[0]["setting_value"]
            if partner_style_resp.data else ""
        )

        # Fetch our own style prompt
        own_style_resp = (
            self._supabase.table("simulation_settings")
            .select("setting_value")
            .eq("simulation_id", str(self._simulation_id))
            .eq("setting_key", "ai.image_style_prompt_portrait")
            .limit(1)
            .execute()
        )
        own_theme = (
            own_style_resp.data[0]["setting_value"]
            if own_style_resp.data else ""
        )

        agent_data_with_theme = {**agent_data, "simulation_theme": own_theme}

        return await self._generation.generate_ambassador_portrait_description(
            agent_name=agent_name,
            agent_data=agent_data_with_theme,
            partner_simulation={"name": partner_name, "theme": partner_theme},
            embassy_data=embassy,
        )

    async def _upload_to_storage(
        self,
        bucket: str,
        path: str,
        data: bytes,
    ) -> str:
        """Upload file to Supabase Storage and return the public URL."""
        self._supabase.storage.from_(bucket).upload(
            path,
            data,
            {"content-type": "image/avif"},
        )

        result = self._supabase.storage.from_(bucket).get_public_url(path)
        return result


def _convert_to_avif(image_bytes: bytes) -> bytes:
    """Convert image bytes to AVIF format, resizing if needed."""
    try:
        from PIL import Image
    except ImportError:
        logger.warning("Pillow not installed — returning raw image bytes")
        return image_bytes

    img = Image.open(io.BytesIO(image_bytes))

    # Resize if larger than max dimension
    if max(img.size) > MAX_IMAGE_DIMENSION:
        img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))

    # Convert to RGB if necessary (e.g. RGBA, palette)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    output = io.BytesIO()
    img.save(output, format="AVIF", quality=AVIF_QUALITY)
    return output.getvalue()
