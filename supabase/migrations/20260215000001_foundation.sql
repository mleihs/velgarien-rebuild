-- Migration 001: Foundation tables (Plattform-Level)
-- Tables: simulations, simulation_members, simulation_settings, simulation_taxonomies, simulation_invitations

-- simulations
CREATE TABLE public.simulations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) <= 100),
    description text,
    theme text NOT NULL DEFAULT 'custom',
    status text NOT NULL DEFAULT 'draft',
    content_locale text NOT NULL DEFAULT 'en',
    additional_locales text[] DEFAULT '{}',
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    icon_url text,
    banner_url text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    archived_at timestamptz,
    deleted_at timestamptz
);

CREATE INDEX idx_simulations_owner ON simulations(owner_id);
CREATE INDEX idx_simulations_status ON simulations(status);
CREATE INDEX idx_simulations_slug ON simulations(slug);
CREATE INDEX idx_simulations_active ON simulations(owner_id) WHERE deleted_at IS NULL;

-- simulation_members
CREATE TABLE public.simulation_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_role text NOT NULL DEFAULT 'viewer',
    invited_by_id uuid REFERENCES auth.users(id),
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, user_id)
);

CREATE INDEX idx_sim_members_simulation ON simulation_members(simulation_id);
CREATE INDEX idx_sim_members_user ON simulation_members(user_id);

-- simulation_settings
CREATE TABLE public.simulation_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    category text NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL,
    updated_by_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, category, setting_key)
);

CREATE INDEX idx_sim_settings_lookup ON simulation_settings(simulation_id, category);

-- simulation_taxonomies
CREATE TABLE public.simulation_taxonomies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    taxonomy_type text NOT NULL,
    value text NOT NULL,
    label jsonb NOT NULL DEFAULT '{}',
    description jsonb DEFAULT '{}',
    sort_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, taxonomy_type, value)
);

CREATE INDEX idx_taxonomies_lookup ON simulation_taxonomies(simulation_id, taxonomy_type);
CREATE INDEX idx_taxonomies_active ON simulation_taxonomies(simulation_id, taxonomy_type) WHERE is_active = true;

-- simulation_invitations
CREATE TABLE public.simulation_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    invited_email text,
    invite_token text NOT NULL UNIQUE,
    invited_role text NOT NULL DEFAULT 'viewer',
    invited_by_id uuid NOT NULL REFERENCES auth.users(id),
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_invitations_token ON simulation_invitations(invite_token);
CREATE INDEX idx_invitations_simulation ON simulation_invitations(simulation_id);
