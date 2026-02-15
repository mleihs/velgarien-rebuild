-- Migration 010: Utility functions
-- Requires: unaccent extension

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Slug generator
CREATE OR REPLACE FUNCTION public.generate_slug(input text)
RETURNS text AS $$
    SELECT lower(regexp_replace(
        regexp_replace(unaccent(trim(input)), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
$$ LANGUAGE sql IMMUTABLE;

-- Taxonomy validation lookup
CREATE OR REPLACE FUNCTION public.validate_taxonomy_value(sim_id uuid, tax_type text, tax_value text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM simulation_taxonomies
        WHERE simulation_id = sim_id
          AND taxonomy_type = tax_type
          AND value = tax_value
          AND is_active = true
    );
$$ LANGUAGE sql STABLE;
