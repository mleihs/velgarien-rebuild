-- Migration 044: Notification Preferences
-- Adds notification_preferences table for per-user email notification settings,
-- and a SECURITY DEFINER RPC for batch email lookup (used by cycle notification service).

-- ── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cycle_resolved BOOLEAN NOT NULL DEFAULT true,
    phase_changed BOOLEAN NOT NULL DEFAULT true,
    epoch_completed BOOLEAN NOT NULL DEFAULT true,
    email_locale TEXT NOT NULL DEFAULT 'en' CHECK (email_locale IN ('en', 'de')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

COMMENT ON TABLE notification_preferences IS 'Per-user email notification settings for epoch events';

-- ── Trigger ────────────────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY notification_preferences_select ON notification_preferences
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY notification_preferences_insert ON notification_preferences
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY notification_preferences_update ON notification_preferences
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ── SECURITY DEFINER RPC for batch email lookup ────────────────────────────
-- Used by CycleNotificationService to resolve user_id -> email in batch.
-- Service role only (not exposed to authenticated users).

CREATE OR REPLACE FUNCTION get_user_emails_batch(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email::TEXT
    FROM auth.users u
    WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke from public, grant to service_role only
REVOKE ALL ON FUNCTION get_user_emails_batch(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_emails_batch(UUID[]) TO service_role;
