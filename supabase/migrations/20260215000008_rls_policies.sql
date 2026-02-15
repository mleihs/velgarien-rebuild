-- Migration 008: RLS policies for all 27 tables

-- ============================================
-- simulations
-- ============================================
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY simulations_select ON simulations FOR SELECT
    USING (user_has_simulation_access(id) OR owner_id = auth.uid());

CREATE POLICY simulations_insert ON simulations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY simulations_update ON simulations FOR UPDATE
    USING (user_has_simulation_role(id, 'admin'));

CREATE POLICY simulations_delete ON simulations FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================
-- simulation_members
-- ============================================
ALTER TABLE simulation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY sim_members_select ON simulation_members FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY sim_members_insert ON simulation_members FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_members_update ON simulation_members FOR UPDATE
    USING (user_simulation_role(simulation_id) = 'owner');

CREATE POLICY sim_members_delete ON simulation_members FOR DELETE
    USING (user_simulation_role(simulation_id) = 'owner');

-- ============================================
-- simulation_settings
-- ============================================
ALTER TABLE simulation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY sim_settings_select ON simulation_settings FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY sim_settings_insert ON simulation_settings FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_settings_update ON simulation_settings FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_settings_delete ON simulation_settings FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- simulation_taxonomies
-- ============================================
ALTER TABLE simulation_taxonomies ENABLE ROW LEVEL SECURITY;

CREATE POLICY sim_taxonomies_select ON simulation_taxonomies FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY sim_taxonomies_insert ON simulation_taxonomies FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_taxonomies_update ON simulation_taxonomies FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_taxonomies_delete ON simulation_taxonomies FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- simulation_invitations
-- ============================================
ALTER TABLE simulation_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY sim_invitations_select ON simulation_invitations FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY sim_invitations_insert ON simulation_invitations FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY sim_invitations_delete ON simulation_invitations FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- agents
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select ON agents FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY agents_insert ON agents FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agents_update ON agents FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agents_delete ON agents FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- agent_professions
-- ============================================
ALTER TABLE agent_professions ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_professions_select ON agent_professions FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY agent_professions_insert ON agent_professions FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agent_professions_update ON agent_professions FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agent_professions_delete ON agent_professions FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- buildings
-- ============================================
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY buildings_select ON buildings FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY buildings_insert ON buildings FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY buildings_update ON buildings FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY buildings_delete ON buildings FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- events
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select ON events FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY events_insert ON events FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY events_update ON events FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY events_delete ON events FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- event_reactions
-- ============================================
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_reactions_select ON event_reactions FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY event_reactions_insert ON event_reactions FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY event_reactions_update ON event_reactions FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY event_reactions_delete ON event_reactions FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- cities
-- ============================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY cities_select ON cities FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY cities_insert ON cities FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY cities_update ON cities FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY cities_delete ON cities FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- zones
-- ============================================
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY zones_select ON zones FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY zones_insert ON zones FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY zones_update ON zones FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY zones_delete ON zones FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- city_streets
-- ============================================
ALTER TABLE city_streets ENABLE ROW LEVEL SECURITY;

CREATE POLICY city_streets_select ON city_streets FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY city_streets_insert ON city_streets FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY city_streets_update ON city_streets FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY city_streets_delete ON city_streets FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- campaigns
-- ============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select ON campaigns FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY campaigns_insert ON campaigns FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaigns_update ON campaigns FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaigns_delete ON campaigns FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- campaign_events
-- ============================================
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_events_select ON campaign_events FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY campaign_events_insert ON campaign_events FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaign_events_update ON campaign_events FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaign_events_delete ON campaign_events FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- campaign_metrics
-- ============================================
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_metrics_select ON campaign_metrics FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY campaign_metrics_insert ON campaign_metrics FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaign_metrics_update ON campaign_metrics FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY campaign_metrics_delete ON campaign_metrics FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- social_trends
-- ============================================
ALTER TABLE social_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_trends_select ON social_trends FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY social_trends_insert ON social_trends FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_trends_update ON social_trends FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_trends_delete ON social_trends FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- social_media_posts
-- ============================================
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_media_posts_select ON social_media_posts FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY social_media_posts_insert ON social_media_posts FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_posts_update ON social_media_posts FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_posts_delete ON social_media_posts FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- social_media_comments
-- ============================================
ALTER TABLE social_media_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_media_comments_select ON social_media_comments FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY social_media_comments_insert ON social_media_comments FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_comments_update ON social_media_comments FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_comments_delete ON social_media_comments FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- social_media_agent_reactions
-- ============================================
ALTER TABLE social_media_agent_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_media_agent_reactions_select ON social_media_agent_reactions FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY social_media_agent_reactions_insert ON social_media_agent_reactions FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_agent_reactions_update ON social_media_agent_reactions FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY social_media_agent_reactions_delete ON social_media_agent_reactions FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- building_agent_relations
-- ============================================
ALTER TABLE building_agent_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_agent_relations_select ON building_agent_relations FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY building_agent_relations_insert ON building_agent_relations FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY building_agent_relations_delete ON building_agent_relations FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'editor'));

-- ============================================
-- building_event_relations
-- ============================================
ALTER TABLE building_event_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_event_relations_select ON building_event_relations FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY building_event_relations_insert ON building_event_relations FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY building_event_relations_delete ON building_event_relations FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'editor'));

-- ============================================
-- building_profession_requirements
-- ============================================
ALTER TABLE building_profession_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY building_profession_requirements_select ON building_profession_requirements FOR SELECT
    USING (user_has_simulation_access(simulation_id));

CREATE POLICY building_profession_requirements_insert ON building_profession_requirements FOR INSERT
    WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY building_profession_requirements_update ON building_profession_requirements FOR UPDATE
    USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY building_profession_requirements_delete ON building_profession_requirements FOR DELETE
    USING (user_has_simulation_role(simulation_id, 'admin'));

-- ============================================
-- chat_conversations (user-scoped)
-- ============================================
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_conversations_select ON chat_conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY chat_conversations_insert ON chat_conversations FOR INSERT
    WITH CHECK (user_id = auth.uid() AND user_has_simulation_access(simulation_id));

CREATE POLICY chat_conversations_update ON chat_conversations FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY chat_conversations_delete ON chat_conversations FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- chat_messages (via conversation ownership)
-- ============================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select ON chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
    ));

CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE id = chat_messages.conversation_id AND user_id = auth.uid()
    ));

-- ============================================
-- prompt_templates
-- ============================================
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompt_templates_select ON prompt_templates FOR SELECT
    USING (
        simulation_id IS NULL
        OR user_has_simulation_access(simulation_id)
    );

CREATE POLICY prompt_templates_insert ON prompt_templates FOR INSERT
    WITH CHECK (
        simulation_id IS NOT NULL
        AND user_has_simulation_role(simulation_id, 'admin')
    );

CREATE POLICY prompt_templates_update ON prompt_templates FOR UPDATE
    USING (
        simulation_id IS NOT NULL
        AND user_has_simulation_role(simulation_id, 'admin')
    );

CREATE POLICY prompt_templates_delete ON prompt_templates FOR DELETE
    USING (
        simulation_id IS NOT NULL
        AND user_has_simulation_role(simulation_id, 'admin')
    );

-- ============================================
-- audit_log (admin read, service write)
-- ============================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select ON audit_log FOR SELECT
    USING (user_has_simulation_role(simulation_id, 'admin'));

CREATE POLICY audit_log_insert ON audit_log FOR INSERT
    TO service_role
    WITH CHECK (true);
