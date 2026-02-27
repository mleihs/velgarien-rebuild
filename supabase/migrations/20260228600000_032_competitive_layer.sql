-- Migration 032: Competitive Layer — Epochs, Operatives, Scoring
--
-- Adds 6 tables for the PvP competitive system:
-- 1. game_epochs — epoch definitions + config
-- 2. epoch_teams — alliance definitions
-- 3. epoch_participants — simulation enrollment per epoch
-- 4. operative_missions — deployed operatives + results
-- 5. epoch_scores — score snapshots per cycle
-- 6. battle_log — narrative event feed
--
-- Plus: RLS policies, triggers, indexes, taxonomy values

-- ============================================================
-- 1. game_epochs
-- ============================================================

CREATE TABLE public.game_epochs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by_id UUID NOT NULL REFERENCES auth.users(id),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    current_cycle INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'lobby'
        CHECK (status IN ('lobby', 'foundation', 'competition', 'reckoning', 'completed', 'cancelled')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- config schema:
    -- {
    --   "duration_days": 14,
    --   "cycle_hours": 8,
    --   "rp_per_cycle": 10,
    --   "rp_cap": 30,
    --   "foundation_pct": 20,
    --   "reckoning_pct": 15,
    --   "max_team_size": 3,
    --   "allow_betrayal": true,
    --   "score_weights": {
    --     "stability": 25,
    --     "influence": 20,
    --     "sovereignty": 20,
    --     "diplomatic": 15,
    --     "military": 20
    --   },
    --   "referee_mode": false
    -- }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_epochs IS 'Competitive epoch definitions with configuration and lifecycle state.';

-- ============================================================
-- 2. epoch_teams (must be created before epoch_participants)
-- ============================================================

CREATE TABLE public.epoch_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_id UUID NOT NULL REFERENCES public.game_epochs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by_simulation_id UUID NOT NULL REFERENCES public.simulations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dissolved_at TIMESTAMPTZ,
    dissolved_reason TEXT
        CHECK (dissolved_reason IS NULL OR dissolved_reason IN ('voluntary', 'betrayal', 'epoch_end'))
);

COMMENT ON TABLE public.epoch_teams IS 'Alliance/team definitions within an epoch.';

-- ============================================================
-- 3. epoch_participants
-- ============================================================

CREATE TABLE public.epoch_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_id UUID NOT NULL REFERENCES public.game_epochs(id) ON DELETE CASCADE,
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.epoch_teams(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_rp INTEGER NOT NULL DEFAULT 0,
    last_rp_grant_at TIMESTAMPTZ,
    final_scores JSONB,
    -- final_scores schema (set at epoch end):
    -- {
    --   "stability": 72.3,
    --   "influence": 45.0,
    --   "sovereignty": 88.1,
    --   "diplomatic": 60.5,
    --   "military": 33.2,
    --   "composite": 59.8
    -- }
    UNIQUE (epoch_id, simulation_id)
);

COMMENT ON TABLE public.epoch_participants IS 'Simulation enrollment in epochs with RP tracking and final scores.';

-- ============================================================
-- 4. operative_missions
-- ============================================================

CREATE TABLE public.operative_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_id UUID NOT NULL REFERENCES public.game_epochs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    operative_type TEXT NOT NULL
        CHECK (operative_type IN ('spy', 'saboteur', 'propagandist', 'assassin', 'guardian', 'infiltrator')),
    source_simulation_id UUID NOT NULL REFERENCES public.simulations(id),
    target_simulation_id UUID REFERENCES public.simulations(id),
    embassy_id UUID REFERENCES public.embassies(id),
    target_entity_id UUID,
    target_entity_type TEXT
        CHECK (target_entity_type IS NULL OR target_entity_type IN ('building', 'agent', 'embassy', 'zone')),
    target_zone_id UUID REFERENCES public.zones(id),
    status TEXT NOT NULL DEFAULT 'deploying'
        CHECK (status IN ('deploying', 'active', 'returning', 'success', 'failed', 'detected', 'captured')),
    cost_rp INTEGER NOT NULL,
    success_probability NUMERIC(3,2),
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolves_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    mission_result JSONB,
    -- mission_result schema:
    -- {
    --   "outcome": "success|failed|detected|captured",
    --   "narrative": "AI-generated mission report text",
    --   "detected_by": "guardian_agent_id or null",
    --   "damage_dealt": {"building_id": "...", "old_condition": "good", "new_condition": "moderate"},
    --   "intel_gathered": {"zone_stability": {...}, "building_readiness": {...}},
    --   "event_created_id": "uuid of propaganda event"
    -- }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.operative_missions IS 'Covert operative deployments with success probability, timing, and results.';

-- ============================================================
-- 5. epoch_scores
-- ============================================================

