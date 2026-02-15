-- Migration 009: Trigger functions and trigger assignments

-- ============================================
-- Business Logic Trigger Functions
-- ============================================

-- Chat conversation stats (message_count + last_message_at)
CREATE OR REPLACE FUNCTION public.update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agent primary profession exclusivity
CREATE OR REPLACE FUNCTION public.enforce_single_primary_profession()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE agent_professions
        SET is_primary = false
        WHERE agent_id = NEW.agent_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Simulation status transition validation
CREATE OR REPLACE FUNCTION public.validate_simulation_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    valid_transitions jsonb := '{
        "draft": ["configuring"],
        "configuring": ["active"],
        "active": ["paused", "archived"],
        "paused": ["active", "archived"],
        "archived": []
    }'::jsonb;
    allowed jsonb;
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    allowed := valid_transitions -> OLD.status;
    IF allowed IS NULL OR NOT (allowed ? NEW.status) THEN
        RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Slug immutability
CREATE OR REPLACE FUNCTION public.immutable_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.slug IS NOT NULL AND OLD.slug != NEW.slug THEN
        RAISE EXCEPTION 'Slug cannot be changed after creation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Last owner protection
CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.member_role = 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM simulation_members
            WHERE simulation_id = OLD.simulation_id
              AND member_role = 'owner'
              AND id != OLD.id
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last owner of a simulation';
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- updated_at triggers (16 tables)
-- ============================================
CREATE TRIGGER trg_simulations_updated_at BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_simulation_settings_updated_at BEFORE UPDATE ON simulation_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agent_professions_updated_at BEFORE UPDATE ON agent_professions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_event_reactions_updated_at BEFORE UPDATE ON event_reactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_city_streets_updated_at BEFORE UPDATE ON city_streets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_social_trends_updated_at BEFORE UPDATE ON social_trends
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_social_media_comments_updated_at BEFORE UPDATE ON social_media_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Business logic triggers
-- ============================================
CREATE TRIGGER trg_chat_messages_stats AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

CREATE TRIGGER trg_primary_profession BEFORE INSERT OR UPDATE ON agent_professions
    FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_profession();

CREATE TRIGGER trg_simulation_status BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION validate_simulation_status_transition();

CREATE TRIGGER trg_slug_immutable BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION immutable_slug();

CREATE TRIGGER trg_last_owner BEFORE DELETE ON simulation_members
    FOR EACH ROW EXECUTE FUNCTION prevent_last_owner_removal();
