-- Migration 012: Storage buckets + RLS

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('agent.portraits', 'agent.portraits', true),
    ('user.agent.portraits', 'user.agent.portraits', true),
    ('building.images', 'building.images', true),
    ('simulation.assets', 'simulation.assets', true);

-- Storage RLS: Agent portraits (Backend AI + Member read)
CREATE POLICY agent_portraits_select ON storage.objects FOR SELECT
    USING (bucket_id = 'agent.portraits');

CREATE POLICY agent_portraits_insert ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'agent.portraits'
        AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
    );

-- Storage RLS: User agent portraits (own user only)
CREATE POLICY user_agent_portraits_all ON storage.objects
    FOR ALL USING (
        bucket_id = 'user.agent.portraits'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: Building images (Backend AI + Member read)
CREATE POLICY building_images_select ON storage.objects FOR SELECT
    USING (bucket_id = 'building.images');

CREATE POLICY building_images_insert ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'building.images'
        AND (auth.role() = 'service_role' OR auth.role() = 'authenticated')
    );

-- Storage RLS: Simulation assets (Admin+ upload, Member read)
CREATE POLICY simulation_assets_select ON storage.objects FOR SELECT
    USING (bucket_id = 'simulation.assets');

CREATE POLICY simulation_assets_insert ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'simulation.assets'
        AND auth.role() = 'authenticated'
    );
