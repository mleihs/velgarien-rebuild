-- Migration 071: Reaction Modifier Trigger
--
-- Moves the reaction modifier computation from Python into a Postgres trigger
-- on event_reactions. Auto-recomputes dominant_sentiment and reaction_modifier
-- on event metadata whenever reactions are inserted, updated, or deleted.
--
-- Emotion weights (matching the plan):
--   fear/anger/panic    → +0.1 (crisis amplifier)
--   despair             → +0.05
--   hope/defiance       → -0.1 (community resilience dampener)
--   resolve             → -0.05
--   indifference/others → 0.0

CREATE OR REPLACE FUNCTION recompute_reaction_modifier()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id      uuid;
  v_simulation_id uuid;
  v_dominant      text;
  v_modifier      numeric;
  v_existing_meta jsonb;
BEGIN
  -- Determine which event to recompute for
  IF TG_OP = 'DELETE' THEN
    v_event_id      := OLD.event_id;
    v_simulation_id := OLD.simulation_id;
  ELSE
    v_event_id      := NEW.event_id;
    v_simulation_id := NEW.simulation_id;
  END IF;

  -- Compute dominant emotion and weighted modifier in one query
  SELECT
    dominant_emotion,
    CASE WHEN counted > 0 THEN ROUND(total_weight / counted, 2) ELSE 0.0 END
  INTO v_dominant, v_modifier
  FROM (
    SELECT
      -- Dominant = emotion with highest count
      (
        SELECT lower(trim(r2.emotion))
        FROM event_reactions r2
        WHERE r2.event_id = v_event_id
          AND r2.emotion IS NOT NULL
          AND trim(r2.emotion) != ''
        GROUP BY lower(trim(r2.emotion))
        ORDER BY count(*) DESC
        LIMIT 1
      ) AS dominant_emotion,
      -- Weighted modifier = average of per-reaction weights
      SUM(
        CASE lower(trim(r.emotion))
          WHEN 'fear'         THEN 0.1
          WHEN 'anger'        THEN 0.1
          WHEN 'panic'        THEN 0.1
          WHEN 'despair'      THEN 0.05
          WHEN 'hope'         THEN -0.1
          WHEN 'defiance'     THEN -0.1
          WHEN 'resolve'      THEN -0.05
          WHEN 'indifference' THEN 0.0
          ELSE 0.0
        END
      ) AS total_weight,
      COUNT(*) FILTER (
        WHERE r.emotion IS NOT NULL
          AND trim(r.emotion) != ''
          AND lower(trim(r.emotion)) IN (
            'fear', 'anger', 'panic', 'despair',
            'hope', 'defiance', 'resolve', 'indifference'
          )
      ) AS counted
    FROM event_reactions r
    WHERE r.event_id = v_event_id
  ) agg;

  -- Read existing metadata
  SELECT COALESCE(metadata, '{}'::jsonb)
  INTO v_existing_meta
  FROM events
  WHERE id = v_event_id AND simulation_id = v_simulation_id;

  -- Update event metadata with modifier and dominant sentiment
  IF v_dominant IS NOT NULL THEN
    UPDATE events
    SET metadata = v_existing_meta
      || jsonb_build_object(
           'reaction_modifier', v_modifier,
           'dominant_sentiment', v_dominant
         ),
        updated_at = now()
    WHERE id = v_event_id AND simulation_id = v_simulation_id;
  ELSE
    -- No emotions found — clear the modifier fields
    UPDATE events
    SET metadata = (v_existing_meta - 'reaction_modifier') - 'dominant_sentiment',
        updated_at = now()
    WHERE id = v_event_id AND simulation_id = v_simulation_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to event_reactions table
DROP TRIGGER IF EXISTS trg_recompute_reaction_modifier ON event_reactions;

CREATE TRIGGER trg_recompute_reaction_modifier
  AFTER INSERT OR UPDATE OR DELETE ON event_reactions
  FOR EACH ROW
  EXECUTE FUNCTION recompute_reaction_modifier();
