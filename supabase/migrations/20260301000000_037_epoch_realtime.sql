-- Migration 037: Epoch Realtime — chat messages, ready signals, broadcast triggers
-- Adds player-to-player chat (epoch-wide + team-only), cycle_ready column,
-- and AFTER INSERT/UPDATE triggers that broadcast via Supabase Realtime.

-- ── epoch_chat_messages table ────────────────────────────────

CREATE TABLE epoch_chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_id        UUID NOT NULL REFERENCES game_epochs(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id),
  sender_simulation_id UUID NOT NULL REFERENCES simulations(id),
  channel_type    TEXT NOT NULL DEFAULT 'epoch'
                  CHECK (channel_type IN ('epoch', 'team')),
  team_id         UUID REFERENCES epoch_teams(id) ON DELETE SET NULL,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for cursor-based pagination
CREATE INDEX idx_epoch_chat_epoch_created ON epoch_chat_messages (epoch_id, created_at);
CREATE INDEX idx_epoch_chat_team_created ON epoch_chat_messages (team_id, created_at)
  WHERE team_id IS NOT NULL;

-- ── cycle_ready column on epoch_participants ─────────────────

ALTER TABLE epoch_participants
  ADD COLUMN cycle_ready BOOLEAN NOT NULL DEFAULT false;

-- ── RLS policies on epoch_chat_messages ──────────────────────

ALTER TABLE epoch_chat_messages ENABLE ROW LEVEL SECURITY;

-- Participants can read epoch-wide messages
CREATE POLICY epoch_chat_select_epoch ON epoch_chat_messages
  FOR SELECT TO authenticated
  USING (
    channel_type = 'epoch'
    AND EXISTS (
      SELECT 1 FROM epoch_participants ep
      JOIN simulation_members sm ON sm.simulation_id = ep.simulation_id
      WHERE ep.epoch_id = epoch_chat_messages.epoch_id
        AND sm.user_id = auth.uid()
    )
  );

-- Team members can read their team's messages
CREATE POLICY epoch_chat_select_team ON epoch_chat_messages
  FOR SELECT TO authenticated
  USING (
    channel_type = 'team'
    AND team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM epoch_participants ep
      JOIN simulation_members sm ON sm.simulation_id = ep.simulation_id
      WHERE ep.epoch_id = epoch_chat_messages.epoch_id
        AND ep.team_id = epoch_chat_messages.team_id
        AND sm.user_id = auth.uid()
    )
  );

-- Participants can insert messages (sender_id must match auth.uid())
CREATE POLICY epoch_chat_insert ON epoch_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM epoch_participants ep
      JOIN simulation_members sm ON sm.simulation_id = ep.simulation_id
      WHERE ep.epoch_id = epoch_chat_messages.epoch_id
        AND sm.user_id = auth.uid()
    )
  );

-- Anon can read epoch-wide messages (public spectators)
CREATE POLICY epoch_chat_select_anon ON epoch_chat_messages
  FOR SELECT TO anon
  USING (channel_type = 'epoch');

-- ── Broadcast triggers ───────────────────────────────────────

-- Broadcast new chat message to the appropriate Realtime channel
-- realtime.send(payload jsonb, event text, topic text, private boolean)
CREATE OR REPLACE FUNCTION broadcast_epoch_chat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.channel_type = 'team' AND NEW.team_id IS NOT NULL THEN
    PERFORM realtime.send(
      to_jsonb(NEW),
      'new_message',
      'epoch:' || NEW.epoch_id::text || ':team:' || NEW.team_id::text || ':chat',
      true
    );
  ELSE
    PERFORM realtime.send(
      to_jsonb(NEW),
      'new_message',
      'epoch:' || NEW.epoch_id::text || ':chat',
      true
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_broadcast_epoch_chat
  AFTER INSERT ON epoch_chat_messages
  FOR EACH ROW EXECUTE FUNCTION broadcast_epoch_chat();

-- Broadcast ready signal changes
-- realtime.send(payload jsonb, event text, topic text, private boolean)
CREATE OR REPLACE FUNCTION broadcast_ready_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cycle_ready IS DISTINCT FROM NEW.cycle_ready THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'simulation_id', NEW.simulation_id,
        'cycle_ready', NEW.cycle_ready
      ),
      'ready_changed',
      'epoch:' || NEW.epoch_id::text || ':status',
      true
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_broadcast_ready_signal
  AFTER UPDATE OF cycle_ready ON epoch_participants
  FOR EACH ROW EXECUTE FUNCTION broadcast_ready_signal();
