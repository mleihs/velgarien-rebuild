-- Migration 028: Embassy System — Shared Buildings Across Simulations
-- Adds the embassies table (cross-simulation building links), 12 embassy buildings,
-- 6 embassy records, and 2 prompt templates.
-- Part of Protocol THRESHOLD — controlled interdimensional passages.

-- ============================================================================
-- 1. TABLE
-- ============================================================================

CREATE TABLE public.embassies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_a_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    simulation_a_id UUID NOT NULL REFERENCES simulations(id),
    building_b_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    simulation_b_id UUID NOT NULL REFERENCES simulations(id),
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed','active','suspended','dissolved')),
    connection_type TEXT NOT NULL DEFAULT 'embassy',
    description TEXT,
    established_by TEXT,
    bleed_vector TEXT CHECK (bleed_vector IS NULL OR bleed_vector IN (
        'commerce','language','memory','resonance','architecture','dream','desire')),
    event_propagation BOOLEAN NOT NULL DEFAULT true,
    embassy_metadata JSONB DEFAULT '{}',
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_same_simulation CHECK (simulation_a_id != simulation_b_id),
    CONSTRAINT unique_embassy UNIQUE (building_a_id, building_b_id),
    CONSTRAINT ordered_buildings CHECK (building_a_id < building_b_id)
);

-- Indexes
CREATE INDEX idx_embassy_building_a ON embassies(building_a_id);
CREATE INDEX idx_embassy_building_b ON embassies(building_b_id);
CREATE INDEX idx_embassy_sim_a ON embassies(simulation_a_id);
CREATE INDEX idx_embassy_sim_b ON embassies(simulation_b_id);
CREATE INDEX idx_embassy_active ON embassies(status) WHERE status = 'active';

-- ============================================================================
-- 2. TRIGGER (updated_at)
-- ============================================================================

CREATE TRIGGER set_embassies_updated_at
    BEFORE UPDATE ON embassies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE embassies ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: active embassies in active simulations
CREATE POLICY embassies_anon_select ON embassies
    FOR SELECT TO anon
    USING (
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM simulations
            WHERE simulations.id = embassies.simulation_a_id
              AND simulations.status = 'active'
              AND simulations.deleted_at IS NULL
        )
    );

-- Authenticated SELECT: members of either simulation
CREATE POLICY embassies_select ON embassies
    FOR SELECT TO public
    USING (
        user_has_simulation_access(simulation_a_id)
        OR user_has_simulation_access(simulation_b_id)
    );

-- INSERT: admin of the initiating simulation
CREATE POLICY embassies_insert ON embassies
    FOR INSERT TO public
    WITH CHECK (
        user_has_simulation_role(simulation_a_id, 'admin')
        OR user_has_simulation_role(simulation_b_id, 'admin')
    );

-- UPDATE: admin of either simulation
CREATE POLICY embassies_update ON embassies
    FOR UPDATE TO public
    USING (
        user_has_simulation_role(simulation_a_id, 'admin')
        OR user_has_simulation_role(simulation_b_id, 'admin')
    );

-- DELETE: admin of either simulation
CREATE POLICY embassies_delete ON embassies
    FOR DELETE TO public
    USING (
        user_has_simulation_role(simulation_a_id, 'admin')
        OR user_has_simulation_role(simulation_b_id, 'admin')
    );

-- ============================================================================
-- 4. TAXONOMY: embassy building special_type for all simulations
-- ============================================================================

INSERT INTO simulation_taxonomies (simulation_id, taxonomy_type, value, label, sort_order, is_active)
SELECT sim.id, 'building_special_type', 'embassy',
       '{"en":"Embassy","de":"Botschaft"}', 1, true
FROM (VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid),
    ('20000000-0000-0000-0000-000000000001'::uuid),
    ('30000000-0000-0000-0000-000000000001'::uuid),
    ('40000000-0000-0000-0000-000000000001'::uuid)
) AS sim(id)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. PROMPT TEMPLATES for embassy AI operations
-- ============================================================================

