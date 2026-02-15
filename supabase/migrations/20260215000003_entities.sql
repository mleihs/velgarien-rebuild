-- Migration 003: Entity tables
-- Tables: agents, buildings, events (WITHOUT campaign_id FK - added in 005)

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    system text,
    character text,
    background text,
    gender text,
    primary_profession text,
    portrait_image_url text,
    portrait_description text,
    data_source text,
    created_by_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(character, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(background, '')), 'C')
    ) STORED
);

CREATE INDEX idx_agents_simulation ON agents(simulation_id);
CREATE INDEX idx_agents_name ON agents(simulation_id, name);
CREATE INDEX idx_agents_system ON agents(simulation_id, system);
CREATE INDEX idx_agents_gender ON agents(simulation_id, gender);
CREATE INDEX idx_agents_profession ON agents(simulation_id, primary_profession);
CREATE INDEX idx_agents_created_by ON agents(created_by_id);
CREATE INDEX idx_agents_active ON agents(simulation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agents_search ON agents USING GIN(search_vector);

CREATE TABLE public.buildings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    building_type text NOT NULL,
    description text,
    style text,
    location jsonb,
    city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
    zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
    street_id uuid REFERENCES city_streets(id) ON DELETE SET NULL,
    address text,
    population_capacity integer DEFAULT 0,
    construction_year integer,
    building_condition text,
    geojson jsonb,
    image_url text,
    image_prompt_text text,
    special_type text,
    special_attributes jsonb DEFAULT '{}',
    data_source text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX idx_buildings_simulation ON buildings(simulation_id);
CREATE INDEX idx_buildings_city ON buildings(city_id);
CREATE INDEX idx_buildings_zone ON buildings(zone_id);
CREATE INDEX idx_buildings_type ON buildings(simulation_id, building_type);
CREATE INDEX idx_buildings_active ON buildings(simulation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_buildings_search ON buildings USING GIN(search_vector);

-- events: created WITHOUT campaign_id FK (campaigns table doesn't exist yet)
-- campaign_id FK will be added in migration 005
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 500),
    event_type text,
    description text,
    occurred_at timestamptz DEFAULT now(),
    data_source text DEFAULT 'local',
    metadata jsonb,
    source_platform text,
    propaganda_type text,
    target_demographic text,
    urgency_level text,
    original_trend_data jsonb,
    impact_level integer DEFAULT 5 CHECK (impact_level >= 1 AND impact_level <= 10),
    location text,
    tags text[] DEFAULT '{}',
    external_refs jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX idx_events_simulation ON events(simulation_id);
CREATE INDEX idx_events_type ON events(simulation_id, event_type);
CREATE INDEX idx_events_occurred ON events(occurred_at DESC);
CREATE INDEX idx_events_urgency ON events(simulation_id, urgency_level);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_active ON events(simulation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_search ON events USING GIN(search_vector);
