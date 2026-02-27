-- Migration 029: Embassy Image Prompt Templates
-- Adds 2 platform-level prompt templates for dynamic embassy image generation.
-- Used when future embassy buildings/agents are created via UI (not for demo data,
-- which uses pre-written prompts from embassy_prompts.py).

-- ============================================================================
-- 1. Embassy Building Image Description Template
-- ============================================================================

INSERT INTO prompt_templates (
    simulation_id, template_type, prompt_category, locale, template_name,
    system_prompt, prompt_content, is_active, is_system_default,
    default_model, temperature, max_tokens
)
VALUES (
    NULL,
    'embassy_building_image_description',
    'generation',
    'en',
    'Embassy Building Image Description',
    'You are an art director for a multiverse simulation platform. You generate image descriptions for EMBASSY BUILDINGS — structures that exist simultaneously in two realities.

CORE PRINCIPLE: The building is 80% native to its own simulation. The remaining 20% shows SUBTLE contamination from the partner simulation, filtered through the specific bleed vector. The contamination should feel uncanny and wrong — not obvious or fantastic. A viewer should feel uneasy without immediately knowing why.

CONTAMINATION RULES:
- Contamination is environmental, not fantastical. No portals, no glowing rifts, no obvious magic.
- Wrong materials: a surface made of material from the partner world, in the shape/function of this world
- Wrong light: a light source with the color temperature or quality of the partner world
- Wrong texture: a surface that has the grain, wear pattern, or patina of the partner world
- Wrong object: a single item that belongs to the partner world, treated as mundane by this world
- The bleed vector determines the QUALITY of wrongness (see vector descriptions)

OUTPUT FORMAT: Write comma-separated visual descriptors for Flux Dev image generation. No sentences, no narrative. 100-150 words. Include: architecture, materials, lighting, atmosphere, scale, one specific contamination detail, one bleed-vector-specific anomaly. Do NOT use the words "contamination", "bleed", "embassy", "portal", or "multiverse" — describe what you SEE, not what it MEANS.',
    'Describe an architectural scene for image generation.

BUILDING: {building_name}
NATIVE WORLD: {simulation_name}
NATIVE AESTHETIC: {simulation_theme}
BUILDING DESCRIPTION: {building_description}
BUILDING STYLE: {building_style}
CONDITION: {building_condition}

PARTNER WORLD: {partner_simulation_name}
PARTNER AESTHETIC: {partner_theme}

BLEED VECTOR: {bleed_vector}
VECTOR VISUAL QUALITY: {vector_description}

THE QUESTION THIS PLACE ASKS: {embassy_question}

Generate the image description. The building should feel 80% {simulation_name} and 20% wrong — contaminated by traces of {partner_simulation_name}, filtered through the {bleed_vector} vector. The wrongness should be subtle, architectural, material — not magical or obvious. One specific anomaly detail. One vector-specific visual quality.',
    true,
    true,
    'anthropic',
    0.8,
    300
);

-- ============================================================================
-- 2. Ambassador Portrait Description Template
-- ============================================================================

INSERT INTO prompt_templates (
    simulation_id, template_type, prompt_category, locale, template_name,
    system_prompt, prompt_content, is_active, is_system_default,
    default_model, temperature, max_tokens
)
VALUES (
    NULL,
    'ambassador_portrait_description',
    'generation',
    'en',
    'Ambassador Portrait Description',
    'You are a portrait description specialist for a multiverse simulation platform. You generate image descriptions for AMBASSADOR AGENTS — people who work at the boundary between two realities and bear physical marks of that exposure.

CORE PRINCIPLE: The ambassador is 85% native to their own simulation. The remaining 15% shows signs of prolonged exposure to the partner reality — in their clothing, their accessories, their eyes, their physical state. The exposure is not costume — it is CONTAMINATION. It happened to them. They may not be fully aware of it.

EXPOSURE RULES:
- Clothing: One garment detail or material from the partner world worn unconsciously
- Accessories: One object that does not belong to their world, carried like a talisman or tool
- Physical: Eyes that have seen too much of the wrong reality — a specific quality of fatigue, wonder, or dissociation unique to the bleed vector
- Texture: Skin, hair, or clothing showing physical effects of cross-reality exposure (partner world''s environmental weathering on this world''s person)
- The bleed vector determines what KIND of exposure they show

OUTPUT FORMAT: Write comma-separated visual descriptors for Flux Dev image generation. No sentences. 80-120 words. Include: face/age/expression, clothing with one contamination detail, one partner-world accessory, lighting from their native world, one vector-specific physical effect. Single person, head-and-shoulders. Do NOT use the words "ambassador", "contamination", "bleed", "portal", or "multiverse."',
    'Describe a head-and-shoulders portrait for image generation.

AGENT: {agent_name}
NATIVE WORLD: {simulation_name}
NATIVE AESTHETIC: {simulation_theme}
CHARACTER: {agent_character}
BACKGROUND: {agent_background}

EXPOSURE TO: {partner_simulation_name}
PARTNER AESTHETIC: {partner_theme}

BLEED VECTOR: {bleed_vector}
VECTOR EFFECT ON PEOPLE: {vector_person_effect}

Describe {agent_name} as a person from {simulation_name} who has been changed by prolonged proximity to {partner_simulation_name}. The change is 15% of their appearance — one clothing detail, one object, one quality in the eyes. The rest is purely {simulation_name}. The {bleed_vector} vector determines what kind of mark it leaves.',
    true,
    true,
    'anthropic',
    0.8,
    200
);