-- Embassy pair generation template
INSERT INTO prompt_templates (simulation_id, template_type, prompt_category, template_name, prompt_content, is_active, default_model, temperature, max_tokens)
SELECT sim.id, 'embassy_pair_generation', 'generation', 'Generate Embassy Partner Building',
  'You are a narrative designer for a multi-world simulation platform. Given a source building in one world, generate a partner building in the target world that feels native to the target aesthetic while sharing subtle echoes of the source.

Each embassy asks a fundamental question about the relationship between two realities. The partner building is the same place viewed through a different lens of existence.

SOURCE BUILDING:
Name: {{source_building_name}}
Type: {{source_building_type}}
Description: {{source_building_description}}
World: {{source_simulation_name}} ({{source_theme}})

TARGET WORLD: {{target_simulation_name}} ({{target_theme}})
Target world description: {{target_description}}

BLEED VECTOR: {{bleed_vector}} — the thematic channel connecting these buildings.

Generate a partner building that:
- Feels completely native to the target world
- Contains subtle, uncanny echoes of the source (materials, geometry, atmosphere)
- Has its own internally consistent logic for existing
- Poses the embassy''s Question through its very existence

Respond as JSON:
{
  "name": "partner building name",
  "building_type": "one of the target world''s building types",
  "description": "2-3 sentences. Written in-world. Uncanny details.",
  "style": "architectural style appropriate to target world",
  "embassy_description": "The Question this embassy asks — one sentence, italicized philosophical query about reality"
}',
  true, 'anthropic', 0.8, 500
FROM (VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid),
    ('20000000-0000-0000-0000-000000000001'::uuid),
    ('30000000-0000-0000-0000-000000000001'::uuid),
    ('40000000-0000-0000-0000-000000000001'::uuid)
) AS sim(id);

-- Embassy event echo template
INSERT INTO prompt_templates (simulation_id, template_type, prompt_category, template_name, prompt_content, is_active, default_model, temperature, max_tokens)
SELECT sim.id, 'embassy_event_echo', 'generation', 'Transform Embassy Event',
  'Transform this event from one side of an embassy to the other. Unlike bleed echoes (distorted rumours), embassy events are the same event happening simultaneously in two places — perceived differently by each world''s inhabitants.

SOURCE EVENT:
Title: {{source_title}}
Description: {{source_description}}
World: {{source_simulation_name}} ({{source_theme}})
Building: {{source_building_name}}

TARGET WORLD: {{target_simulation_name}} ({{target_theme}})
Target Building: {{target_building_name}}

THE QUESTION this embassy asks: {{embassy_description}}

Rewrite this event as it would be perceived in the target world:
- Same event, different perception — not a rumour, a simultaneous experience
- Use the target world''s vocabulary, aesthetic, and narrative conventions
- Reference the embassy''s Question obliquely
- Keep the core narrative tension intact

Respond as JSON with "title" and "description" fields only.',
  true, 'anthropic', 0.7, 300
FROM (VALUES
    ('10000000-0000-0000-0000-000000000001'::uuid),
    ('20000000-0000-0000-0000-000000000001'::uuid),
    ('30000000-0000-0000-0000-000000000001'::uuid),
    ('40000000-0000-0000-0000-000000000001'::uuid)
) AS sim(id);

-- ============================================================================
-- 6. DEMO DATA: 12 Embassy Buildings (name-based lookups, no hardcoded UUIDs)
-- ============================================================================

