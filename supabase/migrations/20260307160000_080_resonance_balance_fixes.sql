-- ============================================================================
-- Migration 080: Resonance Balance Fixes
-- ============================================================================
-- Fixes bugs and rebalances the resonance gameplay integration:
--
-- 1. fn_target_zone_pressure: Fix NULL bug when zone_id not found (returned
--    cap instead of 0.0). Reduce cap from 0.06 to 0.04.
--
-- 2. fn_resonance_operative_modifier: Add infiltrator oppositions (The Entropy,
--    The Devouring Mother). Apply 0.5x decay for subsiding resonances. Reduce
--    clamp from [-0.04, +0.06] to [-0.04, +0.04].
--
-- 3. fn_attacker_pressure_penalty: New function — attacker's own zone pressure
--    reduces mission effectiveness (defender compensation).
--
-- 4. active_resonances view: Exclude archived resonances.
-- ============================================================================


-- ── 1. Fix fn_target_zone_pressure ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_target_zone_pressure(
  p_simulation_id UUID,
  p_zone_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  pressure NUMERIC := 0.0;
  cap NUMERIC := 0.04;
BEGIN
  IF p_zone_id IS NOT NULL THEN
    -- Specific zone
    SELECT COALESCE(total_pressure, 0.0)
    INTO pressure
    FROM mv_zone_stability
    WHERE zone_id = p_zone_id
    LIMIT 1;

    -- FIX: SELECT INTO sets variable to NULL when no rows found
    IF NOT FOUND THEN
      pressure := 0.0;
    END IF;
  ELSE
    -- Highest-pressure zone in simulation
    SELECT COALESCE(MAX(total_pressure), 0.0)
    INTO pressure
    FROM mv_zone_stability
    WHERE simulation_id = p_simulation_id;
  END IF;

  -- Scale: pressure (0.0-1.0) * cap (0.04) = max +0.04
  RETURN LEAST(cap, pressure * cap);
END;
$$ LANGUAGE plpgsql STABLE;


-- ── 2. Rebalance fn_resonance_operative_modifier ───────────────────────────

CREATE OR REPLACE FUNCTION fn_resonance_operative_modifier(
  p_simulation_id UUID,
  p_operative_type TEXT
) RETURNS NUMERIC AS $$
DECLARE
  net_modifier NUMERIC := 0.0;
BEGIN
  -- Sum modifiers from all active resonances affecting this simulation.
  -- Each resonance's archetype maps to aligned (+0.03) or opposed (-0.02)
  -- operative types, weighted by effective_magnitude.
  -- Subsiding resonances apply at 50% strength (decay).
  SELECT COALESCE(SUM(
    alignment.modifier
    * ri.effective_magnitude
    * CASE WHEN sr.status = 'subsiding' THEN 0.5 ELSE 1.0 END
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

    -- The Devouring Mother (pandemic): spy/propagandist aligned, infiltrator opposed
    ('The Devouring Mother', 'spy',           0.03),
    ('The Devouring Mother', 'propagandist',  0.03),
    ('The Devouring Mother', 'infiltrator',  -0.02),

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

    -- The Entropy (environmental_disaster): saboteur/assassin aligned, infiltrator opposed
    ('The Entropy',          'saboteur',      0.03),
    ('The Entropy',          'assassin',      0.03),
    ('The Entropy',          'infiltrator',  -0.02)
  ) AS alignment(archetype, operative_type, modifier)
    ON alignment.archetype = sr.archetype
    AND alignment.operative_type = p_operative_type
  WHERE ri.simulation_id = p_simulation_id
    AND ri.status IN ('completed', 'generating')
    AND sr.status IN ('impacting', 'subsiding')
    AND sr.deleted_at IS NULL;

  -- Clamp to [-0.04, +0.04] (reduced from +0.06)
  RETURN GREATEST(-0.04, LEAST(0.04, net_modifier));
END;
$$ LANGUAGE plpgsql STABLE;


-- ── 3. New: fn_attacker_pressure_penalty ───────────────────────────────────
-- Attacker's own zone instability reduces mission effectiveness.
-- Max penalty: -0.04 at full pressure. This compensates the victim penalty
-- by making destabilized attackers less effective.

CREATE OR REPLACE FUNCTION fn_attacker_pressure_penalty(
  p_simulation_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  avg_pressure NUMERIC := 0.0;
  cap NUMERIC := 0.04;
BEGIN
  SELECT COALESCE(AVG(total_pressure), 0.0)
  INTO avg_pressure
  FROM mv_zone_stability
  WHERE simulation_id = p_simulation_id;

  -- Negative modifier: own instability hurts outbound operations
  RETURN -1.0 * LEAST(cap, avg_pressure * cap);
END;
$$ LANGUAGE plpgsql STABLE;


-- ── 4. Fix active_resonances view ──────────────────────────────────────────
-- Exclude archived resonances — they should not appear as "active".

CREATE OR REPLACE VIEW active_resonances AS
  SELECT * FROM substrate_resonances
  WHERE deleted_at IS NULL
    AND status != 'archived';