CREATE TABLE public.epoch_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_id UUID NOT NULL REFERENCES public.game_epochs(id) ON DELETE CASCADE,
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    stability_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    influence_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    sovereignty_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    diplomatic_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    military_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    composite_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (epoch_id, simulation_id, cycle_number)
);

COMMENT ON TABLE public.epoch_scores IS 'Per-cycle score snapshots for each simulation in an epoch.';

-- ============================================================
-- 6. battle_log
-- ============================================================

CREATE TABLE public.battle_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    epoch_id UUID NOT NULL REFERENCES public.game_epochs(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'operative_deployed', 'mission_success', 'mission_failed',
            'detected', 'captured', 'sabotage', 'propaganda', 'assassination',
            'infiltration', 'alliance_formed', 'alliance_dissolved', 'betrayal',
            'phase_change', 'epoch_start', 'epoch_end', 'rp_allocated',
            'building_damaged', 'agent_wounded', 'counter_intel'
        )),
    source_simulation_id UUID REFERENCES public.simulations(id),
    target_simulation_id UUID REFERENCES public.simulations(id),
    mission_id UUID REFERENCES public.operative_missions(id),
    narrative TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.battle_log IS 'Narrative event feed for competitive actions during epochs.';

-- ============================================================
-- Indexes
-- ============================================================

-- Epoch lookups
CREATE INDEX idx_game_epochs_status ON public.game_epochs(status);
CREATE INDEX idx_game_epochs_created_by ON public.game_epochs(created_by_id);

-- Participant lookups
CREATE INDEX idx_epoch_participants_epoch ON public.epoch_participants(epoch_id);
CREATE INDEX idx_epoch_participants_simulation ON public.epoch_participants(simulation_id);
CREATE INDEX idx_epoch_participants_team ON public.epoch_participants(team_id) WHERE team_id IS NOT NULL;

-- Team lookups
CREATE INDEX idx_epoch_teams_epoch ON public.epoch_teams(epoch_id);

-- Mission lookups
CREATE INDEX idx_operative_missions_epoch ON public.operative_missions(epoch_id);
CREATE INDEX idx_operative_missions_agent ON public.operative_missions(agent_id);
CREATE INDEX idx_operative_missions_source ON public.operative_missions(source_simulation_id);
CREATE INDEX idx_operative_missions_target ON public.operative_missions(target_simulation_id) WHERE target_simulation_id IS NOT NULL;
CREATE INDEX idx_operative_missions_status ON public.operative_missions(status) WHERE status IN ('deploying', 'active');

-- Score lookups
CREATE INDEX idx_epoch_scores_epoch_cycle ON public.epoch_scores(epoch_id, cycle_number);
CREATE INDEX idx_epoch_scores_simulation ON public.epoch_scores(simulation_id);

-- Battle log lookups
CREATE INDEX idx_battle_log_epoch_cycle ON public.battle_log(epoch_id, cycle_number);
CREATE INDEX idx_battle_log_public ON public.battle_log(epoch_id, is_public) WHERE is_public = true;
CREATE INDEX idx_battle_log_source ON public.battle_log(source_simulation_id) WHERE source_simulation_id IS NOT NULL;
CREATE INDEX idx_battle_log_target ON public.battle_log(target_simulation_id) WHERE target_simulation_id IS NOT NULL;

-- ============================================================
-- Triggers: updated_at
-- ============================================================

