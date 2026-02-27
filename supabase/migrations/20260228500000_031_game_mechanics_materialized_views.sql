-- Migration 031: Game Mechanics — Data-Driven Materialized Views
--
-- Architectural approach: game_weight on simulation_taxonomies
-- Instead of hardcoding CASE statements for condition→factor, security→factor,
-- building_type→criticality, we add a `game_weight` column to simulation_taxonomies.
-- The materialized views JOIN against taxonomies to get weights, with a fallback default
-- for unmatched values. This makes the system:
--   - Data-driven: admins can tune weights per simulation
--   - Extensible: new taxonomy values automatically work
--   - Per-simulation: Speranza's "makeshift" can function differently from Velgarien's
--
-- Creates:
--   1. game_weight column on simulation_taxonomies
--   2. Missing taxonomy entries for actual building_condition values in data
--   3. game_weight values for building_condition, security_level, building_type
--   4. mv_building_readiness   — staffing × qualification × condition
--   5. mv_zone_stability       — infrastructure + security - event_pressure
--   6. mv_embassy_effectiveness — building_health × ambassador × vector_alignment
--   7. mv_simulation_health    — zone_stability + diplomacy + bleed
--   8. Refresh functions + notification triggers

-- ============================================================================
-- 1. ADD game_weight COLUMN TO simulation_taxonomies
-- ============================================================================
-- Semantic meaning depends on taxonomy_type:
--   building_condition: condition factor (0.0–1.0)
--   security_level:     security factor (0.0–1.0)
--   building_type:      criticality weight (0.5–2.0)

ALTER TABLE simulation_taxonomies
  ADD COLUMN IF NOT EXISTS game_weight NUMERIC(4,2) DEFAULT NULL;

COMMENT ON COLUMN simulation_taxonomies.game_weight IS
  'Numeric weight used by game mechanics. Meaning varies by taxonomy_type: '
  'building_condition=condition factor (0-1), security_level=security factor (0-1), '
  'building_type=criticality weight (0.5-2.0). NULL means not yet configured.';


-- ============================================================================
-- 2. ADD MISSING building_condition TAXONOMY VALUES
-- ============================================================================
-- Some buildings (embassies, special) have condition values not in their simulation's
-- taxonomy. Add them so the game_weight JOIN always finds a match.

-- Helper: insert taxonomy value if it doesn't exist for a simulation
CREATE OR REPLACE FUNCTION _insert_taxonomy_if_missing(
  p_sim_id UUID,
  p_type TEXT,
  p_value TEXT,
  p_label_en TEXT,
  p_label_de TEXT,
  p_sort_order INT,
  p_game_weight NUMERIC
) RETURNS void AS $$
BEGIN
  INSERT INTO simulation_taxonomies (simulation_id, taxonomy_type, value, label, sort_order, is_active, game_weight)
  VALUES (p_sim_id, p_type, p_value,
    jsonb_build_object('en', p_label_en, 'de', p_label_de),
    p_sort_order, true, p_game_weight)
  ON CONFLICT (simulation_id, taxonomy_type, value) DO UPDATE
    SET game_weight = EXCLUDED.game_weight
    WHERE simulation_taxonomies.game_weight IS NULL;
END;
$$ LANGUAGE plpgsql;

-- All 4 simulation IDs (deterministic)
DO $$
DECLARE
  sim_ids UUID[] := ARRAY[
    '10000000-0000-0000-0000-000000000001'::UUID,  -- Velgarien
    '20000000-0000-0000-0000-000000000001'::UUID,  -- Capybara Kingdom
    '30000000-0000-0000-0000-000000000001'::UUID,  -- Station Null
    '40000000-0000-0000-0000-000000000001'::UUID   -- Speranza
  ];
  sid UUID;
