-- ============================================================================
-- Migration 078: Resonance Gameplay Integration Functions
-- ============================================================================
-- Provides Postgres functions that bridge the resonance/event system with
-- the operative warfare system (Phase 1 of "The Living Fracture").
--
-- Functions:
--   fn_resonance_operative_modifier(sim_id, operative_type) → NUMERIC
--     Aggregates active resonance impacts for a simulation, maps archetype
--     to aligned/opposed operative types, returns net modifier clamped
--     to [-0.04, +0.06].
--
--   fn_target_zone_pressure(sim_id, zone_id?) → NUMERIC
--     Returns total_pressure from mv_zone_stability. If no zone_id,
--     returns max-pressure zone. Multiplied by cap (default 0.06).
-- ============================================================================


-- ── 1. Archetype → Operative Alignment Lookup ────────────────────────────────
-- Inline VALUES used by fn_resonance_operative_modifier.
-- aligned_bonus = +0.03 per match, opposed_penalty = -0.02 per match.
-- Each row: (archetype, operative_type, modifier)

-- ── 2. fn_resonance_operative_modifier ───────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_resonance_operative_modifier(
  p_simulation_id UUID,
  p_operative_type TEXT
) RETURNS NUMERIC AS $$
DECLARE
  net_modifier NUMERIC := 0.0;
BEGIN
  -- Sum modifiers from all active (impacting) resonances affecting this simulation.
  -- Each resonance's archetype maps to aligned (+0.03) or opposed (-0.02) operative
  -- types, weighted by effective_magnitude.
  SELECT COALESCE(SUM(
    alignment.modifier * ri.effective_magnitude
  ), 0.0)
  INTO net_modifier
  FROM resonance_impacts ri
  JOIN substrate_resonances sr ON sr.id = ri.resonance_id
  JOIN (VALUES
    -- The Shadow (military_conflict): spy/assassin aligned, propagandist opposed
    ('The Shadow',           'spy',           0.03),
    ('The Shadow',           'assassin',      0.03),
    ('The Shadow',           'propagandist', -0.02),

    -- The Tower (economic_crisis): saboteur/infiltrator aligned
    ('The Tower',            'saboteur',      0.03),
    ('The Tower',            'infiltrator',   0.03),

    -- The Devouring Mother (pandemic): spy/propagandist aligned
    ('The Devouring Mother', 'spy',           0.03),
    ('The Devouring Mother', 'propagandist',  0.03),

    -- The Deluge (natural_disaster): saboteur/infiltrator aligned, spy opposed
    ('The Deluge',           'saboteur',      0.03),
    ('The Deluge',           'infiltrator',   0.03),
    ('The Deluge',           'spy',          -0.02),

    -- The Overthrow (political_upheaval): propagandist/infiltrator aligned
    ('The Overthrow',        'propagandist',  0.03),
    ('The Overthrow',        'infiltrator',   0.03),

    -- The Prometheus (tech_breakthrough): spy/infiltrator aligned, saboteur opposed
    ('The Prometheus',       'spy',           0.03),
    ('The Prometheus',       'infiltrator',   0.03),
    ('The Prometheus',       'saboteur',     -0.02),

    -- The Awakening (cultural_shift): propagandist/spy aligned, assassin opposed
    ('The Awakening',        'propagandist',  0.03),
    ('The Awakening',        'spy',           0.03),
    ('The Awakening',        'assassin',     -0.02),

    -- The Entropy (environmental_disaster): saboteur/assassin aligned
    ('The Entropy',          'saboteur',      0.03),
    ('The Entropy',          'assassin',      0.03)
  ) AS alignment(archetype, operative_type, modifier)
    ON alignment.archetype = sr.archetype
    AND alignment.operative_type = p_operative_type
  WHERE ri.simulation_id = p_simulation_id
    AND ri.status IN ('completed', 'generating')
    AND sr.status IN ('impacting', 'subsiding')
    AND sr.deleted_at IS NULL;

  -- Clamp to [-0.04, +0.06]
  RETURN GREATEST(-0.04, LEAST(0.06, net_modifier));
END;
$$ LANGUAGE plpgsql STABLE;


-- ── 3. fn_target_zone_pressure ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_target_zone_pressure(
  p_simulation_id UUID,
  p_zone_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  pressure NUMERIC := 0.0;
  cap NUMERIC := 0.06;
BEGIN
  IF p_zone_id IS NOT NULL THEN
    -- Specific zone
    SELECT COALESCE(total_pressure, 0.0)
    INTO pressure
    FROM mv_zone_stability
    WHERE zone_id = p_zone_id
    LIMIT 1;
  ELSE
    -- Highest-pressure zone in simulation
    SELECT COALESCE(MAX(total_pressure), 0.0)
    INTO pressure
    FROM mv_zone_stability
    WHERE simulation_id = p_simulation_id;
  END IF;

  -- Scale: pressure (0.0-1.0) * cap (0.06) = max +0.06
  RETURN LEAST(cap, pressure * cap);
END;
$$ LANGUAGE plpgsql STABLE;
