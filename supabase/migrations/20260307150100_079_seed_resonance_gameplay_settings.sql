-- ============================================================================
-- Migration 079: Seed Resonance Gameplay Settings
-- ============================================================================
-- Per-simulation settings for resonance combat integration (Phase 1).
-- All values are configurable per simulation. Set caps to 0 to fully
-- disable resonance combat effects.
-- ============================================================================

-- Resonance operative pressure cap: max bonus from zone pressure on missions
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_operative_pressure_cap', '"0.06"'::jsonb
FROM simulations
WHERE status = 'active' AND simulation_type = 'template'
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Resonance operative modifier cap: max bonus from archetype alignment
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_operative_modifier_cap', '"0.06"'::jsonb
FROM simulations
WHERE status = 'active' AND simulation_type = 'template'
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Resonance operative penalty cap: max penalty from archetype opposition
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_operative_penalty_cap', '"-0.04"'::jsonb
FROM simulations
WHERE status = 'active' AND simulation_type = 'template'
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Bot resonance awareness: whether bots read world state
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT id, 'game_mechanics', 'resonance_bot_awareness_enabled', '"true"'::jsonb
FROM simulations
WHERE status = 'active' AND simulation_type = 'template'
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;