BEGIN
  FOREACH sid IN ARRAY sim_ids LOOP
    -- Standard conditions (ensure all sims have the full set)
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'excellent',   'Excellent',   'Ausgezeichnet', 10, 1.00);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'good',        'Good',        'Gut',           20, 0.85);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'fair',        'Fair',        'Befriedigend',  30, 0.70);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'poor',        'Poor',        'Schlecht',      40, 0.50);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'critical',    'Critical',    'Kritisch',      50, 0.30);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'ruined',      'Ruined',      'Ruine',         60, 0.20);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'makeshift',   'Makeshift',   'Behelfsmäßig',  45, 0.40);
    -- Special/embassy conditions
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'anomalous',   'Anomalous',   'Anomal',        70, 0.60);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'sealed',      'Sealed',      'Versiegelt',    71, 0.60);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'restricted',  'Restricted',  'Eingeschränkt', 72, 0.60);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'operational', 'Operational',  'Betriebsbereit', 15, 0.85);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'thriving',    'Thriving',    'Blühend',       12, 0.90);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'compromised', 'Compromised', 'Kompromittiert', 48, 0.35);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'functional',  'Functional',  'Funktional',    25, 0.75);
    PERFORM _insert_taxonomy_if_missing(sid, 'building_condition', 'preserved',   'Preserved',   'Erhalten',      18, 0.80);
  END LOOP;
END;
$$;


-- ============================================================================
-- 3. SET game_weight FOR EXISTING TAXONOMY VALUES
-- ============================================================================

-- building_condition: set game_weight where not already set
UPDATE simulation_taxonomies SET game_weight = CASE value
  WHEN 'excellent'   THEN 1.00
  WHEN 'good'        THEN 0.85
  WHEN 'operational' THEN 0.85
  WHEN 'thriving'    THEN 0.90
  WHEN 'preserved'   THEN 0.80
  WHEN 'functional'  THEN 0.75
  WHEN 'fair'        THEN 0.70
  WHEN 'poor'        THEN 0.50
  WHEN 'makeshift'   THEN 0.40
  WHEN 'compromised' THEN 0.35
  WHEN 'critical'    THEN 0.30
  WHEN 'ruined'      THEN 0.20
  WHEN 'anomalous'   THEN 0.60
  WHEN 'sealed'      THEN 0.60
  WHEN 'restricted'  THEN 0.60
  ELSE 0.50
END
WHERE taxonomy_type = 'building_condition' AND game_weight IS NULL;

-- security_level: set game_weight
UPDATE simulation_taxonomies SET game_weight = CASE value
  WHEN 'restricted' THEN 1.00
  WHEN 'high'       THEN 0.85
  WHEN 'medium'     THEN 0.55
  WHEN 'low'        THEN 0.30
  ELSE 0.50
END
WHERE taxonomy_type = 'security_level' AND game_weight IS NULL;

-- building_type: set game_weight (criticality)
UPDATE simulation_taxonomies SET game_weight = CASE value
  -- Critical infrastructure: 2.0
  WHEN 'medical'        THEN 2.00
  WHEN 'military'       THEN 2.00
  WHEN 'infrastructure' THEN 2.00
  WHEN 'command'        THEN 2.00
  -- Important civic: 1.5
  WHEN 'government'     THEN 1.50
  WHEN 'market'         THEN 1.50
  WHEN 'commercial'     THEN 1.50
  WHEN 'trading_post'   THEN 1.50
  WHEN 'comms_array'    THEN 1.50
  -- Standard: 1.0
  WHEN 'residential'    THEN 1.00
  WHEN 'industrial'     THEN 1.00
  WHEN 'archive'        THEN 1.00
  WHEN 'laboratory'     THEN 1.00
  WHEN 'social'         THEN 1.00
  -- Luxury/special: 0.5
  WHEN 'religious'      THEN 0.50
  WHEN 'observatory'    THEN 0.50
  WHEN 'special'        THEN 0.50
  WHEN 'anomaly'        THEN 0.50
  WHEN 'restricted_zone' THEN 0.50
  -- Cultural: 0.75
  WHEN 'cultural'       THEN 0.75
  ELSE 1.00
END
WHERE taxonomy_type = 'building_type' AND game_weight IS NULL;

-- Clean up helper
DROP FUNCTION _insert_taxonomy_if_missing;


-- ============================================================================
-- 4. HELPER: Get game_weight with fallback
-- ============================================================================
-- Used only as fallback when the taxonomy JOIN misses (should be rare after
-- step 2 above).

