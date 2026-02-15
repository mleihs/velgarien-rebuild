-- Migration 007: RLS helper functions + utility functions

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Role hierarchy check (immutable for optimizer)
CREATE OR REPLACE FUNCTION public.role_meets_minimum(user_role text, min_role text)
RETURNS boolean AS $$
    SELECT CASE min_role
        WHEN 'viewer' THEN user_role IN ('owner', 'admin', 'editor', 'viewer')
        WHEN 'editor' THEN user_role IN ('owner', 'admin', 'editor')
        WHEN 'admin'  THEN user_role IN ('owner', 'admin')
        WHEN 'owner'  THEN user_role = 'owner'
        ELSE false
    END;
$$ LANGUAGE sql IMMUTABLE;

-- Check if user has simulation access
CREATE OR REPLACE FUNCTION public.user_has_simulation_access(sim_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM simulation_members
        WHERE simulation_id = sim_id AND user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has a specific role in simulation
CREATE OR REPLACE FUNCTION public.user_has_simulation_role(sim_id uuid, min_role text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM simulation_members
        WHERE simulation_id = sim_id
          AND user_id = auth.uid()
          AND role_meets_minimum(member_role, min_role)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's role in a simulation
CREATE OR REPLACE FUNCTION public.user_simulation_role(sim_id uuid)
RETURNS text AS $$
    SELECT member_role FROM simulation_members
    WHERE simulation_id = sim_id AND user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