CREATE TRIGGER set_game_epochs_updated_at
    BEFORE UPDATE ON public.game_epochs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Trigger: Epoch status transition validation
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_epoch_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if status is changing
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Define valid transitions
    CASE OLD.status
        WHEN 'lobby' THEN
            IF NEW.status NOT IN ('foundation', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid epoch transition: lobby -> %', NEW.status;
            END IF;
            -- Set starts_at when transitioning from lobby
            IF NEW.status = 'foundation' AND NEW.starts_at IS NULL THEN
                NEW.starts_at := now();
            END IF;
        WHEN 'foundation' THEN
            IF NEW.status NOT IN ('competition', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid epoch transition: foundation -> %', NEW.status;
            END IF;
        WHEN 'competition' THEN
            IF NEW.status NOT IN ('reckoning', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid epoch transition: competition -> %', NEW.status;
            END IF;
        WHEN 'reckoning' THEN
            IF NEW.status NOT IN ('completed', 'cancelled') THEN
                RAISE EXCEPTION 'Invalid epoch transition: reckoning -> %', NEW.status;
            END IF;
        WHEN 'completed' THEN
            RAISE EXCEPTION 'Cannot transition from completed status';
        WHEN 'cancelled' THEN
            RAISE EXCEPTION 'Cannot transition from cancelled status';
    END CASE;

    -- Set ends_at when reaching a terminal state
    IF NEW.status IN ('completed', 'cancelled') AND NEW.ends_at IS NULL THEN
        NEW.ends_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_epoch_status_change
    BEFORE UPDATE ON public.game_epochs
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_epoch_status_transition();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.game_epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epoch_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epoch_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operative_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epoch_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_log ENABLE ROW LEVEL SECURITY;

-- --- game_epochs ---

-- Anyone authenticated can view epochs
CREATE POLICY game_epochs_select ON public.game_epochs
    FOR SELECT TO authenticated
    USING (true);

-- Anon can view epochs (public spectator)
CREATE POLICY game_epochs_anon_select ON public.game_epochs
    FOR SELECT TO anon
    USING (true);

-- Creator can insert
CREATE POLICY game_epochs_insert ON public.game_epochs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by_id);

-- Creator can update (status transitions, config changes)
CREATE POLICY game_epochs_update ON public.game_epochs
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by_id)
    WITH CHECK (auth.uid() = created_by_id);

-- --- epoch_teams ---

-- Participants can view teams in their epoch
CREATE POLICY epoch_teams_select ON public.epoch_teams
    FOR SELECT TO authenticated
    USING (true);

-- Anon can view teams (spectator)
CREATE POLICY epoch_teams_anon_select ON public.epoch_teams
    FOR SELECT TO anon
    USING (true);

-- Simulation owners can create teams (validated in backend)
CREATE POLICY epoch_teams_insert ON public.epoch_teams
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Team creator's simulation owner can update
CREATE POLICY epoch_teams_update ON public.epoch_teams
    FOR UPDATE TO authenticated
    USING (true);

-- --- epoch_participants ---

-- Participants can view all participants in their epoch
CREATE POLICY epoch_participants_select ON public.epoch_participants
    FOR SELECT TO authenticated
    USING (true);

-- Anon can view participants (leaderboard)
CREATE POLICY epoch_participants_anon_select ON public.epoch_participants
    FOR SELECT TO anon
    USING (true);

-- Simulation owners can join epochs (validated in backend)
CREATE POLICY epoch_participants_insert ON public.epoch_participants
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Participants can update their own record (RP, team)
CREATE POLICY epoch_participants_update ON public.epoch_participants
    FOR UPDATE TO authenticated
    USING (true);

-- --- operative_missions ---

-- Players can see their own missions (source or target)
CREATE POLICY operative_missions_select ON public.operative_missions
    FOR SELECT TO authenticated
    USING (
        source_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid()
        )
        OR target_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid()
        )
    );

-- Simulation owners can deploy operatives (validated in backend)
CREATE POLICY operative_missions_insert ON public.operative_missions
    FOR INSERT TO authenticated
    WITH CHECK (
        source_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid() AND member_role = 'owner'
        )
    );

-- Backend updates mission status via admin client
CREATE POLICY operative_missions_update ON public.operative_missions
    FOR UPDATE TO authenticated
    USING (
        source_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid() AND member_role = 'owner'
        )
    );

-- --- epoch_scores ---

-- Anyone can view scores (leaderboard is public)
CREATE POLICY epoch_scores_select ON public.epoch_scores
    FOR SELECT TO authenticated
    USING (true);

-- Anon can view scores (public leaderboard)
CREATE POLICY epoch_scores_anon_select ON public.epoch_scores
    FOR SELECT TO anon
    USING (true);

-- Only backend (admin client) inserts scores
CREATE POLICY epoch_scores_insert ON public.epoch_scores
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- --- battle_log ---

-- Participants can see their own battle log entries
CREATE POLICY battle_log_select ON public.battle_log
    FOR SELECT TO authenticated
    USING (
        is_public = true
        OR source_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid()
        )
        OR target_simulation_id IN (
            SELECT simulation_id FROM public.simulation_members
            WHERE user_id = auth.uid()
        )
    );

-- Anon can see public battle log entries
CREATE POLICY battle_log_anon_select ON public.battle_log
    FOR SELECT TO anon
    USING (is_public = true);

-- Backend inserts battle log entries
CREATE POLICY battle_log_insert ON public.battle_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================================
-- Taxonomy values for operative types
-- ============================================================

INSERT INTO public.simulation_taxonomies (simulation_id, taxonomy_type, value, label, sort_order, is_active)
SELECT
    s.id,
    'operative_type',
    v.value,
    v.label::jsonb,
    v.sort_order,
    true
FROM public.simulations s
CROSS JOIN (VALUES
    ('spy',          '{"en": "Spy", "de": "Spion"}', 1),
    ('saboteur',     '{"en": "Saboteur", "de": "Saboteur"}', 2),
    ('propagandist', '{"en": "Propagandist", "de": "Propagandist"}', 3),
    ('assassin',     '{"en": "Assassin", "de": "Attentäter"}', 4),
    ('guardian',     '{"en": "Guardian", "de": "Wächter"}', 5),
    ('infiltrator',  '{"en": "Infiltrator", "de": "Infiltrator"}', 6)
) AS v(value, label, sort_order)
ON CONFLICT DO NOTHING;