CREATE OR REPLACE FUNCTION game_weight_fallback(taxonomy_type text, value text)
RETURNS numeric AS $$
BEGIN
  IF taxonomy_type = 'building_condition' THEN
    RETURN CASE lower(trim(COALESCE(value, '')))
      WHEN 'excellent' THEN 1.0  WHEN 'thriving' THEN 0.9
      WHEN 'good' THEN 0.85     WHEN 'operational' THEN 0.85
      WHEN 'preserved' THEN 0.8 WHEN 'functional' THEN 0.75
      WHEN 'fair' THEN 0.7      WHEN 'poor' THEN 0.5
      WHEN 'makeshift' THEN 0.4 WHEN 'compromised' THEN 0.35
      WHEN 'critical' THEN 0.3  WHEN 'ruined' THEN 0.2
      WHEN 'anomalous' THEN 0.6 WHEN 'sealed' THEN 0.6
      WHEN 'restricted' THEN 0.6
      ELSE 0.5
    END;
  ELSIF taxonomy_type = 'security_level' THEN
    RETURN CASE lower(trim(COALESCE(value, '')))
      WHEN 'restricted' THEN 1.0 WHEN 'high' THEN 0.85
      WHEN 'medium' THEN 0.55   WHEN 'low' THEN 0.3
      ELSE 0.5
    END;
  ELSIF taxonomy_type = 'building_type' THEN
    RETURN CASE lower(trim(COALESCE(value, '')))
      WHEN 'medical' THEN 2.0   WHEN 'military' THEN 2.0
      WHEN 'infrastructure' THEN 2.0 WHEN 'command' THEN 2.0
      WHEN 'government' THEN 1.5 WHEN 'market' THEN 1.5
      WHEN 'commercial' THEN 1.5 WHEN 'trading_post' THEN 1.5
      WHEN 'comms_array' THEN 1.5
      WHEN 'religious' THEN 0.5 WHEN 'observatory' THEN 0.5
      WHEN 'special' THEN 0.5  WHEN 'anomaly' THEN 0.5
      WHEN 'cultural' THEN 0.75
      ELSE 1.0
    END;
  END IF;
  RETURN 1.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================================
-- 5. MATERIALIZED VIEW: mv_building_readiness
-- ============================================================================
-- Per-building metric: staffing_ratio × qualification_match × condition_factor
-- Uses data-driven game_weight from simulation_taxonomies with fallback.

CREATE MATERIALIZED VIEW mv_building_readiness AS
WITH agent_counts AS (
  SELECT
    bar.building_id,
    COUNT(DISTINCT bar.agent_id) AS assigned_agents
  FROM building_agent_relations bar
  JOIN agents a ON a.id = bar.agent_id AND a.deleted_at IS NULL
  GROUP BY bar.building_id
),
profession_match AS (
  -- How well assigned agents match building's profession requirements
  SELECT
    bpr.building_id,
    COALESCE(AVG(
      CASE
        WHEN ap.qualification_level >= bpr.min_qualification_level THEN 1.0
        WHEN ap.qualification_level IS NOT NULL THEN 0.3
        ELSE 0.3
      END
    ), 0.5) AS match_score,
    COUNT(bpr.id) AS requirement_count
  FROM building_profession_requirements bpr
  LEFT JOIN building_agent_relations bar ON bar.building_id = bpr.building_id
  LEFT JOIN agents a ON a.id = bar.agent_id AND a.deleted_at IS NULL
  LEFT JOIN agent_professions ap ON ap.agent_id = a.id AND ap.profession = bpr.profession
  GROUP BY bpr.building_id
)
SELECT
  b.id AS building_id,
  b.simulation_id,
  b.zone_id,
  b.name AS building_name,
  b.building_type,
  b.building_condition,
  b.population_capacity,
  b.special_type,
  COALESCE(ac.assigned_agents, 0) AS assigned_agents,

  -- Staffing ratio (capped at 1.5)
  CASE
    WHEN COALESCE(b.population_capacity, 0) = 0 THEN
      CASE WHEN COALESCE(ac.assigned_agents, 0) > 0 THEN 1.0 ELSE 0.0 END
    ELSE LEAST(1.5,
      COALESCE(ac.assigned_agents, 0)::numeric / GREATEST(b.population_capacity, 1)
    )
  END AS staffing_ratio,

  -- Staffing status label
  CASE
    WHEN COALESCE(b.population_capacity, 0) = 0 THEN 'n/a'
    WHEN COALESCE(ac.assigned_agents, 0)::numeric / GREATEST(b.population_capacity, 1) < 0.5 THEN 'critically_understaffed'
    WHEN COALESCE(ac.assigned_agents, 0)::numeric / GREATEST(b.population_capacity, 1) < 0.8 THEN 'understaffed'
    WHEN COALESCE(ac.assigned_agents, 0)::numeric / GREATEST(b.population_capacity, 1) <= 1.2 THEN 'operational'
    ELSE 'overcrowded'
  END AS staffing_status,

  -- Qualification match (1.0 if no requirements)
  CASE
    WHEN pm.requirement_count IS NULL OR pm.requirement_count = 0 THEN 1.0
    ELSE COALESCE(pm.match_score, 0.5)
  END AS qualification_match,

  -- Condition factor — data-driven from taxonomy game_weight, with fallback
  COALESCE(
    st_cond.game_weight,
    game_weight_fallback('building_condition', b.building_condition)
  ) AS condition_factor,

  -- Criticality weight — data-driven from taxonomy game_weight, with fallback
  COALESCE(
    st_type.game_weight,
    game_weight_fallback('building_type', b.building_type)
  ) AS criticality_weight,

  -- MASTER METRIC: Building Readiness
  LEAST(1.0, GREATEST(0.0,
    LEAST(1.0,
      CASE
        WHEN COALESCE(b.population_capacity, 0) = 0 THEN
          CASE WHEN COALESCE(ac.assigned_agents, 0) > 0 THEN 1.0 ELSE 0.0 END
        ELSE COALESCE(ac.assigned_agents, 0)::numeric / GREATEST(b.population_capacity, 1)
      END
    )
    * CASE
        WHEN pm.requirement_count IS NULL OR pm.requirement_count = 0 THEN 1.0
        ELSE COALESCE(pm.match_score, 0.5)
      END
    * COALESCE(
        st_cond.game_weight,
        game_weight_fallback('building_condition', b.building_condition)
      )
  )) AS readiness

