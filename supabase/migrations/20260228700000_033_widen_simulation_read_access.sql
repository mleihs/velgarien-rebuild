-- Migration 033: Widen simulations SELECT for authenticated users
--
-- Problem: Authenticated users can only read simulations they own or are members of.
-- The leaderboard needs to resolve simulation names from epoch_participants.simulation_id,
-- but the current policy blocks cross-sim name resolution.
--
-- Fix: Allow authenticated users to also read all active simulations (same as anon policy).
-- This only affects the simulations table — entity data (agents, buildings, events) stays
-- restricted to simulation members. Cross-sim intel is revealed via spy operatives.

DROP POLICY simulations_select ON simulations;
CREATE POLICY simulations_select ON simulations FOR SELECT
    USING (
        -- Active sims visible to everyone (matches anon policy for name resolution)
        (status = 'active' AND deleted_at IS NULL)
        -- Own sims always visible regardless of status
        OR user_has_simulation_access(id)
        OR owner_id = auth.uid()
    );
