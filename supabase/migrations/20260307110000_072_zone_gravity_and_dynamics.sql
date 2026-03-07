-- Migration 072: Zone Gravity, Pressure Spill, Vulnerability, Fortification
--
-- Implements 4 interconnected zone dynamics:
--   1. Zone Gravity — auto-assigns events to zones via affinity matrix
--   2. Pressure Spill — ambient pressure for unlinked events
--   3. Vulnerability Profiles — zone-type × event-type multipliers
--   4. Zone Actions (Fortify/Quarantine/Deploy) — player countermeasures
--
-- All data-layer logic in Postgres. Rebuilds mv_zone_stability + mv_simulation_health.

-- ============================================================================
-- 1. CREATE event_zone_links TABLE
-- ============================================================================

CREATE TABLE event_zone_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  affinity_weight NUMERIC(3,2) NOT NULL DEFAULT 1.0
    CHECK (affinity_weight BETWEEN 0.0 AND 1.0),
  link_source TEXT NOT NULL DEFAULT 'auto'
    CHECK (link_source IN ('auto', 'manual', 'location_match')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, zone_id)
);

CREATE INDEX idx_event_zone_links_event ON event_zone_links(event_id);
CREATE INDEX idx_event_zone_links_zone ON event_zone_links(zone_id);

COMMENT ON TABLE event_zone_links IS
  'Maps events to zones with affinity weights. Populated automatically by '
  'assign_event_zones() trigger, or manually via API.';

-- RLS
ALTER TABLE event_zone_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_zone_links_read_all" ON event_zone_links
  FOR SELECT USING (true);

CREATE POLICY "event_zone_links_insert_authenticated" ON event_zone_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "event_zone_links_delete_authenticated" ON event_zone_links
  FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- 2. CREATE zone_actions TABLE (fortification system)
-- ============================================================================

CREATE TABLE zone_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL
    CHECK (action_type IN ('fortify', 'quarantine', 'deploy_resources')),
  effect_value NUMERIC(3,2) NOT NULL,
  created_by_id UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  cooldown_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_zone_actions_zone ON zone_actions(zone_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_zone_actions_sim ON zone_actions(simulation_id) WHERE deleted_at IS NULL;

-- Note: max 1 active action per zone enforced in application layer
-- (partial unique index with now() not possible — not IMMUTABLE)

COMMENT ON TABLE zone_actions IS
  'Player-initiated zone countermeasures: fortify (-0.3 pressure), '
  'quarantine (block cascades, +0.1 internal), deploy_resources (-0.5 short burst).';

-- RLS
ALTER TABLE zone_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zone_actions_read_all" ON zone_actions
  FOR SELECT USING (true);

CREATE POLICY "zone_actions_insert_authenticated" ON zone_actions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "zone_actions_update_authenticated" ON zone_actions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "zone_actions_delete_authenticated" ON zone_actions
  FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================================
-- 3. ADD 'cascade' TO event_chains chain_type constraint
-- ============================================================================

ALTER TABLE event_chains DROP CONSTRAINT IF EXISTS chk_chain_type;
ALTER TABLE event_chains ADD CONSTRAINT chk_chain_type
  CHECK (chain_type IN ('escalation', 'follow_up', 'resolution', 'cascade'));


-- ============================================================================
-- 4. SEED DEFAULT GAME MECHANICS SETTINGS
-- ============================================================================

-- Zone Gravity Matrix
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT s.id, 'game_mechanics', 'zone_gravity_matrix', '{
  "exploration": {"ruins": 1.0, "slums": 0.6},
  "trade": {"commercial": 1.0, "industrial": 0.6},
  "intrigue": {"government": 1.0, "military": 0.6},
  "eldritch": {"religious": 1.0, "ruins": 0.7, "residential": 0.3},
  "religious": {"religious": 1.0, "residential": 0.6},
  "military": {"military": 1.0, "government": 0.7, "industrial": 0.3},
  "social": {"residential": 1.0, "commercial": 0.6},
  "crisis": {"_global": 0.6},
  "discovery": {"ruins": 1.0, "industrial": 0.6},
  "nautical": {"commercial": 0.7, "industrial": 0.5}
}'::jsonb
FROM simulations s
WHERE s.deleted_at IS NULL AND s.status IN ('active', 'configuring')
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Zone Vulnerability Matrix
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT s.id, 'game_mechanics', 'zone_vulnerability_matrix', '{
  "residential": {"social": 1.5, "crisis": 1.3, "eldritch": 1.2, "military": 0.7},
  "commercial": {"trade": 1.5, "crisis": 1.3, "military": 0.7},
  "industrial": {"crisis": 1.4, "trade": 1.3, "exploration": 0.8},
  "military": {"military": 1.5, "intrigue": 1.3, "social": 0.5},
  "religious": {"religious": 1.5, "eldritch": 1.4, "military": 0.6},
  "government": {"intrigue": 1.5, "military": 1.3, "crisis": 1.2, "social": 0.9},
  "slums": {"crisis": 1.5, "social": 1.3, "eldritch": 1.2, "trade": 0.7},
  "ruins": {"discovery": 1.5, "eldritch": 1.4, "trade": 0.5}
}'::jsonb
FROM simulations s
WHERE s.deleted_at IS NULL AND s.status IN ('active', 'configuring')
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Pressure Spill Factor
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT s.id, 'game_mechanics', 'pressure_spill_factor', '0.3'::jsonb
FROM simulations s
WHERE s.deleted_at IS NULL AND s.status IN ('active', 'configuring')
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;