FROM buildings b
LEFT JOIN agent_counts ac ON ac.building_id = b.id
LEFT JOIN profession_match pm ON pm.building_id = b.id
-- Data-driven condition factor
LEFT JOIN simulation_taxonomies st_cond ON
  st_cond.simulation_id = b.simulation_id
  AND st_cond.taxonomy_type = 'building_condition'
  AND st_cond.value = b.building_condition
-- Data-driven criticality weight
LEFT JOIN simulation_taxonomies st_type ON
  st_type.simulation_id = b.simulation_id
  AND st_type.taxonomy_type = 'building_type'
  AND st_type.value = b.building_type
WHERE b.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_mv_building_readiness_pk ON mv_building_readiness (building_id);
CREATE INDEX idx_mv_building_readiness_sim ON mv_building_readiness (simulation_id);
CREATE INDEX idx_mv_building_readiness_zone ON mv_building_readiness (zone_id);


-- ============================================================================
-- 6. MATERIALIZED VIEW: mv_zone_stability
-- ============================================================================
-- infrastructure_score × 0.5 + security_factor × 0.3 - event_pressure × 0.2

CREATE MATERIALIZED VIEW mv_zone_stability AS
WITH zone_infrastructure AS (
  SELECT
    br.zone_id,
    br.simulation_id,
    CASE
      WHEN SUM(br.criticality_weight) = 0 THEN 0.5
      ELSE SUM(br.readiness * br.criticality_weight) / SUM(br.criticality_weight)
    END AS infrastructure_score,
    COUNT(*) AS building_count,
    SUM(br.assigned_agents) AS total_agents,
    SUM(br.population_capacity) AS total_capacity,
    COUNT(*) FILTER (WHERE br.staffing_status = 'critically_understaffed') AS critical_understaffed_count,
    AVG(br.readiness) AS avg_readiness
  FROM mv_building_readiness br
  WHERE br.zone_id IS NOT NULL
  GROUP BY br.zone_id, br.simulation_id
),
zone_event_pressure AS (
  SELECT
    z.id AS zone_id,
    z.simulation_id,
    LEAST(1.0,
      COUNT(DISTINCT e.id) FILTER (
        WHERE e.impact_level >= 6
        AND e.occurred_at >= (now() - interval '30 days')
        AND e.deleted_at IS NULL
      )::numeric / 10.0
    ) AS event_pressure
  FROM zones z
  LEFT JOIN buildings b ON b.zone_id = z.id AND b.deleted_at IS NULL
  LEFT JOIN building_event_relations ber ON ber.building_id = b.id
  LEFT JOIN events e ON (
    e.id = ber.event_id
    OR (e.location IS NOT NULL AND lower(e.location) = lower(z.name) AND e.simulation_id = z.simulation_id)
  ) AND e.deleted_at IS NULL
  GROUP BY z.id, z.simulation_id
)
SELECT
  z.id AS zone_id,
  z.simulation_id,
  z.city_id,
  z.name AS zone_name,
  z.zone_type,
  z.security_level,

  -- Component scores
  COALESCE(zi.infrastructure_score, 0.0) AS infrastructure_score,
  -- Security factor: data-driven from taxonomy game_weight
  COALESCE(
    st_sec.game_weight,
    game_weight_fallback('security_level', z.security_level)
  ) AS security_factor,
  COALESCE(zep.event_pressure, 0.0) AS event_pressure,

  -- Building stats
  COALESCE(zi.building_count, 0) AS building_count,
  COALESCE(zi.total_agents, 0) AS total_agents,
  COALESCE(zi.total_capacity, 0) AS total_capacity,
  COALESCE(zi.critical_understaffed_count, 0) AS critical_understaffed_count,
  COALESCE(zi.avg_readiness, 0.0) AS avg_readiness,

  -- MASTER METRIC: Zone Stability
  LEAST(1.0, GREATEST(0.0,
    (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
    + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
    - (COALESCE(zep.event_pressure, 0.0) * 0.2)
  )) AS stability,

  -- Stability label
  CASE
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.2)
    )) < 0.3 THEN 'critical'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.2)
    )) < 0.5 THEN 'unstable'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.2)
    )) < 0.7 THEN 'functional'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.2)
    )) < 0.9 THEN 'stable'
    ELSE 'exemplary'
  END AS stability_label

