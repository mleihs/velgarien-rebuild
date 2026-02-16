-- Fix audit_log INSERT policy: allow authenticated users (not just service_role)
-- to insert audit entries for simulations they belong to.
-- The previous policy only allowed service_role, but the backend uses
-- user JWTs (defense-in-depth pattern), causing all audit inserts to fail.

DROP POLICY IF EXISTS audit_log_insert ON audit_log;

CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM simulation_members sm
      WHERE sm.simulation_id = audit_log.simulation_id
        AND sm.user_id = auth.uid()
    )
  );