-- We need to add new building types to simulations that lack them.
-- Velgarien needs 'archive' and 'restricted_zone' types
INSERT INTO simulation_taxonomies (simulation_id, taxonomy_type, value, label, sort_order, is_active)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'building_type', 'archive', '{"en":"Archive","de":"Archiv"}', 8, true),
    ('10000000-0000-0000-0000-000000000001', 'building_type', 'restricted_zone', '{"en":"Restricted Zone","de":"Sperrgebiet"}', 9, true),
    ('20000000-0000-0000-0000-000000000001', 'building_type', 'anomaly', '{"en":"Anomaly","de":"Anomalie"}', 8, true),
    ('20000000-0000-0000-0000-000000000001', 'building_type', 'observatory', '{"en":"Observatory","de":"Observatorium"}', 9, true),
    ('20000000-0000-0000-0000-000000000001', 'building_type', 'trading_post', '{"en":"Trading Post","de":"Handelsposten"}', 10, true),
    ('30000000-0000-0000-0000-000000000001', 'building_type', 'comms_array', '{"en":"Comms Array","de":"Kommunikationsanlage"}', 7, true),
    ('30000000-0000-0000-0000-000000000001', 'building_type', 'anomaly', '{"en":"Anomaly","de":"Anomalie"}', 8, true),
    ('40000000-0000-0000-0000-000000000001', 'building_type', 'archive', '{"en":"Archive","de":"Archiv"}', 8, true),
    ('40000000-0000-0000-0000-000000000001', 'building_type', 'observatory', '{"en":"Observatory","de":"Observatorium"}', 9, true),
    ('40000000-0000-0000-0000-000000000001', 'building_type', 'market', '{"en":"Market","de":"Markt"}', 10, true)
ON CONFLICT DO NOTHING;

-- === Velgarien Embassy Buildings ===

-- Room 441 (Velgarien ↔ Capybara Kingdom)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Room 441',
    'government',
    'A windowless government office on the fourth floor of Bureau 12. The filing cabinets contain documents from places that do not exist. The typewriter produces text in languages that have no alphabet. Room 441 is technically unregistered — it appears on no floor plan, receives no maintenance requests, and its electricity usage is billed to a department that was dissolved in 1957. Agents assigned here develop an unexplained fondness for mushrooms.',
    'Brutalist institutional, fluorescent lighting, concrete walls with inexplicable moisture patterns',
    'a0000001-0000-0000-0000-000000000001',  -- Regierungsviertel
    4,
    'anomalous',
    'embassy',
    '{}',
    'curated'
);

-- The Static Room (Velgarien ↔ Station Null)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'The Static Room',
    'restricted_zone',
    'A sealed room in the subbasement of the Bureau of Communication Standards. The room has been locked since 1962, but radio equipment inside continues to broadcast. The transmissions are not in any known language. They are, according to three separate analysts who were subsequently reassigned, "coming from very far above and very far inside at the same time." The room smells of recycled air and cosmic dust.',
    'Cold War bunker aesthetic, reinforced concrete, obsolete radio equipment still humming',
    'a0000002-0000-0000-0000-000000000001',  -- Industriegebiet Nord
    2,
    'sealed',
    'embassy',
    '{}',
    'curated'
);

-- Archive Sub-Level C (Velgarien ↔ Speranza)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Archive Sub-Level C',
    'archive',
    'The lowest accessible level of the Central Archive. Sub-Level C was sealed after the 1978 Incident (classified, do not inquire). The door was re-opened in 2024 by maintenance workers who found it unlocked from the inside. The level contains documents describing a city built in the ruins of the old world — a city that does not appear in any Velgarien geography. The documents are written on material that analysis identifies as "paper, but Italian."',
    'Deep underground archive, reinforced steel shelving, emergency lighting, temperature-controlled',
    'a0000001-0000-0000-0000-000000000001',  -- Regierungsviertel
    6,
    'restricted',
    'embassy',
    '{}',
    'curated'
);

-- === Capybara Kingdom Embassy Buildings ===

-- The Threshold (Capybara Kingdom ↔ Velgarien)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'The Threshold',
    'anomaly',
    'A door carved into the limestone at the lowest navigable point of Deepreach. It opens onto a corridor of impossible geometry — the walls are concrete (a material unknown in the Kingdom), the lighting is fluorescent (a concept that makes the Archivists uncomfortable), and the filing cabinets contain documents written in perfect High Capybaran about events that have not yet occurred. Archivist Mossback has been cross-referencing the documents for three months. She has not slept since Tuesday.',
    'Natural cavern transitioning to brutalist corridor, bioluminescence meeting fluorescent light',
    'a0000007-0000-0000-0000-000000000001',  -- Deepreach
    4,
    'anomalous',
    'embassy',
    '{}',
    'curated'
);