FROM zones z
LEFT JOIN zone_infrastructure zi ON zi.zone_id = z.id
LEFT JOIN zone_event_pressure zep ON zep.zone_id = z.id
-- Data-driven security factor
LEFT JOIN simulation_taxonomies st_sec ON
  st_sec.simulation_id = z.simulation_id
  AND st_sec.taxonomy_type = 'security_level'
  AND st_sec.value = z.security_level;

CREATE UNIQUE INDEX idx_mv_zone_stability_pk ON mv_zone_stability (zone_id);
CREATE INDEX idx_mv_zone_stability_sim ON mv_zone_stability (simulation_id);


-- ============================================================================
-- 7. MATERIALIZED VIEW: mv_embassy_effectiveness
-- ============================================================================
-- building_health × 0.4 + ambassador_quality × 0.4 + vector_alignment × 0.2

CREATE MATERIALIZED VIEW mv_embassy_effectiveness AS
WITH embassy_building_health AS (
  SELECT
    e.id AS embassy_id,
    COALESCE(bra.readiness, game_weight_fallback('building_condition', ba.building_condition)) AS readiness_a,
    COALESCE(brb.readiness, game_weight_fallback('building_condition', bb.building_condition)) AS readiness_b,
    (COALESCE(bra.readiness, game_weight_fallback('building_condition', ba.building_condition))
     + COALESCE(brb.readiness, game_weight_fallback('building_condition', bb.building_condition))) / 2.0 AS avg_building_health
  FROM embassies e
  JOIN buildings ba ON ba.id = e.building_a_id
  JOIN buildings bb ON bb.id = e.building_b_id
  LEFT JOIN mv_building_readiness bra ON bra.building_id = e.building_a_id
  LEFT JOIN mv_building_readiness brb ON brb.building_id = e.building_b_id
),
embassy_ambassador_quality AS (
  SELECT
    e.id AS embassy_id,
    CASE
      WHEN e.embassy_metadata IS NULL THEN 0.3
      WHEN e.embassy_metadata->'ambassador_a' IS NULL AND e.embassy_metadata->'ambassador_b' IS NULL THEN 0.3
      ELSE LEAST(1.0,
        0.4  -- Base: has any ambassador
        + LEAST(0.2,
          (COALESCE(length(e.embassy_metadata->'ambassador_a'->>'name'), 0)
           + COALESCE(length(e.embassy_metadata->'ambassador_b'->>'name'), 0))::numeric / 50.0
        )
        + CASE WHEN e.embassy_metadata->'ambassador_a'->>'quirk' IS NOT NULL THEN 0.1 ELSE 0 END
        + CASE WHEN e.embassy_metadata->'ambassador_b'->>'quirk' IS NOT NULL THEN 0.1 ELSE 0 END
        + CASE WHEN e.embassy_metadata->'ambassador_a'->>'role' IS NOT NULL THEN 0.05 ELSE 0 END
        + CASE WHEN e.embassy_metadata->'ambassador_b'->>'role' IS NOT NULL THEN 0.05 ELSE 0 END
      )
    END AS ambassador_quality
  FROM embassies e
),
embassy_vector_alignment AS (
  SELECT
    e.id AS embassy_id,
    CASE
      WHEN sc.bleed_vectors IS NOT NULL AND e.bleed_vector = ANY(sc.bleed_vectors) THEN 1.0
      ELSE 0.0
    END AS vector_alignment
  FROM embassies e
  LEFT JOIN simulation_connections sc ON (
    (sc.simulation_a_id = e.simulation_a_id AND sc.simulation_b_id = e.simulation_b_id)
    OR (sc.simulation_a_id = e.simulation_b_id AND sc.simulation_b_id = e.simulation_a_id)
  ) AND sc.is_active = true
)
SELECT
  e.id AS embassy_id,
  e.simulation_a_id,
  e.simulation_b_id,
  e.building_a_id,
  e.building_b_id,
  e.status,
  e.bleed_vector,

  LEAST(1.0, COALESCE(ebh.avg_building_health, 0.5)) AS building_health,
  LEAST(1.0, COALESCE(eaq.ambassador_quality, 0.3)) AS ambassador_quality,
  COALESCE(eva.vector_alignment, 0.0) AS vector_alignment,

  -- MASTER METRIC: Embassy Effectiveness
  CASE
    WHEN e.status != 'active' THEN 0.0
    ELSE LEAST(1.0, GREATEST(0.0,
      (LEAST(1.0, COALESCE(ebh.avg_building_health, 0.5)) * 0.4)
      + (LEAST(1.0, COALESCE(eaq.ambassador_quality, 0.3)) * 0.4)
      + (COALESCE(eva.vector_alignment, 0.0) * 0.2)
    ))
  END AS effectiveness,

  CASE
    WHEN e.status != 'active' THEN 'dormant'
    WHEN LEAST(1.0, GREATEST(0.0,
      (LEAST(1.0, COALESCE(ebh.avg_building_health, 0.5)) * 0.4)
      + (LEAST(1.0, COALESCE(eaq.ambassador_quality, 0.3)) * 0.4)
      + (COALESCE(eva.vector_alignment, 0.0) * 0.2)
    )) < 0.3 THEN 'dormant'
    WHEN LEAST(1.0, GREATEST(0.0,
      (LEAST(1.0, COALESCE(ebh.avg_building_health, 0.5)) * 0.4)
      + (LEAST(1.0, COALESCE(eaq.ambassador_quality, 0.3)) * 0.4)
      + (COALESCE(eva.vector_alignment, 0.0) * 0.2)
    )) < 0.6 THEN 'limited'
    WHEN LEAST(1.0, GREATEST(0.0,
      (LEAST(1.0, COALESCE(ebh.avg_building_health, 0.5)) * 0.4)
      + (LEAST(1.0, COALESCE(eaq.ambassador_quality, 0.3)) * 0.4)
      + (COALESCE(eva.vector_alignment, 0.0) * 0.2)
    )) < 0.8 THEN 'operational'
    ELSE 'optimal'
  END AS effectiveness_label

