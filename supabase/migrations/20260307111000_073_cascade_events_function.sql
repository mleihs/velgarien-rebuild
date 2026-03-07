-- Migration 073: Cascade Events Function
--
-- When a zone's event_pressure exceeds the cascade threshold (default 0.7),
-- auto-spawns a secondary event linked via event_chains (chain_type='cascade').
-- Rate-limited to 1 cascade per zone per pressure window.

CREATE OR REPLACE FUNCTION process_cascade_events(p_simulation_id UUID)
RETURNS TABLE(event_id UUID, zone_name TEXT) AS $$
DECLARE
  zone_rec RECORD;
  cascade_title TEXT;
  new_event_id UUID;
  highest_event_id UUID;
  templates TEXT[];
  cascade_threshold NUMERIC;
  window_days INT;
  cascade_event_type TEXT;
BEGIN
  -- Get configurable threshold (default 0.7)
  SELECT COALESCE((ss.setting_value #>> '{}')::numeric, 0.7) INTO cascade_threshold
  FROM simulation_settings ss
  WHERE ss.simulation_id = p_simulation_id
    AND ss.category = 'game_mechanics'
    AND ss.setting_key = 'cascade_threshold';
  IF cascade_threshold IS NULL THEN cascade_threshold := 0.7; END IF;

  -- Get window days for rate limiting
  SELECT COALESCE((ss.setting_value #>> '{}')::int, 30) INTO window_days
  FROM simulation_settings ss
  WHERE ss.simulation_id = p_simulation_id
    AND ss.category = 'world'
    AND ss.setting_key = 'event_pressure_window_days';
  IF window_days IS NULL THEN window_days := 30; END IF;

  FOR zone_rec IN
    SELECT zs.zone_id, zs.zone_name, zs.event_pressure,
           z.zone_type, z.simulation_id
    FROM mv_zone_stability zs
    JOIN zones z ON z.id = zs.zone_id
    WHERE zs.simulation_id = p_simulation_id
      AND zs.event_pressure > cascade_threshold
  LOOP
    -- Rate limit: skip if cascade already exists for this zone in window
    IF EXISTS (
      SELECT 1 FROM events e
      WHERE e.simulation_id = p_simulation_id
        AND e.data_source = 'cascade'
        AND e.location = zone_rec.zone_name
        AND e.occurred_at >= (now() - interval '1 day' * window_days)
        AND e.deleted_at IS NULL
    ) THEN
      CONTINUE;
    END IF;

    -- Skip quarantined zones
    IF EXISTS (
      SELECT 1 FROM zone_actions za
      WHERE za.zone_id = zone_rec.zone_id
        AND za.action_type = 'quarantine'
        AND za.deleted_at IS NULL
        AND za.expires_at > now()
    ) THEN
      CONTINUE;
    END IF;

    -- Select template based on zone_type
    templates := CASE zone_rec.zone_type
      WHEN 'residential' THEN ARRAY['Civil Unrest in %s', 'Housing Crisis in %s']
      WHEN 'commercial' THEN ARRAY['Market Panic in %s', 'Supply Chain Collapse in %s']
      WHEN 'industrial' THEN ARRAY['Infrastructure Failure in %s', 'Factory Shutdown in %s']
      WHEN 'military' THEN ARRAY['Security Breach in %s', 'Garrison Revolt in %s']
      WHEN 'religious' THEN ARRAY['Crisis of Faith in %s', 'Temple Desecration in %s']
      WHEN 'government' THEN ARRAY['Political Crisis in %s', 'Bureaucratic Collapse in %s']
      WHEN 'slums' THEN ARRAY['Epidemic in %s', 'Riot in %s']
      WHEN 'ruins' THEN ARRAY['Structural Collapse in %s', 'Ancient Curse in %s']
      ELSE ARRAY['Crisis in %s']
    END;

    cascade_title := format(
      templates[1 + floor(random() * array_length(templates, 1))::int % array_length(templates, 1)],
      zone_rec.zone_name
    );

    -- Derive cascade event_type from zone_type
    cascade_event_type := CASE zone_rec.zone_type
      WHEN 'military' THEN 'military'
      WHEN 'commercial' THEN 'trade'
      WHEN 'religious' THEN 'religious'
      WHEN 'government' THEN 'intrigue'
      WHEN 'ruins' THEN 'discovery'
      WHEN 'residential' THEN 'social'
      WHEN 'slums' THEN 'crisis'
      WHEN 'industrial' THEN 'crisis'
      ELSE 'crisis'
    END;

    -- Create cascade event
    INSERT INTO events (
      simulation_id, title, event_type, description, occurred_at,
      data_source, impact_level, location, tags, event_status
    )
    VALUES (
      p_simulation_id,
      cascade_title,
      cascade_event_type,
      format('Auto-generated cascade event. Zone pressure exceeded threshold (%.2f > %.2f).',
             zone_rec.event_pressure, cascade_threshold),
      now(),
      'cascade',
      LEAST(10, GREATEST(4, FLOOR(zone_rec.event_pressure * 7)::int)),
      zone_rec.zone_name,
      ARRAY['cascade', 'auto-generated'],
      'active'
    ) RETURNING id INTO new_event_id;

    -- Link to highest-impact source event in that zone
    SELECT e.id INTO highest_event_id
    FROM event_zone_links ezl
    JOIN events e ON e.id = ezl.event_id
    WHERE ezl.zone_id = zone_rec.zone_id
      AND e.event_status = 'active'
      AND e.deleted_at IS NULL
      AND e.id != new_event_id
    ORDER BY e.impact_level DESC
    LIMIT 1;

    IF highest_event_id IS NOT NULL THEN
      INSERT INTO event_chains (simulation_id, parent_event_id, child_event_id, chain_type)
      VALUES (p_simulation_id, highest_event_id, new_event_id, 'cascade')
      ON CONFLICT DO NOTHING;
    END IF;

    event_id := new_event_id;
    zone_name := zone_rec.zone_name;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_cascade_events(UUID) IS
  'Spawns cascade events in zones where event_pressure exceeds the cascade threshold. '
  'Rate-limited to 1 cascade per zone per pressure window. Skips quarantined zones.';