-- The Drowned Antenna (Capybara Kingdom ↔ Station Null)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'The Drowned Antenna',
    'observatory',
    'A structure rising from the Unterzee''s floor that Commodore Whiskers insists is "a very large mushroom." It is not a mushroom. It is a parabolic antenna array constructed from materials unknown in the Kingdom, or indeed on any known planet. It hums. The hum matches the resonance frequency of HAVEN''s life support systems. Thornback''s bioluminescent crops grow 40% faster within a hundred-metre radius.',
    'Alien technology encrusted with bioluminescent coral, pulsing with rhythmic light',
    'a0000007-0000-0000-0000-000000000001',  -- Deepreach
    3,
    'operational',
    'embassy',
    '{}',
    'curated'
);

-- The Warm Market (Capybara Kingdom ↔ Speranza)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'The Warm Market',
    'trading_post',
    'A section of the Deepreach market where the cave temperature rises inexplicably. The vendors trade in goods from "the surface" — but not any surface the Kingdom knows. Pre-Fracture technology, still warm from sunlight that last existed centuries ago. Elderberry has determined the goods match descriptions from a place called "Speranza." The merchants do not know how they acquire their inventory. It appears in their stalls overnight.',
    'Underground bazaar with warm lighting anomaly, goods arranged on stone slabs',
    'a0000007-0000-0000-0000-000000000001',  -- Deepreach
    20,
    'thriving',
    'embassy',
    '{}',
    'curated'
);

-- === Station Null Embassy Buildings ===

-- Relay Chamber 7 (Station Null ↔ Velgarien)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    'Relay Chamber 7',
    'comms_array',
    'A communications relay that HAVEN refuses to acknowledge in its schematics. Relay Chamber 7 receives signals on frequencies that predate the station''s construction by two hundred years. The signals contain bureaucratic directives in a language Commander Voss recognizes but cannot identify. The chamber is warm. Space is not warm.',
    'Station communications hardware, banks of receivers, anomalous warmth, condensation on walls',
    'a0000008-0000-0000-0000-000000000001',  -- Command Deck
    3,
    'anomalous',
    'embassy',
    '{}',
    'curated'
);

-- Bio-Lab Omega (Station Null ↔ Capybara Kingdom)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    'Bio-Lab Omega',
    'laboratory',
    'A sealed laboratory where Dr. Osei''s predecessor conducted experiments the records describe only as "aquatic." The lab floods periodically — not with station water, but with bioluminescent liquid that smells of copper and earth. The liquid contains microscopic organisms HAVEN cannot classify. They appear to be alive. They appear to be organizing.',
    'Sterile lab space with periodic flooding, bioluminescent residue on walls, containment protocols',
    'a0000009-0000-0000-0000-000000000001',  -- Science Wing
    4,
    'compromised',
    'embassy',
    '{}',
    'curated'
);

-- The Garden (Station Null ↔ Speranza)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    'The Garden',
    'anomaly',
    'An unauthorized cultivation space in the lower decks where Navigator Braun found plants growing in hard vacuum. Mediterranean species — olive, rosemary, tomato — in soil HAVEN identifies as "Tuscan clay, age indeterminate." The air smells of warm earth and hope, which is a substance not previously detected aboard Station Null.',
    'Impossible garden in vacuum, Mediterranean plants in station soil, warm golden light from no source',
    'a000000b-0000-0000-0000-000000000001',  -- Habitation Ring
    6,
    'anomalous',
    'embassy',
    '{}',
    'curated'
);

-- === Speranza Embassy Buildings ===

-- The Paper Room (Speranza ↔ Velgarien)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    'The Paper Room',
    'archive',
    'A chamber deep in the old fortress where Celeste Amara found a cache of perfectly preserved documents. They are written in German, on paper manufactured with industrial precision the Contrade cannot replicate. The documents describe Speranza — by name, with accurate maps — as though it were being administered by an absent bureaucracy. Dottor Ferrara has determined the paper is approximately negative forty years old, which he considers "concerning."',
    'Underground stone chamber, industrial-grade document storage, impossible preservation',
    'a000000f-0000-0000-0000-000000000001',  -- Topside Access
    4,
    'preserved',
    'embassy',
    '{}',
    'curated'
);