-- Cascade Threshold
INSERT INTO simulation_settings (simulation_id, category, setting_key, setting_value)
SELECT s.id, 'game_mechanics', 'cascade_threshold', '0.7'::jsonb
FROM simulations s
WHERE s.deleted_at IS NULL AND s.status IN ('active', 'configuring')
ON CONFLICT (simulation_id, category, setting_key) DO NOTHING;


-- ============================================================================
-- 5. CREATE assign_event_zones() TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_event_zones()
RETURNS TRIGGER AS $$
DECLARE
  matrix JSONB;
  type_map JSONB;
  zone_rec RECORD;
  affinity NUMERIC;
  default_matrix CONSTANT JSONB := '{
    "exploration": {"ruins": 1.0, "slums": 0.6},
    "trade": {"commercial": 1.0, "industrial": 0.6},
    "intrigue": {"government": 1.0, "military": 0.6},
    "eldritch": {"religious": 1.0, "ruins": 0.7, "residential": 0.3},
    "religious": {"religious": 1.0, "residential": 0.6},
    "military": {"military": 1.0, "government": 0.7, "industrial": 0.3},
    "social": {"residential": 1.0, "commercial": 0.6},
    "crisis": {"_global": 0.6},
    "discovery": {"ruins": 1.0, "industrial": 0.6},
    "nautical": {"commercial": 0.7, "industrial": 0.5}
  }'::jsonb;
