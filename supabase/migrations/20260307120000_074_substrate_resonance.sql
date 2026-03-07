-- ============================================================================
-- Migration 074: Substrate Resonance System
-- ============================================================================
-- Introduces platform-level resonance events that cascade into per-simulation
-- events via archetypal transformation.
--
-- Tables:
--   substrate_resonances  — platform-level tremor records
--   resonance_impacts     — per-simulation impact tracking + spawned events
--
-- All pressure/zone logic stays in existing event pipeline (no changes needed).
-- ============================================================================

-- ── Enums / Domain Types ────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resonance_status') THEN
    CREATE TYPE resonance_status AS ENUM (
      'detected', 'impacting', 'subsiding', 'archived'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resonance_impact_status') THEN
    CREATE TYPE resonance_impact_status AS ENUM (
      'pending', 'generating', 'completed', 'skipped', 'failed'
    );
  END IF;
END $$;


-- ── substrate_resonances ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS substrate_resonances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_category TEXT NOT NULL,
  resonance_signature TEXT NOT NULL,
  archetype       TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  bureau_dispatch TEXT,
  real_world_source JSONB,
  magnitude       NUMERIC(3,2) NOT NULL DEFAULT 0.50
                    CHECK (magnitude >= 0.10 AND magnitude <= 1.00),
  affected_event_types TEXT[] NOT NULL DEFAULT '{}',
  status          resonance_status NOT NULL DEFAULT 'detected',
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  impacts_at      TIMESTAMPTZ NOT NULL,
  subsides_at     TIMESTAMPTZ,
  created_by_id   UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  -- Validate known signatures
  CONSTRAINT valid_resonance_signature CHECK (
    resonance_signature IN (
      'economic_tremor', 'conflict_wave', 'biological_tide',
      'elemental_surge', 'authority_fracture', 'innovation_spark',
      'consciousness_drift', 'decay_bloom'
    )
  ),

  -- Validate known archetypes
  CONSTRAINT valid_archetype CHECK (
    archetype IN (
      'The Tower', 'The Shadow', 'The Devouring Mother',
      'The Deluge', 'The Overthrow', 'The Prometheus',
      'The Awakening', 'The Entropy'
    )
  ),

  -- Validate source categories
  CONSTRAINT valid_source_category CHECK (
    source_category IN (
      'economic_crisis', 'military_conflict', 'pandemic',
      'natural_disaster', 'political_upheaval', 'tech_breakthrough',
      'cultural_shift', 'environmental_disaster'
    )
  )
);

COMMENT ON TABLE substrate_resonances IS
  'Platform-level phenomena that propagate through the multiverse substrate.';


-- ── resonance_impacts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resonance_impacts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resonance_id         UUID NOT NULL REFERENCES substrate_resonances(id) ON DELETE CASCADE,
  simulation_id        UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  susceptibility       NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  effective_magnitude  NUMERIC(3,2) NOT NULL,
  status               resonance_impact_status NOT NULL DEFAULT 'pending',
  spawned_event_ids    UUID[] DEFAULT '{}',
  narrative_context    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_resonance_simulation UNIQUE (resonance_id, simulation_id)
);

COMMENT ON TABLE resonance_impacts IS
  'Tracks how each resonance affects each simulation and which events were spawned.';


-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_resonances_status
  ON substrate_resonances (status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resonances_signature
  ON substrate_resonances (resonance_signature) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resonances_detected_at
  ON substrate_resonances (detected_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resonances_impacts_at
  ON substrate_resonances (impacts_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resonance_impacts_resonance
  ON resonance_impacts (resonance_id);

CREATE INDEX IF NOT EXISTS idx_resonance_impacts_simulation
  ON resonance_impacts (simulation_id);

CREATE INDEX IF NOT EXISTS idx_resonance_impacts_status
  ON resonance_impacts (status);


-- ── Soft-delete view ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW active_resonances AS
  SELECT * FROM substrate_resonances WHERE deleted_at IS NULL;


-- ── Updated-at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_resonance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resonance_updated_at ON substrate_resonances;
CREATE TRIGGER trg_resonance_updated_at
  BEFORE UPDATE ON substrate_resonances
  FOR EACH ROW
  EXECUTE FUNCTION update_resonance_updated_at();


-- ── Auto-transition: detected → impacting when impacts_at is reached ────────
-- This function is called by process_resonance_impacts() in the service layer,
-- but we also provide a Postgres-level check for consistency.

CREATE OR REPLACE FUNCTION check_resonance_impact_time()
RETURNS TRIGGER AS $$
BEGIN
  -- When all impacts for a resonance are completed, transition to subsiding
  IF NEW.status = 'completed' THEN
    PERFORM 1 FROM resonance_impacts
      WHERE resonance_id = NEW.resonance_id
        AND status NOT IN ('completed', 'skipped', 'failed')
        AND id != NEW.id;

    IF NOT FOUND THEN
      UPDATE substrate_resonances
        SET status = 'subsiding',
            subsides_at = COALESCE(subsides_at, now() + interval '48 hours')
        WHERE id = NEW.resonance_id
          AND status = 'impacting';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_resonance_completion ON resonance_impacts;
CREATE TRIGGER trg_check_resonance_completion
  AFTER UPDATE ON resonance_impacts
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION check_resonance_impact_time();


-- ── Compute effective magnitude in Postgres ─────────────────────────────────
-- Ensures the formula resonance.magnitude * susceptibility stays in the DB.

CREATE OR REPLACE FUNCTION compute_effective_magnitude()
RETURNS TRIGGER AS $$
BEGIN
  NEW.effective_magnitude = LEAST(
    ROUND((
      SELECT magnitude FROM substrate_resonances WHERE id = NEW.resonance_id
    ) * NEW.susceptibility, 2),
    1.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_effective_magnitude ON resonance_impacts;
CREATE TRIGGER trg_compute_effective_magnitude
  BEFORE INSERT ON resonance_impacts
  FOR EACH ROW
  EXECUTE FUNCTION compute_effective_magnitude();


-- ── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE substrate_resonances ENABLE ROW LEVEL SECURITY;
ALTER TABLE resonance_impacts ENABLE ROW LEVEL SECURITY;

-- Resonances are platform-level: publicly readable, writable by authenticated
CREATE POLICY "resonances_select_public"
  ON substrate_resonances FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "resonances_insert_authenticated"
  ON substrate_resonances FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "resonances_update_authenticated"
  ON substrate_resonances FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Impacts: readable by anyone (simulation data is public), writable by authenticated
CREATE POLICY "resonance_impacts_select_public"
  ON resonance_impacts FOR SELECT
  USING (true);

CREATE POLICY "resonance_impacts_insert_authenticated"
  ON resonance_impacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "resonance_impacts_update_authenticated"
  ON resonance_impacts FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ── Add 'resonance' to event_chains chain_type if not present ───────────────
-- Allows resonance-spawned events to be chain-linked.

DO $$
BEGIN
  -- Update the CHECK constraint on event_chains to include 'resonance'
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'event_chains_chain_type_check'
      AND table_name = 'event_chains'
  ) THEN
    ALTER TABLE event_chains DROP CONSTRAINT event_chains_chain_type_check;
    ALTER TABLE event_chains ADD CONSTRAINT event_chains_chain_type_check
      CHECK (chain_type IN ('escalation', 'follow_up', 'resolution', 'cascade', 'resonance'));
  END IF;
END $$;
