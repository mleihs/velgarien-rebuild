-- Migration 002: Geography tables
-- Tables: cities, zones, city_streets

CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    layout_type text,
    description text,
    population integer DEFAULT 0,
    map_center_lat double precision,
    map_center_lng double precision,
    map_default_zoom integer DEFAULT 12,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_cities_simulation ON cities(simulation_id);

CREATE TABLE public.zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    description text,
    zone_type text DEFAULT 'residential',
    population_estimate integer DEFAULT 0,
    security_level text DEFAULT 'medium',
    data_source text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_zones_simulation ON zones(simulation_id);
CREATE INDEX idx_zones_city ON zones(city_id);

CREATE TABLE public.city_streets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
    name text,
    street_type text,
    length_km numeric(10,2),
    geojson jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_streets_simulation ON city_streets(simulation_id);
CREATE INDEX idx_streets_city ON city_streets(city_id);