BEGIN
  -- Skip if no simulation_id or event_type
  IF NEW.simulation_id IS NULL OR NEW.event_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Clear existing auto/location_match links (preserve manual ones)
  DELETE FROM event_zone_links
  WHERE event_id = NEW.id AND link_source IN ('auto', 'location_match');

  -- Get matrix from simulation_settings (or use default)
  SELECT setting_value INTO matrix
  FROM simulation_settings
  WHERE simulation_id = NEW.simulation_id
    AND category = 'game_mechanics'
    AND setting_key = 'zone_gravity_matrix';

  IF matrix IS NULL THEN
    matrix := default_matrix;
  END IF;

  type_map := matrix->NEW.event_type;

  -- Handle _global flag (applies to all zones in simulation)
  IF type_map IS NOT NULL AND type_map ? '_global' THEN
    INSERT INTO event_zone_links (event_id, zone_id, affinity_weight, link_source)
    SELECT NEW.id, z.id, (type_map->>'_global')::numeric, 'auto'
    FROM zones z
    WHERE z.simulation_id = NEW.simulation_id
    ON CONFLICT (event_id, zone_id)
      DO UPDATE SET affinity_weight = EXCLUDED.affinity_weight;

  ELSIF type_map IS NOT NULL THEN
    -- Match zone_type affinities
    FOR zone_rec IN
      SELECT z.id, z.zone_type
      FROM zones z
      WHERE z.simulation_id = NEW.simulation_id
    LOOP
      affinity := (type_map->>zone_rec.zone_type)::numeric;
      IF affinity IS NOT NULL AND affinity > 0 THEN
        INSERT INTO event_zone_links (event_id, zone_id, affinity_weight, link_source)
        VALUES (NEW.id, zone_rec.id, affinity, 'auto')
        ON CONFLICT (event_id, zone_id)
          DO UPDATE SET affinity_weight = GREATEST(EXCLUDED.affinity_weight, event_zone_links.affinity_weight);
      END IF;
    END LOOP;
  END IF;
  -- If type_map IS NULL: unknown event_type → Pressure Spill handles it

  -- Location name match (overrides with 1.0)
  IF NEW.location IS NOT NULL AND NEW.location != '' THEN
    INSERT INTO event_zone_links (event_id, zone_id, affinity_weight, link_source)
    SELECT NEW.id, z.id, 1.0, 'location_match'
    FROM zones z
    WHERE z.simulation_id = NEW.simulation_id
      AND lower(z.name) = lower(NEW.location)
    ON CONFLICT (event_id, zone_id)
      DO UPDATE SET affinity_weight = 1.0, link_source = 'location_match';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_event_zones
  AFTER INSERT OR UPDATE OF event_type, location, simulation_id
  ON events
  FOR EACH ROW
  EXECUTE FUNCTION assign_event_zones();


-- ============================================================================
-- 6. REBUILD mv_zone_stability WITH ALL NEW CTEs
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_simulation_health CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_zone_stability CASCADE;

