-- Migration 070: Reaction Modifier in Event Pressure
--
-- Updates the zone_event_pressure CTE to include the reaction_modifier
-- from event metadata. Fear/anger reactions amplify event pressure,
-- hope/defiance reactions dampen it.
--
-- Each event's contribution becomes:
--   POWER(impact_level / 10.0, 1.5) * status_multiplier + reaction_modifier

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
  LEFT JOIN buildings b ON b.zone_id = z.id AND b.deleted_at IS NULL
  LEFT JOIN building_event_relations ber ON ber.building_id = b.id
  LEFT JOIN events e ON (
    e.id = ber.event_id
    OR (e.location IS NOT NULL AND lower(e.location) = lower(z.name) AND e.simulation_id = z.simulation_id)
  ) AND e.deleted_at IS NULL
  GROUP BY z.id, z.simulation_id, pc.window_days
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

  COALESCE(zi.building_count, 0) AS building_count,
  COALESCE(zi.total_agents, 0) AS total_agents,
  COALESCE(zi.total_capacity, 0) AS total_capacity,
  COALESCE(zi.critical_understaffed_count, 0) AS critical_understaffed_count,
  COALESCE(zi.avg_readiness, 0.0) AS avg_readiness,

  LEAST(1.0, GREATEST(0.0,
    (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
    + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
    - (COALESCE(zep.event_pressure, 0.0) * 0.25)
  )) AS stability,

  CASE
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.25)
    )) < 0.3 THEN 'critical'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.25)
    )) < 0.5 THEN 'unstable'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.25)
    )) < 0.7 THEN 'functional'
    WHEN LEAST(1.0, GREATEST(0.0,
      (COALESCE(zi.infrastructure_score, 0.0) * 0.5)
      + (COALESCE(st_sec.game_weight, game_weight_fallback('security_level', z.security_level)) * 0.3)
      - (COALESCE(zep.event_pressure, 0.0) * 0.25)
    )) < 0.9 THEN 'stable'
    ELSE 'exemplary'
  END AS stability_label

FROM zones z
LEFT JOIN zone_infrastructure zi ON zi.zone_id = z.id
LEFT JOIN zone_event_pressure zep ON zep.zone_id = z.id
LEFT JOIN simulation_taxonomies st_sec ON
  st_sec.simulation_id = z.simulation_id
  AND st_sec.taxonomy_type = 'security_level'
  AND st_sec.value = z.security_level;

CREATE UNIQUE INDEX idx_mv_zone_stability_pk ON mv_zone_stability (zone_id);
CREATE INDEX idx_mv_zone_stability_sim ON mv_zone_stability (simulation_id);


-- Recreate mv_simulation_health (unchanged, dependency rebuild)

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

GRANT SELECT ON mv_zone_stability TO authenticated, anon;
GRANT SELECT ON mv_simulation_health TO authenticated, anon;

SELECT refresh_all_game_metrics();
