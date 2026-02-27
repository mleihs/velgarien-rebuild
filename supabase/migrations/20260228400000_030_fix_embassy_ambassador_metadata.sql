-- Migration 030: Fix embassy ambassador metadata ordering + anon RLS policy
--
-- Part A: Fix ambassador_a/ambassador_b metadata ordering.
-- Migration 028 used LEAST/GREATEST which correctly swapped building/simulation pairs
-- but left the ambassador metadata keys in original INSERT order.
-- This checks if ambassador_a's name belongs to simulation_a's agents;
-- if not, swaps ambassador_a ↔ ambassador_b in the metadata.

WITH fixed AS (
  SELECT e.id,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM agents a
        WHERE a.simulation_id = e.simulation_a_id
          AND a.name = (e.embassy_metadata->'ambassador_a'->>'name')
          AND a.deleted_at IS NULL
      ) THEN e.embassy_metadata  -- already correct
      ELSE jsonb_set(
        jsonb_set(e.embassy_metadata, '{ambassador_a}', e.embassy_metadata->'ambassador_b'),
        '{ambassador_b}', e.embassy_metadata->'ambassador_a'
      )
    END AS fixed_metadata
  FROM embassies e
  WHERE e.embassy_metadata ? 'ambassador_a'
    AND e.embassy_metadata ? 'ambassador_b'
)
UPDATE embassies SET embassy_metadata = fixed.fixed_metadata
FROM fixed WHERE embassies.id = fixed.id;

-- Part B: Fix anon RLS policy to check BOTH simulations are active.
-- Previously only checked simulation_a_id, which could hide valid embassies
-- or show embassies linking to deleted simulations.

DROP POLICY IF EXISTS embassies_anon_select ON embassies;
CREATE POLICY embassies_anon_select ON embassies
    FOR SELECT TO anon
    USING (
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM simulations
            WHERE simulations.id = embassies.simulation_a_id
              AND simulations.status = 'active'
              AND simulations.deleted_at IS NULL
        )
        AND EXISTS (
            SELECT 1 FROM simulations
            WHERE simulations.id = embassies.simulation_b_id
              AND simulations.status = 'active'
              AND simulations.deleted_at IS NULL
        )
    );