FROM embassies e
LEFT JOIN embassy_building_health ebh ON ebh.embassy_id = e.id
LEFT JOIN embassy_ambassador_quality eaq ON eaq.embassy_id = e.id
LEFT JOIN embassy_vector_alignment eva ON eva.embassy_id = e.id;

CREATE UNIQUE INDEX idx_mv_embassy_eff_pk ON mv_embassy_effectiveness (embassy_id);
CREATE INDEX idx_mv_embassy_eff_sim_a ON mv_embassy_effectiveness (simulation_a_id);
CREATE INDEX idx_mv_embassy_eff_sim_b ON mv_embassy_effectiveness (simulation_b_id);


-- ============================================================================
-- 8. MATERIALIZED VIEW: mv_simulation_health
-- ============================================================================

CREATE MATERIALIZED VIEW mv_simulation_health AS
WITH sim_zones AS (
  SELECT
    zs.simulation_id,
    AVG(zs.stability) AS avg_zone_stability,
    COUNT(*) AS zone_count,
    COUNT(*) FILTER (WHERE zs.stability_label = 'critical') AS critical_zone_count,
    COUNT(*) FILTER (WHERE zs.stability_label = 'unstable') AS unstable_zone_count,
    MIN(zs.stability) AS min_zone_stability,
    MAX(zs.stability) AS max_zone_stability,
    SUM(zs.building_count) AS total_buildings,
    SUM(zs.total_agents) AS total_agents,
    SUM(zs.total_capacity) AS total_capacity
  FROM mv_zone_stability zs
  GROUP BY zs.simulation_id
),
sim_buildings AS (
  SELECT
    br.simulation_id,
    COUNT(*) AS building_count,
    AVG(br.readiness) AS avg_readiness,
    COUNT(*) FILTER (WHERE br.staffing_status = 'critically_understaffed') AS critically_understaffed,
    COUNT(*) FILTER (WHERE br.staffing_status = 'overcrowded') AS overcrowded
  FROM mv_building_readiness br
  GROUP BY br.simulation_id
),
sim_diplomacy AS (
  SELECT
    sim_id,
    SUM(eff) AS diplomatic_reach,
    COUNT(*) AS active_embassy_count,
    AVG(eff) AS avg_embassy_effectiveness
  FROM (
    SELECT ee.simulation_a_id AS sim_id, ee.effectiveness AS eff
    FROM mv_embassy_effectiveness ee WHERE ee.status = 'active'
    UNION ALL
    SELECT ee.simulation_b_id AS sim_id, ee.effectiveness AS eff
    FROM mv_embassy_effectiveness ee WHERE ee.status = 'active'
  ) embassy_per_sim
  GROUP BY sim_id
),
sim_bleed AS (
  SELECT
    s.id AS simulation_id,
    COUNT(DISTINCT eo.id) AS outbound_echoes,
    COUNT(DISTINCT ei.id) AS inbound_echoes,
    COALESCE(AVG(eo.echo_strength), 0) AS avg_outbound_strength
  FROM simulations s
  LEFT JOIN event_echoes eo ON eo.source_simulation_id = s.id
    AND eo.created_at >= (now() - interval '30 days')
  LEFT JOIN event_echoes ei ON ei.target_simulation_id = s.id
    AND ei.created_at >= (now() - interval '30 days')
  WHERE s.deleted_at IS NULL
  GROUP BY s.id
)
SELECT
  s.id AS simulation_id,
  s.name AS simulation_name,
  s.slug,

  COALESCE(sz.avg_zone_stability, 0.0) AS avg_zone_stability,
  COALESCE(sz.zone_count, 0) AS zone_count,
  COALESCE(sz.critical_zone_count, 0) AS critical_zone_count,
  COALESCE(sz.unstable_zone_count, 0) AS unstable_zone_count,

  COALESCE(sb.building_count, 0) AS building_count,
  COALESCE(sb.avg_readiness, 0.0) AS avg_readiness,
  COALESCE(sb.critically_understaffed, 0) AS critically_understaffed_buildings,
  COALESCE(sb.overcrowded, 0) AS overcrowded_buildings,

  COALESCE(sz.total_agents, 0) AS total_agents_assigned,
  COALESCE(sz.total_capacity, 0) AS total_capacity,

  COALESCE(sd.diplomatic_reach, 0.0) AS diplomatic_reach,
  COALESCE(sd.active_embassy_count, 0) AS active_embassy_count,
  COALESCE(sd.avg_embassy_effectiveness, 0.0) AS avg_embassy_effectiveness,

  COALESCE(sbl.outbound_echoes, 0) AS outbound_echoes,
  COALESCE(sbl.inbound_echoes, 0) AS inbound_echoes,
  COALESCE(sbl.avg_outbound_strength, 0.0) AS avg_outbound_strength,

  -- Bleed permeability: unstable worlds bleed MORE
  LEAST(1.0, GREATEST(0.0,
    (1.0 - COALESCE(sz.avg_zone_stability, 0.5) * 0.3)
    * (0.5 + LEAST(0.5, COALESCE(sd.diplomatic_reach, 0.0) / 5.0))
  )) AS bleed_permeability,

  -- MASTER METRIC: Overall Simulation Health
  LEAST(1.0, GREATEST(0.0,
    (COALESCE(sz.avg_zone_stability, 0.0) * 0.6)
    + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
    + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
  )) AS overall_health,

  CASE
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(sz.avg_zone_stability, 0.0) * 0.6)
      + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
      + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
    )) < 0.3 THEN 'critical'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(sz.avg_zone_stability, 0.0) * 0.6)
      + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
      + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
    )) < 0.5 THEN 'struggling'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(sz.avg_zone_stability, 0.0) * 0.6)
      + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
      + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
    )) < 0.7 THEN 'functional'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(sz.avg_zone_stability, 0.0) * 0.6)
      + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
      + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
    )) < 0.9 THEN 'thriving'
    ELSE 'exemplary'
  END AS health_label