-- The Deep Stall (Speranza ↔ Capybara Kingdom)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    'The Deep Stall',
    'market',
    'A market stall in Porto Fantasma that Enzo Moretti discovered after a severe storm. The stall sells bioluminescent goods — mushrooms that glow, fabric woven from spun light, maps of underground passages matching no known geography. The merchant is a capybara. The merchant is always a capybara. No one else finds this unusual. Enzo has started keeping a journal.',
    'Rough market stall with impossible bioluminescent merchandise, warm underground glow',
    'a000000c-0000-0000-0000-000000000001',  -- The Hub
    8,
    'thriving',
    'embassy',
    '{}',
    'curated'
);

-- The Star Tower (Speranza ↔ Station Null)
INSERT INTO buildings (simulation_id, name, building_type, description, style, zone_id, population_capacity, building_condition, special_type, special_attributes, data_source)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    'The Star Tower',
    'observatory',
    'The highest point in Speranza, where Lina Russo built a radio receiver from salvaged parts. It picks up transmissions from approximately 340 light-years away. The transmissions contain Speranza''s coordinates, repeated, along with atmospheric readings matching a station''s failing life support. Someone out there knows where they are. It is unclear whether this is comforting.',
    'Salvaged radio tower on fortress peak, jury-rigged antenna, sweeping views of the ruins above',
    'a000000f-0000-0000-0000-000000000001',  -- Topside Access
    3,
    'functional',
    'embassy',
    '{}',
    'curated'
);

-- ============================================================================
-- 6b. DEMO DATA: Ambassador Agents (new agents dedicated to embassy work)
-- ============================================================================

-- Each simulation gets one dedicated ambassador agent who works across
-- the embassy threshold. These are new characters created specifically
-- for the embassy system — liminality specialists who exist at the
-- boundary between worlds.

-- Velgarien: Inspektor Mueller — Bureau of Impossible Geography
INSERT INTO agents (simulation_id, name, system, character, background, gender, data_source)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Inspektor Mueller',
    'bureaucracy',
    'A meticulous bureaucrat who catalogues impossibilities with the same diligence others reserve for tax forms. Speaks in clipped, precise sentences. Never appears surprised by interdimensional phenomena — treats them as administrative irregularities requiring proper documentation.',
    'Inspektor Mueller was assigned to the Bureau of Impossible Geography in 1987, a department that officially does not exist. He processes boundary anomalies, files cross-reality compliance reports, and maintains the Registry of Threshold Events. He has personally inspected Room 441, The Static Room, and Archive Sub-Level C, and his reports on each run to exactly 441 pages — a coincidence he refuses to acknowledge. His colleagues note that he occasionally speaks in languages he does not know and that his filing cabinets contain documents from next Tuesday.',
    'male',
    'curated'
);

-- Capybara Kingdom: Archivist Mossback — Deepreach Embassy Liaison
INSERT INTO agents (simulation_id, name, system, character, background, gender, data_source)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    'Archivist Mossback',
    'knowledge',
    'An elderly capybara archivist with moss growing in her fur and an unsettling habit of writing in two languages simultaneously — one of which does not exist in the Kingdom. Patient, methodical, and increasingly convinced that reality has filing errors.',
    'Archivist Mossback was the first to document the Threshold in Deepreach, initially classifying it as "a very organized cave." Three months of cross-referencing the documents found there have left her unable to sleep and fluent in German bureaucratic terminology. She oversees the Kingdom''s embassy operations at The Threshold, The Drowned Antenna, and The Warm Market. She has begun writing official reports in a format suspiciously similar to Velgarien government memoranda. She considers this "efficient, not concerning."',
    'female',
    'curated'
);

-- Station Null: Navigator Braun — Anomaly Cartography Officer
INSERT INTO agents (simulation_id, name, system, character, background, gender, data_source)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    'Navigator Braun',
    'navigation',
    'A quiet, intense navigator who was the first to detect the anomalous frequencies. Speaks as though choosing each word from a list of approved vocabulary. Has developed a habit of sketching maps of places she has never visited — maps that turn out to be accurate.',
    'Navigator Braun joined Station Null''s crew as a replacement for Navigator Chen, who resigned after drawing a perfect map of an underground city she had never seen. Braun has since catalogued the station''s three embassy anomalies — Relay Chamber 7, Bio-Lab Omega, and The Garden — with scientific precision and growing unease. She tends the Garden''s impossible Mediterranean plants, hums Italian lullabies she does not remember learning, and has begun receiving coordinates in her dreams that correspond to a settlement on Earth. HAVEN monitors her sleep patterns with what Braun describes as "excessive interest."',
    'female',
    'curated'
);

