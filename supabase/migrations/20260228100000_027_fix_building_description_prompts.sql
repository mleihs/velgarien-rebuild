-- Migration 027: Fix building description generation prompts
--
-- Problem: Templates asked for "150-250 words" detailed descriptions, but seeded
-- building data uses short functional descriptions (5-10 words). The long AI-generated
-- descriptions then overwhelm the style prompt during image generation, producing
-- images that look visually inconsistent with the rest of the simulation.
--
-- Fix: Rewrite all 4 building generation templates to produce short, functional
-- descriptions matching the seeded data style. Reduce max_tokens accordingly.

-- 1. building_generation EN (platform default, no name provided)
UPDATE prompt_templates
SET prompt_content = 'Generate a {building_type} building for the simulation "{simulation_name}".

Generate a JSON object with:
- "name": A fitting name for this building (in the language and style of the simulation world)
- "description": A short, functional description (1-2 sentences, max 30 words). Write like a database entry, not a narrative. Examples: "Training facility of the armed forces", "Underground market in the old tunnels", "Abandoned factory on the river bank".
- "building_condition": One of: excellent, good, fair, poor, ruined

Respond in {locale_name}.',
    system_prompt = 'You are an architectural worldbuilder. Generate concise building entries for a simulation database. Descriptions must be brief and functional — never flowery prose.',
    max_tokens = 200,
    updated_at = now()
WHERE template_type = 'building_generation'
  AND locale = 'en'
  AND simulation_id IS NULL;

-- 2. building_generation DE (platform default, no name provided)
UPDATE prompt_templates
SET prompt_content = 'Erstelle ein Gebäude vom Typ {building_type} für die Simulation "{simulation_name}".

Generiere ein JSON-Objekt mit:
- "name": Ein passender Name für dieses Gebäude (in der Sprache und dem Stil der Simulationswelt)
- "description": Eine kurze, funktionale Beschreibung (1-2 Sätze, max. 30 Wörter). Schreibe wie einen Datenbankeintrag, keine Erzählung. Beispiele: "Ausbildungsstätte der Streitkräfte", "Unterirdischer Markt in den alten Tunneln", "Verlassene Fabrik am Flussufer".
- "building_condition": Eines von: excellent, good, fair, poor, ruined

Antworte auf {locale_name}.',
    system_prompt = 'Du bist ein architektonischer Weltenbauer. Generiere knappe Gebäudeeinträge für eine Simulationsdatenbank. Beschreibungen müssen kurz und funktional sein — niemals blumige Prosa.',
    max_tokens = 200,
    updated_at = now()
WHERE template_type = 'building_generation'
  AND locale = 'de'
  AND simulation_id IS NULL;

-- 3. building_generation_named EN (platform default, name provided)
UPDATE prompt_templates
SET prompt_content = 'Describe the building "{building_name}" (type: {building_type}) for "{simulation_name}".

Generate a JSON object with:
- "description": A short, functional description (1-2 sentences, max 30 words). Write like a database entry, not a narrative. Examples: "Headquarters of the secret police", "Crumbling residential block in the industrial quarter", "Main temple of the old faith".
- "building_condition": One of: excellent, good, fair, poor, ruined

Respond in {locale_name}.',
    system_prompt = 'You are an architectural worldbuilder. Generate concise building entries for a simulation database. Descriptions must be brief and functional — never flowery prose.',
    max_tokens = 150,
    updated_at = now()
WHERE template_type = 'building_generation_named'
  AND locale = 'en'
  AND simulation_id IS NULL;

-- 4. building_generation_named DE (platform default, name provided)
UPDATE prompt_templates
SET prompt_content = 'Beschreibe das Gebäude "{building_name}" (Typ: {building_type}) für "{simulation_name}".

Generiere ein JSON-Objekt mit:
- "description": Eine kurze, funktionale Beschreibung (1-2 Sätze, max. 30 Wörter). Schreibe wie einen Datenbankeintrag, keine Erzählung. Beispiele: "Hauptquartier der Geheimpolizei", "Baufälliger Wohnblock im Industrieviertel", "Haupttempel des alten Glaubens".
- "building_condition": Eines von: excellent, good, fair, poor, ruined

Antworte auf {locale_name}.',
    system_prompt = 'Du bist ein architektonischer Weltenbauer. Generiere knappe Gebäudeeinträge für eine Simulationsdatenbank. Beschreibungen müssen kurz und funktional sein — niemals blumige Prosa.',
    max_tokens = 150,
    updated_at = now()
WHERE template_type = 'building_generation_named'
  AND locale = 'de'
  AND simulation_id IS NULL;
