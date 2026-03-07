-- ============================================================================
-- Migration 076: Resonance Postgres Derivation Functions
-- ============================================================================
-- Moves category→signature/archetype derivation and susceptibility lookup
-- from Python (resonance_service.py) into Postgres for consistency with
-- the project's DB-first pattern.
--
-- Functions:
--   fn_derive_resonance_fields()        — BEFORE INSERT trigger
--   fn_get_resonance_susceptibility()   — utility: returns susceptibility float
--   fn_get_resonance_event_types()      — utility: returns event type array
-- ============================================================================


-- ── 1. Allow NULL signature/archetype on INSERT (trigger fills them) ─────────

ALTER TABLE substrate_resonances
  ALTER COLUMN resonance_signature DROP NOT NULL,
  ALTER COLUMN archetype DROP NOT NULL;

ALTER TABLE substrate_resonances
  ALTER COLUMN resonance_signature SET DEFAULT NULL,
  ALTER COLUMN archetype SET DEFAULT NULL;


-- ── 2. fn_derive_resonance_fields() — BEFORE INSERT trigger ─────────────────

CREATE OR REPLACE FUNCTION fn_derive_resonance_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Derive signature + archetype from source_category
  IF NEW.resonance_signature IS NULL OR NEW.archetype IS NULL THEN
    SELECT sig, arch INTO NEW.resonance_signature, NEW.archetype
    FROM (VALUES
      ('economic_crisis',        'economic_tremor',     'The Tower'),
      ('military_conflict',      'conflict_wave',       'The Shadow'),
      ('pandemic',               'biological_tide',     'The Devouring Mother'),
      ('natural_disaster',       'elemental_surge',     'The Deluge'),
      ('political_upheaval',     'authority_fracture',  'The Overthrow'),
      ('tech_breakthrough',      'innovation_spark',    'The Prometheus'),
      ('cultural_shift',         'consciousness_drift', 'The Awakening'),
      ('environmental_disaster', 'decay_bloom',         'The Entropy')
    ) AS m(cat, sig, arch)
    WHERE m.cat = NEW.source_category;
  END IF;

  -- Derive affected_event_types if empty
  IF array_length(NEW.affected_event_types, 1) IS NULL THEN
    SELECT types INTO NEW.affected_event_types
    FROM (VALUES
      ('economic_tremor',     ARRAY['trade','crisis','social']),
      ('conflict_wave',       ARRAY['military','intrigue','social']),
      ('biological_tide',     ARRAY['social','crisis','eldritch']),
      ('elemental_surge',     ARRAY['crisis','nautical','discovery']),
      ('authority_fracture',  ARRAY['intrigue','military','social']),
      ('innovation_spark',    ARRAY['discovery','trade','intrigue']),
      ('consciousness_drift', ARRAY['social','religious','discovery']),
      ('decay_bloom',         ARRAY['crisis','eldritch','social'])
    ) AS m(sig, types)
    WHERE m.sig = NEW.resonance_signature;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_derive_resonance_fields ON substrate_resonances;
CREATE TRIGGER trg_derive_resonance_fields
  BEFORE INSERT ON substrate_resonances
  FOR EACH ROW
  EXECUTE FUNCTION fn_derive_resonance_fields();


-- ── 3. fn_get_resonance_susceptibility() ─────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_resonance_susceptibility(
  p_simulation_id UUID,
  p_signature TEXT
) RETURNS NUMERIC AS $$
  SELECT COALESCE(
    (SELECT (setting_value ->> p_signature)::numeric
     FROM simulation_settings
     WHERE simulation_id = p_simulation_id
       AND category = 'game_mechanics'
       AND setting_key = 'resonance_profile'),
    1.0
  );
$$ LANGUAGE sql STABLE;


-- ── 4. fn_get_resonance_event_types() ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_get_resonance_event_types(
  p_simulation_id UUID,
  p_signature TEXT
) RETURNS TEXT[] AS $$
  SELECT COALESCE(
    (SELECT ARRAY(
       SELECT jsonb_array_elements_text(setting_value -> p_signature)
     )
     FROM simulation_settings
     WHERE simulation_id = p_simulation_id
       AND category = 'game_mechanics'
       AND setting_key = 'resonance_event_type_map'
       AND setting_value ? p_signature),
    -- Fall back to defaults
    CASE p_signature
      WHEN 'economic_tremor'     THEN ARRAY['trade','crisis','social']
      WHEN 'conflict_wave'       THEN ARRAY['military','intrigue','social']
      WHEN 'biological_tide'     THEN ARRAY['social','crisis','eldritch']
      WHEN 'elemental_surge'     THEN ARRAY['crisis','nautical','discovery']
      WHEN 'authority_fracture'  THEN ARRAY['intrigue','military','social']
      WHEN 'innovation_spark'    THEN ARRAY['discovery','trade','intrigue']
      WHEN 'consciousness_drift' THEN ARRAY['social','religious','discovery']
      WHEN 'decay_bloom'         THEN ARRAY['crisis','eldritch','social']
      ELSE ARRAY[]::TEXT[]
    END
  );
$$ LANGUAGE sql STABLE;