CREATE MATERIALIZED VIEW mv_zone_stability AS
WITH pressure_config AS (
  SELECT
    simulation_id,
    COALESCE((setting_value #>> '{}')::int, 30) AS window_days
  FROM simulation_settings
  WHERE category = 'world' AND setting_key = 'event_pressure_window_days'
),
spill_config AS (
  SELECT
    simulation_id,
    COALESCE((setting_value #>> '{}')::numeric, 0.3) AS spill_factor
  FROM simulation_settings
  WHERE category = 'game_mechanics' AND setting_key = 'pressure_spill_factor'
),
vulnerability_config AS (
  SELECT
    simulation_id,
    setting_value AS vuln_matrix
  FROM simulation_settings
  WHERE category = 'game_mechanics' AND setting_key = 'zone_vulnerability_matrix'
),
zone_infrastructure AS (
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
-- Zone event pressure via event_zone_links (replaces fragile building_event_relations path)
zone_event_pressure AS (
  SELECT
    z.id AS zone_id,
    z.simulation_id,
    LEAST(1.0,
      COALESCE(
        SUM(
          (
            POWER(e.impact_level::numeric / 10.0, 1.5)
            * CASE e.event_status
                WHEN 'active'     THEN 1.0
                WHEN 'escalating' THEN 1.3
                WHEN 'resolving'  THEN 0.5
                WHEN 'resolved'   THEN 0.0
                WHEN 'archived'   THEN 0.0
                ELSE 1.0
              END
            * ezl.affinity_weight
            * COALESCE((vc.vuln_matrix->z.zone_type->>e.event_type)::numeric, 1.0)
          )
          + COALESCE((e.metadata->>'reaction_modifier')::numeric, 0.0)
        ) FILTER (
          WHERE e.occurred_at >= (now() - interval '1 day' * COALESCE(pc.window_days, 30))
          AND e.deleted_at IS NULL
          AND e.event_status NOT IN ('resolved', 'archived')
        ) / 15.0,
        0.0
      )
    ) AS event_pressure
  FROM zones z
  LEFT JOIN pressure_config pc ON pc.simulation_id = z.simulation_id
  LEFT JOIN vulnerability_config vc ON vc.simulation_id = z.simulation_id
  LEFT JOIN event_zone_links ezl ON ezl.zone_id = z.id
  LEFT JOIN events e ON e.id = ezl.event_id
    AND e.simulation_id = z.simulation_id
    AND e.deleted_at IS NULL
  GROUP BY z.id, z.simulation_id, pc.window_days
),
-- Ambient pressure from events with NO zone links (Pressure Spill)
ambient_event_pressure AS (
  SELECT
    z.id AS zone_id,
    z.simulation_id,
    COALESCE(
      SUM(
        POWER(e.impact_level::numeric / 10.0, 1.5)
        * CASE e.event_status
            WHEN 'active'     THEN 1.0
            WHEN 'escalating' THEN 1.3
            WHEN 'resolving'  THEN 0.5
            WHEN 'resolved'   THEN 0.0
            WHEN 'archived'   THEN 0.0
            ELSE 1.0
          END
        * COALESCE(sc.spill_factor, 0.3)
      ) FILTER (
        WHERE e.occurred_at >= (now() - interval '1 day' * COALESCE(pc.window_days, 30))
        AND e.deleted_at IS NULL
        AND e.event_status NOT IN ('resolved', 'archived')
      ) / 15.0,
      0.0
    ) AS ambient_pressure
  FROM zones z
  CROSS JOIN events e
  LEFT JOIN event_zone_links ezl ON ezl.event_id = e.id
  LEFT JOIN pressure_config pc ON pc.simulation_id = z.simulation_id
  LEFT JOIN spill_config sc ON sc.simulation_id = z.simulation_id
  WHERE e.simulation_id = z.simulation_id
    AND ezl.id IS NULL  -- only unlinked events
  GROUP BY z.id, z.simulation_id
),
-- Zone fortification from active zone_actions
zone_fortification AS (
  SELECT
    za.zone_id,
    SUM(za.effect_value) AS pressure_reduction,
    bool_or(za.action_type = 'quarantine') AS is_quarantined
  FROM zone_actions za
  WHERE za.deleted_at IS NULL
    AND za.expires_at > now()
  GROUP BY za.zone_id
)
SELECT
  z.id AS zone_id,
  z.simulation_id,
  z.city_id,
  z.name AS zone_name,
  z.zone_type,
  z.security_level,

  COALESCE(zi.infrastructure_score, 0.0) AS infrastructure_score,
  COALESCE(
    st_sec.game_weight,
    game_weight_fallback('security_level', z.security_level)
  ) AS security_factor,
  COALESCE(zep.event_pressure, 0.0) AS event_pressure,
  COALESCE(aep.ambient_pressure, 0.0) AS ambient_pressure,
  COALESCE(zf.pressure_reduction, 0.0) AS fortification_reduction,
  COALESCE(zf.is_quarantined, false) AS is_quarantined,

  COALESCE(zi.building_count, 0) AS building_count,
  COALESCE(zi.total_agents, 0) AS total_agents,
  COALESCE(zi.total_capacity, 0) AS total_capacity,
  COALESCE(zi.critical_understaffed_count, 0) AS critical_understaffed_count,
  COALESCE(zi.avg_readiness, 0.0) AS avg_readiness,

  -- Total pressure = event + ambient - fortification (min 0)
  GREATEST(0.0,
    COALESCE(zep.event_pressure, 0.0)
    + COALESCE(aep.ambient_pressure, 0.0)
    - COALESCE(zf.pressure_reduction, 0.0)
  ) AS total_pressure,

  -- Stability formula
  LEAST(1.0, GREATEST(0.0,
    (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
    + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
    - (GREATEST(0.0,
        COALESCE(zep.event_pressure, 0.0)
        + COALESCE(aep.ambient_pressure, 0.0)
        - COALESCE(zf.pressure_reduction, 0.0)
      ) * 0.25)
  )) AS stability,

  CASE
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (GREATEST(0.0,
          COALESCE(zep.event_pressure, 0.0)
          + COALESCE(aep.ambient_pressure, 0.0)
          - COALESCE(zf.pressure_reduction, 0.0)
        ) * 0.25)
    )) < 0.3 THEN 'critical'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (GREATEST(0.0,
          COALESCE(zep.event_pressure, 0.0)
          + COALESCE(aep.ambient_pressure, 0.0)
          - COALESCE(zf.pressure_reduction, 0.0)
        ) * 0.25)
    )) < 0.5 THEN 'unstable'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (GREATEST(0.0,
          COALESCE(zep.event_pressure, 0.0)
          + COALESCE(aep.ambient_pressure, 0.0)
          - COALESCE(zf.pressure_reduction, 0.0)
        ) * 0.25)
    )) < 0.7 THEN 'functional'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (GREATEST(0.0,
          COALESCE(zep.event_pressure, 0.0)
          + COALESCE(aep.ambient_pressure, 0.0)
          - COALESCE(zf.pressure_reduction, 0.0)
        ) * 0.25)
    )) < 0.9 THEN 'stable'
    ELSE 'exemplary'
  END AS stability_label