-- Speranza: Padre Ignazio — Keeper of Impossible Doors
INSERT INTO agents (simulation_id, name, system, character, background, gender, data_source)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    'Padre Ignazio',
    'faith',
    'An elderly former priest turned philosopher-custodian who maintains Speranza''s three embassy sites. Speaks in parables that are technically also maintenance reports. Considers the embassies evidence of a benevolent impossibility, which he treats with equal parts reverence and pragmatism.',
    'Padre Ignazio was Speranza''s chaplain before the Fracture. He discovered The Paper Room while searching for a quiet place to pray, found it already occupied by German documents describing his city''s future, and decided this was either a miracle or a filing error — both of which he felt qualified to address. He now maintains The Paper Room, The Deep Stall, and The Star Tower, treating each embassy site as a parish of sorts. He has learned to read German (badly), developed a fondness for capybara merchants (inexplicably), and keeps a radio log of transmissions from what he calls "the congregation above." The Contrade consider him eccentric but useful.',
    'male',
    'curated'
);

-- ============================================================================
-- 7. DEMO DATA: 6 Embassy Records (name-based lookups)
-- ============================================================================

-- Helper: create embassies using building name lookups
-- The ordered_buildings constraint requires building_a_id < building_b_id (UUID comparison).
-- We handle this with LEAST/GREATEST to always satisfy the constraint.

