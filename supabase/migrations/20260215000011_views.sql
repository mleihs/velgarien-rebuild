-- Migration 011: Views (regular + materialized)

-- Active-Only Views (Soft-Delete Filter)
CREATE VIEW public.active_agents AS
    SELECT * FROM agents WHERE deleted_at IS NULL;

CREATE VIEW public.active_buildings AS
    SELECT * FROM buildings WHERE deleted_at IS NULL;

CREATE VIEW public.active_events AS
    SELECT * FROM events WHERE deleted_at IS NULL;

CREATE VIEW public.active_simulations AS
    SELECT * FROM simulations WHERE deleted_at IS NULL;

-- Dashboard Aggregation
CREATE VIEW public.simulation_dashboard AS
    SELECT
        s.id AS simulation_id,
        s.name,
        s.slug,
        s.status,
        s.theme,
        s.content_locale,
        s.owner_id,
        (SELECT count(*) FROM simulation_members sm WHERE sm.simulation_id = s.id) AS member_count,
        (SELECT count(*) FROM agents a WHERE a.simulation_id = s.id AND a.deleted_at IS NULL) AS agent_count,
        (SELECT count(*) FROM buildings b WHERE b.simulation_id = s.id AND b.deleted_at IS NULL) AS building_count,
        (SELECT count(*) FROM events e WHERE e.simulation_id = s.id AND e.deleted_at IS NULL) AS event_count,
        s.created_at,
        s.updated_at
    FROM simulations s
    WHERE s.deleted_at IS NULL;

-- Conversation Summaries
CREATE VIEW public.conversation_summaries AS
    SELECT
        cc.id,
        cc.simulation_id,
        cc.user_id,
        cc.agent_id,
        a.name AS agent_name,
        a.portrait_image_url AS agent_portrait_url,
        cc.title,
        cc.status,
        cc.message_count,
        cc.last_message_at,
        cc.created_at
    FROM chat_conversations cc
    JOIN agents a ON cc.agent_id = a.id;

-- Materialized Views
CREATE MATERIALIZED VIEW public.campaign_performance AS
    SELECT
        c.id AS campaign_id,
        c.simulation_id,
        c.title,
        c.campaign_type,
        count(DISTINCT ce.event_id) AS event_count,
        coalesce(sum(ce.reactions_count), 0) AS total_reactions,
        count(DISTINCT er.agent_id) AS unique_reacting_agents,
        c.created_at,
        c.updated_at
    FROM campaigns c
    LEFT JOIN campaign_events ce ON c.id = ce.campaign_id
    LEFT JOIN events e ON ce.event_id = e.id
    LEFT JOIN event_reactions er ON e.id = er.event_id
    GROUP BY c.id, c.simulation_id, c.title, c.campaign_type, c.created_at, c.updated_at;

CREATE UNIQUE INDEX idx_campaign_performance_pk ON campaign_performance(campaign_id);

CREATE MATERIALIZED VIEW public.agent_statistics AS
    SELECT
        a.id AS agent_id,
        a.simulation_id,
        a.name,
        count(DISTINCT ap.id) AS profession_count,
        count(DISTINCT er.id) AS reaction_count,
        count(DISTINCT bar.building_id) AS building_count
    FROM agents a
    LEFT JOIN agent_professions ap ON a.id = ap.agent_id
    LEFT JOIN event_reactions er ON a.id = er.agent_id
    LEFT JOIN building_agent_relations bar ON a.id = bar.agent_id
    WHERE a.deleted_at IS NULL
    GROUP BY a.id, a.simulation_id, a.name;

CREATE UNIQUE INDEX idx_agent_statistics_pk ON agent_statistics(agent_id);
