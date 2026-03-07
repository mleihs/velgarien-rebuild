-- ============================================================================
-- Migration 075: Seed Resonance Profiles + Event Type Maps
-- ============================================================================
-- Seeds simulation_settings with resonance_profile (susceptibility per
-- archetype signature) and resonance_event_type_map (which event types
-- each signature spawns).
-- ============================================================================

-- ── Default event type map (same for all simulations) ───────────────────────

INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_event_type_map', '{
  "economic_tremor":     ["trade", "crisis", "social"],
  "conflict_wave":       ["military", "intrigue", "social"],
  "biological_tide":     ["social", "crisis", "eldritch"],
  "elemental_surge":     ["crisis", "nautical", "discovery"],
  "authority_fracture":  ["intrigue", "military", "social"],
  "innovation_spark":    ["discovery", "trade", "intrigue"],
  "consciousness_drift": ["social", "religious", "discovery"],
  "decay_bloom":         ["crisis", "eldritch", "social"]
}'::jsonb
FROM simulations
WHERE status = 'active' AND simulation_type = 'template'
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;


-- ── Per-simulation resonance profiles ───────────────────────────────────────

-- Velgarien (surveillance state): authority/conflict high, innovation/consciousness low
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
VALUES ('10000000-0000-0000-0000-000000000001', 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 1.2,
  "conflict_wave": 1.5,
  "biological_tide": 0.8,
  "elemental_surge": 0.6,
  "authority_fracture": 1.8,
  "innovation_spark": 0.5,
  "consciousness_drift": 0.4,
  "decay_bloom": 1.0
}'::jsonb)
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- The Gaslit Reach (organic underwater): biological/elemental high, authority low
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
VALUES ('20000000-0000-0000-0000-000000000001', 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 1.0,
  "conflict_wave": 0.8,
  "biological_tide": 1.5,
  "elemental_surge": 1.3,
  "authority_fracture": 0.7,
  "innovation_spark": 0.9,
  "consciousness_drift": 1.4,
  "decay_bloom": 1.2
}'::jsonb)
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Station Null (AI-run station): innovation/decay high, elemental low
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
VALUES ('30000000-0000-0000-0000-000000000001', 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 0.7,
  "conflict_wave": 1.0,
  "biological_tide": 0.9,
  "elemental_surge": 0.5,
  "authority_fracture": 1.2,
  "innovation_spark": 1.6,
  "consciousness_drift": 1.3,
  "decay_bloom": 1.5
}'::jsonb)
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Speranza (post-apocalyptic): elemental/conflict/economic high, consciousness low
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
VALUES ('40000000-0000-0000-0000-000000000001', 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 1.3,
  "conflict_wave": 1.4,
  "biological_tide": 1.1,
  "elemental_surge": 1.8,
  "authority_fracture": 1.0,
  "innovation_spark": 1.2,
  "consciousness_drift": 0.7,
  "decay_bloom": 0.8
}'::jsonb)
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Cite des Dames (literary utopia): consciousness/authority high, economic/elemental low
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
VALUES ('50000000-0000-0000-0000-000000000001', 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 0.6,
  "conflict_wave": 0.9,
  "biological_tide": 0.7,
  "elemental_surge": 0.5,
  "authority_fracture": 1.3,
  "innovation_spark": 1.0,
  "consciousness_drift": 1.8,
  "decay_bloom": 0.8
}'::jsonb)
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- All other simulations: flat 1.0 across all signatures (custom sims)
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_profile', '{
  "economic_tremor": 1.0,
  "conflict_wave": 1.0,
  "biological_tide": 1.0,
  "elemental_surge": 1.0,
  "authority_fracture": 1.0,
  "innovation_spark": 1.0,
  "consciousness_drift": 1.0,
  "decay_bloom": 1.0
}'::jsonb
FROM simulations
WHERE status = 'active'
  AND simulation_type = 'template'
  AND id NOT IN (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;