-- 1. Velgarien ↔ Capybara Kingdom: Room 441 / The Threshold
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if bureaucracy and magic are the same thing?',
    'The Cartographer — identified ache-point between Administrationsbezirk and Deepreach',
    'memory', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Inspektor Mueller', 'role', 'Bureau of Impossible Geography', 'quirk', 'Files cross-reality compliance reports with identical page counts'),
        'ambassador_b', jsonb_build_object('name', 'Archivist Mossback', 'role', 'Deepreach Embassy Liaison', 'quirk', 'Writes German bureaucratic memos in her sleep'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Administrationsbezirk / Deepreach boundary'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'Room 441' AND ba.simulation_id = '10000000-0000-0000-0000-000000000001'
  AND bb.name = 'The Threshold' AND bb.simulation_id = '20000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 2. Velgarien ↔ Station Null: The Static Room / Relay Chamber 7
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if distance is an administrative fiction?',
    'The Cartographer — identified ache-point in Bureau of Communication Standards subbasement',
    'resonance', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Inspektor Mueller', 'role', 'Bureau of Impossible Geography', 'quirk', 'Hears station klaxons in Bureau radio static'),
        'ambassador_b', jsonb_build_object('name', 'Navigator Braun', 'role', 'Anomaly Cartography Officer', 'quirk', 'Maps places she has never visited with perfect accuracy'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Bureau subbasement / Command Deck junction'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'The Static Room' AND ba.simulation_id = '10000000-0000-0000-0000-000000000001'
  AND bb.name = 'Relay Chamber 7' AND bb.simulation_id = '30000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 3. Velgarien ↔ Speranza: Archive Sub-Level C / The Paper Room
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if the past is still being administered?',
    'The Cartographer — identified ache-point in Central Archive lowest level',
    'language', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Inspektor Mueller', 'role', 'Bureau of Impossible Geography', 'quirk', 'Has begun writing reports in Italian without noticing'),
        'ambassador_b', jsonb_build_object('name', 'Padre Ignazio', 'role', 'Keeper of Impossible Doors', 'quirk', 'Dreams in German bureaucratic forms'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Central Archive / Bastione Vecchio convergence'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'Archive Sub-Level C' AND ba.simulation_id = '10000000-0000-0000-0000-000000000001'
  AND bb.name = 'The Paper Room' AND bb.simulation_id = '40000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 4. Capybara Kingdom ↔ Station Null: The Drowned Antenna / Bio-Lab Omega
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if evolution is trying to solve the same problem everywhere?',
    'The Cartographer — identified ache-point in Unterzee deep floor',
    'dream', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Archivist Mossback', 'role', 'Deepreach Embassy Liaison', 'quirk', 'Hears HAVEN diagnostics in the antenna hum'),
        'ambassador_b', jsonb_build_object('name', 'Navigator Braun', 'role', 'Anomaly Cartography Officer', 'quirk', 'Has begun cultivating bioluminescent organisms intentionally'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Unterzee floor / Science Wing membrane'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'The Drowned Antenna' AND ba.simulation_id = '20000000-0000-0000-0000-000000000001'
  AND bb.name = 'Bio-Lab Omega' AND bb.simulation_id = '30000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 5. Capybara Kingdom ↔ Speranza: The Warm Market / The Deep Stall
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if trade predates the traders?',
    'The Cartographer — identified ache-point in Deepreach market anomaly',
    'commerce', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Archivist Mossback', 'role', 'Deepreach Embassy Liaison', 'quirk', 'Has developed a taste for sun-dried tomatoes she has never seen'),
        'ambassador_b', jsonb_build_object('name', 'Padre Ignazio', 'role', 'Keeper of Impossible Doors', 'quirk', 'Keeps a detailed journal of capybara merchant sightings'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Deepreach market / Porto Fantasma convergence'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'The Warm Market' AND ba.simulation_id = '20000000-0000-0000-0000-000000000001'
  AND bb.name = 'The Deep Stall' AND bb.simulation_id = '40000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 6. Station Null ↔ Speranza: The Garden / The Star Tower
INSERT INTO embassies (
    building_a_id, simulation_a_id, building_b_id, simulation_b_id,
    status, connection_type, description, established_by, bleed_vector,
    event_propagation, embassy_metadata
)
SELECT
    LEAST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN ba.simulation_id ELSE bb.simulation_id END,
    GREATEST(ba.id, bb.id), CASE WHEN ba.id < bb.id THEN bb.simulation_id ELSE ba.simulation_id END,
    'active', 'embassy',
    'What if hope is a physical substance that can be transmitted across void?',
    'The Cartographer — identified ache-point in lower decks unauthorized cultivation',
    'desire', true,
    jsonb_build_object(
        'ambassador_a', jsonb_build_object('name', 'Navigator Braun', 'role', 'Anomaly Cartography Officer', 'quirk', 'Tends the impossible plants with Italian lullabies she does not remember learning'),
        'ambassador_b', jsonb_build_object('name', 'Padre Ignazio', 'role', 'Keeper of Impossible Doors', 'quirk', 'Receives transmission coordinates he uses to update his parish map'),
        'protocol', 'THRESHOLD',
        'ache_point', 'Lower decks vacuum garden / Bastione Vecchio peak'
    )
FROM buildings ba, buildings bb
WHERE ba.name = 'The Garden' AND ba.simulation_id = '30000000-0000-0000-0000-000000000001'
  AND bb.name = 'The Star Tower' AND bb.simulation_id = '40000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. UPDATE special_attributes on embassy buildings with partner info
-- ============================================================================

-- Update all embassy buildings with their partner info from the embassies table
-- This enables frontend to detect embassy buildings without a JOIN query.

-- Update building_a entries
UPDATE buildings SET special_attributes = jsonb_build_object(
    'embassy_id', e.id,
    'partner_building_id', e.building_b_id,
    'partner_simulation_id', e.simulation_b_id,
    'partner_building_name', pb.name
)
FROM embassies e
JOIN buildings pb ON pb.id = e.building_b_id
WHERE buildings.id = e.building_a_id;

-- Update building_b entries
UPDATE buildings SET special_attributes = jsonb_build_object(
    'embassy_id', e.id,
    'partner_building_id', e.building_a_id,
    'partner_simulation_id', e.simulation_a_id,
    'partner_building_name', pa.name
)
FROM embassies e
JOIN buildings pa ON pa.id = e.building_a_id
WHERE buildings.id = e.building_b_id;