FROM simulations s
LEFT JOIN sim_zones sz ON sz.simulation_id = s.id
LEFT JOIN sim_buildings sb ON sb.simulation_id = s.id
LEFT JOIN sim_diplomacy sd ON sd.sim_id = s.id
LEFT JOIN sim_bleed sbl ON sbl.simulation_id = s.id
WHERE s.deleted_at IS NULL
  AND s.status IN ('active', 'configuring');

CREATE UNIQUE INDEX idx_mv_sim_health_pk ON mv_simulation_health (simulation_id);
CREATE INDEX idx_mv_sim_health_slug ON mv_simulation_health (slug);


-- ============================================================================
-- 9. REFRESH FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_building_readiness()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_building_readiness;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_zone_stability()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_building_readiness;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_zone_stability;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_embassy_effectiveness()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_building_readiness;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_embassy_effectiveness;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_all_game_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_building_readiness;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_zone_stability;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_embassy_effectiveness;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_simulation_health;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 10. NOTIFICATION TRIGGER: pg_notify on data changes
-- ============================================================================
-- Lightweight: no synchronous refresh in triggers. Backend refreshes on demand.

CREATE OR REPLACE FUNCTION notify_game_metrics_stale()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('game_metrics_stale', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'simulation_id', COALESCE(
      NEW.simulation_id::text,
      OLD.simulation_id::text,
      ''
    )
  )::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 11. DATA-CHANGE TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_game_metrics_agents
  AFTER INSERT OR UPDATE OR DELETE ON agents
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_buildings
  AFTER INSERT OR UPDATE OR DELETE ON buildings
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_building_agents
  AFTER INSERT OR UPDATE OR DELETE ON building_agent_relations
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_building_profs
  AFTER INSERT OR UPDATE OR DELETE ON building_profession_requirements
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_agent_profs
  AFTER INSERT OR UPDATE OR DELETE ON agent_professions
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_building_events
  AFTER INSERT OR UPDATE OR DELETE ON building_event_relations
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_embassies
  AFTER INSERT OR UPDATE OR DELETE ON embassies
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_connections
  AFTER INSERT OR UPDATE OR DELETE ON simulation_connections
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

CREATE TRIGGER trg_game_metrics_echoes
  AFTER INSERT OR UPDATE OR DELETE ON event_echoes
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();

-- Taxonomy game_weight changes should also invalidate views
CREATE TRIGGER trg_game_metrics_taxonomies
  AFTER UPDATE OF game_weight ON simulation_taxonomies
  FOR EACH ROW EXECUTE FUNCTION notify_game_metrics_stale();


-- ============================================================================
-- 12. INITIAL REFRESH
-- ============================================================================
SELECT refresh_all_game_metrics();


-- ============================================================================
-- 13. GRANTS
-- ============================================================================
GRANT SELECT ON mv_building_readiness TO authenticated, anon;
GRANT SELECT ON mv_zone_stability TO authenticated, anon;
GRANT SELECT ON mv_embassy_effectiveness TO authenticated, anon;
GRANT SELECT ON mv_simulation_health TO authenticated, anon;