FROM zones z
LEFT JOIN zone_infrastructure zi ON zi.zone_id = z.id
LEFT JOIN zone_event_pressure zep ON zep.zone_id = z.id
LEFT JOIN ambient_event_pressure aep ON aep.zone_id = z.id
LEFT JOIN zone_fortification zf ON zf.zone_id = z.id
LEFT JOIN simulation_taxonomies st_sec ON
  st_sec.simulation_id = z.simulation_id
  AND st_sec.taxonomy_type = 'security_level'
  AND st_sec.value = z.security_level;

CREATE UNIQUE INDEX idx_mv_zone_stability_pk ON mv_zone_stability (zone_id);
CREATE INDEX idx_mv_zone_stability_sim ON mv_zone_stability (simulation_id);


-- ============================================================================
-- 7. RECREATE mv_simulation_health (dependency rebuild, unchanged logic)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_simulation_health AS
WITH sim_zones AS (
  SELECT zs.simulation_id, AVG(zs.stability) AS avg_zone_stability, COUNT(*) AS zone_count,
    COUNT(*) FILTER (WHERE zs.stability_label = 'critical') AS critical_zone_count,
    COUNT(*) FILTER (WHERE zs.stability_label = 'unstable') AS unstable_zone_count,
    MIN(zs.stability) AS min_zone_stability, MAX(zs.stability) AS max_zone_stability,
    SUM(zs.building_count) AS total_buildings, SUM(zs.total_agents) AS total_agents,
    SUM(zs.total_capacity) AS total_capacity
  FROM mv_zone_stability zs GROUP BY zs.simulation_id
),
sim_buildings AS (
  SELECT br.simulation_id, COUNT(*) AS building_count, AVG(br.readiness) AS avg_readiness,
    COUNT(*) FILTER (WHERE br.staffing_status = 'critically_understaffed') AS critically_understaffed,
    COUNT(*) FILTER (WHERE br.staffing_status = 'overcrowded') AS overcrowded
  FROM mv_building_readiness br GROUP BY br.simulation_id
),
sim_diplomacy AS (
  SELECT sim_id, SUM(eff) AS diplomatic_reach, COUNT(*) AS active_embassy_count, AVG(eff) AS avg_embassy_effectiveness
  FROM (
    SELECT ee.simulation_a_id AS sim_id, ee.effectiveness AS eff FROM mv_embassy_effectiveness ee WHERE ee.status = 'active'
    UNION ALL
    SELECT ee.simulation_b_id AS sim_id, ee.effectiveness AS eff FROM mv_embassy_effectiveness ee WHERE ee.status = 'active'
  ) embassy_per_sim GROUP BY sim_id
),
sim_bleed AS (
  SELECT s.id AS simulation_id,
    COUNT(DISTINCT eo.id) AS outbound_echoes, COUNT(DISTINCT ei.id) AS inbound_echoes,
    COALESCE(AVG(eo.echo_strength), 0) AS avg_outbound_strength
  FROM simulations s
  LEFT JOIN event_echoes eo ON eo.source_simulation_id = s.id AND eo.created_at >= (now() - interval '30 days')
  LEFT JOIN event_echoes ei ON ei.target_simulation_id = s.id AND ei.created_at >= (now() - interval '30 days')
  WHERE s.deleted_at IS NULL GROUP BY s.id
)
SELECT
  s.id AS simulation_id, s.name AS simulation_name, s.slug,
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
  LEAST(1.0, GREATEST(0.0,
    (1.0 - COALESCE(sz.avg_zone_stability, 0.5) * 0.3) * (0.5 + LEAST(0.5, COALESCE(sd.diplomatic_reach, 0.0) / 5.0))
  )) AS bleed_permeability,
  LEAST(1.0, GREATEST(0.0,
    (COALESCE(sz.avg_zone_stability, 0.0) * 0.6) + (COALESCE(sb.avg_readiness, 0.0) * 0.2)
    + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2)
  )) AS overall_health,
  CASE
    WHEN LEAST(1.0, GREATEST(0.0, (COALESCE(sz.avg_zone_stability, 0.0) * 0.6) + (COALESCE(sb.avg_readiness, 0.0) * 0.2) + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2))) < 0.3 THEN 'critical'
    WHEN LEAST(1.0, GREATEST(0.0, (COALESCE(sz.avg_zone_stability, 0.0) * 0.6) + (COALESCE(sb.avg_readiness, 0.0) * 0.2) + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2))) < 0.5 THEN 'struggling'
    WHEN LEAST(1.0, GREATEST(0.0, (COALESCE(sz.avg_zone_stability, 0.0) * 0.6) + (COALESCE(sb.avg_readiness, 0.0) * 0.2) + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2))) < 0.7 THEN 'functional'
    WHEN LEAST(1.0, GREATEST(0.0, (COALESCE(sz.avg_zone_stability, 0.0) * 0.6) + (COALESCE(sb.avg_readiness, 0.0) * 0.2) + (LEAST(1.0, COALESCE(sd.diplomatic_reach, 0.0) / 3.0) * 0.2))) < 0.9 THEN 'thriving'
    ELSE 'exemplary'
  END AS health_label
FROM simulations s
LEFT JOIN sim_zones sz ON sz.simulation_id = s.id
LEFT JOIN sim_buildings sb ON sb.simulation_id = s.id
LEFT JOIN sim_diplomacy sd ON sd.sim_id = s.id
LEFT JOIN sim_bleed sbl ON sbl.simulation_id = s.id
WHERE s.deleted_at IS NULL AND s.status IN ('active', 'configuring');

CREATE UNIQUE INDEX idx_mv_sim_health_pk ON mv_simulation_health (simulation_id);
CREATE INDEX idx_mv_sim_health_slug ON mv_simulation_health (slug);

GRANT SELECT ON event_zone_links TO authenticated, anon;
GRANT SELECT ON zone_actions TO authenticated, anon;
GRANT SELECT ON mv_zone_stability TO authenticated, anon;
GRANT SELECT ON mv_simulation_health TO authenticated, anon;


-- ============================================================================
-- 8. BACKFILL: Trigger assign_event_zones for all existing events
-- ============================================================================
-- Touching updated_at fires the trigger via UPDATE OF event_type
UPDATE events SET event_type = event_type WHERE deleted_at IS NULL AND event_type IS NOT NULL;

SELECT refresh_all_game_metrics();
