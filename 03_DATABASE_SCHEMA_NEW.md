# 03 - Database Schema New: Neues Schema mit Simulation-Kontext

**Version:** 1.0
**Datum:** 2026-02-15

---

## Design-Prinzipien

1. **Einheitliche PKs:** Alle Tabellen verwenden `uuid DEFAULT gen_random_uuid()` (PostgreSQL-nativ)
2. **Explizite Foreign Keys:** Alle Beziehungen mit FK-Constraints und ON DELETE CASCADE/SET NULL
3. **Simulation-Scope:** Alle Entitäten tragen `simulation_id` FK
4. **Einheitlich `text`:** Kein VARCHAR, nur `text` für Strings
5. **Einheitliche Timestamps:** `timestamptz DEFAULT now()`
6. **Englische Schema-Sprache:** Alle Tabellen-, Spalten-, Constraint-Namen auf Englisch
7. **Dynamische Taxonomien:** Keine PostgreSQL ENUMs, keine hartcodierten CHECK Constraints
8. **Vollständige RLS:** Jede Tabelle mit simulation-basierter Isolation
9. **Soft Deletes:** Wo sinnvoll mit `deleted_at` statt hartem DELETE

---

## Kern-Tabellen (Plattform-Level)

### `simulations`

```sql
CREATE TABLE public.simulations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    theme text NOT NULL DEFAULT 'custom',            -- dystopian, utopian, fantasy, scifi, custom
    status text NOT NULL DEFAULT 'draft',             -- draft, configuring, active, paused, archived
    content_locale text NOT NULL DEFAULT 'en',        -- Hauptsprache für Inhalte
    additional_locales text[] DEFAULT '{}',            -- Weitere Sprachen
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
```

### `simulation_members`

```sql
CREATE TABLE public.simulation_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'viewer',              -- owner, admin, editor, viewer
    invited_by uuid REFERENCES auth.users(id),
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, user_id)
);

CREATE INDEX idx_sim_members_simulation ON simulation_members(simulation_id);
CREATE INDEX idx_sim_members_user ON simulation_members(user_id);
```

### `simulation_settings`

```sql
CREATE TABLE public.simulation_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    category text NOT NULL,                           -- general, world, ai, integration, design, access
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, category, key)
);

CREATE INDEX idx_sim_settings_lookup ON simulation_settings(simulation_id, category);
```

### `simulation_taxonomies`

Ersetzt alle hartcodierten ENUMs und CHECK Constraints.

```sql
CREATE TABLE public.simulation_taxonomies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    taxonomy_type text NOT NULL,                      -- gender, profession, building_type, system, ...
    value text NOT NULL,                              -- Interner Wert (immer englisch)
    label jsonb NOT NULL DEFAULT '{}',                -- Labels pro Locale: {"de":"Wissenschaftler","en":"Scientist"}
    description jsonb DEFAULT '{}',                   -- Beschreibung pro Locale
    sort_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, taxonomy_type, value)
);

CREATE INDEX idx_taxonomies_lookup ON simulation_taxonomies(simulation_id, taxonomy_type);
CREATE INDEX idx_taxonomies_active ON simulation_taxonomies(simulation_id, taxonomy_type) WHERE is_active = true;
```

### `simulation_invitations`

```sql
CREATE TABLE public.simulation_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    invited_email text,
    invite_token text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'viewer',
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_invitations_token ON simulation_invitations(invite_token);
CREATE INDEX idx_invitations_simulation ON simulation_invitations(simulation_id);
```

---

## Entitäts-Tabellen (Simulation-Scoped)

### `agents`

```sql
CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL,
    system text,                                      -- Referenz auf taxonomy: type='system'
    character text,                                   -- Renamed: charakter → character
    background text,                                  -- Renamed: hintergrund → background
    gender text,                                      -- Referenz auf taxonomy: type='gender'
    primary_profession text,                          -- Referenz auf taxonomy: type='profession'
    portrait_image_url text,
    portrait_description text,
    data_source text,
    created_by_user uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE INDEX idx_agents_simulation ON agents(simulation_id);
CREATE INDEX idx_agents_name ON agents(simulation_id, name);
CREATE INDEX idx_agents_system ON agents(simulation_id, system);
CREATE INDEX idx_agents_gender ON agents(simulation_id, gender);
CREATE INDEX idx_agents_profession ON agents(simulation_id, primary_profession);
CREATE INDEX idx_agents_created_by ON agents(created_by_user);
```

### `agent_professions`

```sql
CREATE TABLE public.agent_professions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    profession text NOT NULL,                         -- Referenz auf taxonomy: type='profession'
    qualification_level integer DEFAULT 1 NOT NULL CHECK (qualification_level >= 1 AND qualification_level <= 5),
    specialization text,
    certified_at timestamptz DEFAULT now(),
    certified_by text,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_agent_prof_agent ON agent_professions(agent_id);
CREATE INDEX idx_agent_prof_simulation ON agent_professions(simulation_id);
```

### `buildings`

```sql
CREATE TABLE public.buildings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,                               -- Referenz auf taxonomy: type='building_type'
    description text,
    style text,
    location jsonb,
    city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
    zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
    street_id uuid REFERENCES city_streets(id) ON DELETE SET NULL,
    address text,
    population_capacity integer DEFAULT 0,
    construction_year integer,
    condition text,
    geojson jsonb,
    image_url text,
    image_prompt_text text,
    special_type text,                                -- Referenz auf taxonomy: type='building_special_type'
    special_attributes jsonb DEFAULT '{}',
    data_source text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE INDEX idx_buildings_simulation ON buildings(simulation_id);
CREATE INDEX idx_buildings_city ON buildings(city_id);
CREATE INDEX idx_buildings_zone ON buildings(zone_id);
CREATE INDEX idx_buildings_type ON buildings(simulation_id, type);
```

### `events`

```sql
CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text,
    description text,
    event_timestamp timestamptz DEFAULT now(),         -- Renamed: "timestamp" → event_timestamp
    data_source text DEFAULT 'local',
    metadata jsonb,
    source_platform text,
    propaganda_type text,                             -- Referenz auf taxonomy: type='propaganda_type'
    target_demographic text,                          -- Referenz auf taxonomy: type='target_demographic'
    urgency_level text,                               -- Referenz auf taxonomy: type='urgency_level'
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    original_trend_data jsonb,
    impact_level integer DEFAULT 5 CHECK (impact_level >= 1 AND impact_level <= 10),
    location text,
    tags jsonb DEFAULT '[]',
    external_refs jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz
);

CREATE INDEX idx_events_simulation ON events(simulation_id);
CREATE INDEX idx_events_type ON events(simulation_id, type);
CREATE INDEX idx_events_timestamp ON events(event_timestamp DESC);
CREATE INDEX idx_events_urgency ON events(simulation_id, urgency_level);
CREATE INDEX idx_events_campaign ON events(campaign_id);
```

### `event_reactions`

```sql
CREATE TABLE public.event_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    agent_name text NOT NULL,
    reaction_text text NOT NULL,
    reaction_timestamp timestamptz DEFAULT now(),
    emotion text,
    confidence_score numeric(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    data_source text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reactions_event ON event_reactions(event_id);
CREATE INDEX idx_reactions_agent ON event_reactions(agent_id);
CREATE INDEX idx_reactions_simulation ON event_reactions(simulation_id);
```

**Eliminiert:** `agents.event_reactions` JSONB-Spalte. Reaktionen nur in dieser Tabelle.

### `cities`

```sql
CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL,
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
```

### `zones`

```sql
CREATE TABLE public.zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    zone_type text DEFAULT 'residential',             -- Referenz auf taxonomy: type='zone_type'
    population_estimate integer DEFAULT 0,
    security_level text DEFAULT 'medium',             -- Referenz auf taxonomy: type='security_level'
    data_source text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_zones_simulation ON zones(simulation_id);
CREATE INDEX idx_zones_city ON zones(city_id);
```

### `city_streets`

```sql
CREATE TABLE public.city_streets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
    name text,
    type text,
    length_km numeric(10,2),
    geojson jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_streets_simulation ON city_streets(simulation_id);
CREATE INDEX idx_streets_city ON city_streets(city_id);
```

### `campaigns`

Renamed von `propaganda_campaigns` → generisch `campaigns`.

```sql
CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    title text NOT NULL,                              -- Renamed: dystopian_title → title
    description text,
    campaign_type text,                               -- Referenz auf taxonomy: type='campaign_type'
    target_demographic text,                          -- Referenz auf taxonomy
    urgency_level text,                               -- Referenz auf taxonomy
    source_trend_id uuid REFERENCES social_trends(id) ON DELETE SET NULL,
    integrated_as_event boolean DEFAULT false,
    event_id uuid REFERENCES events(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaigns_simulation ON campaigns(simulation_id);
CREATE INDEX idx_campaigns_type ON campaigns(simulation_id, campaign_type);
```

---

## Beziehungs-Tabellen

### `building_agent_relations`

```sql
CREATE TABLE public.building_agent_relations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    relation_type text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(building_id, agent_id, relation_type)
);
```

### `building_event_relations`

```sql
CREATE TABLE public.building_event_relations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    relation_type text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);
```

### `building_profession_requirements`

```sql
CREATE TABLE public.building_profession_requirements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    profession text NOT NULL,                         -- Referenz auf taxonomy
    min_qualification_level integer DEFAULT 1 CHECK (min_qualification_level >= 1 AND min_qualification_level <= 5),
    is_mandatory boolean DEFAULT true,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);
```

---

## Social & Media Tabellen

### `social_trends`

```sql
CREATE TABLE public.social_trends (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL,
    platform text NOT NULL,                           -- Kein CHECK, via Taxonomy validiert
    raw_data jsonb,
    volume integer DEFAULT 0,
    url text,
    fetched_at timestamptz DEFAULT now(),
    relevance_score numeric(5,2) CHECK (relevance_score >= 0 AND relevance_score <= 10),
    sentiment text,                                   -- Kein CHECK, via Taxonomy validiert
    processed boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_trends_simulation ON social_trends(simulation_id);
CREATE INDEX idx_trends_platform ON social_trends(simulation_id, platform);
CREATE INDEX idx_trends_fetched ON social_trends(fetched_at DESC);
```

### `social_media_posts`

Renamed von `facebook_posts` → generisch.

```sql
CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    platform text NOT NULL,                           -- facebook, twitter, etc.
    platform_id text NOT NULL,                        -- Original-ID der Plattform
    page_id text,
    author text,
    message text,
    created_time timestamptz NOT NULL,
    attachments jsonb DEFAULT '[]',
    reactions jsonb DEFAULT '{}',
    transformed_content text,
    transformation_type text,
    transformation_timestamp timestamptz,
    original_sentiment jsonb,
    transformed_sentiment jsonb,
    is_published boolean DEFAULT false,
    linked_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
    import_timestamp timestamptz DEFAULT now(),
    last_sync timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, platform, platform_id)
);

CREATE INDEX idx_social_posts_simulation ON social_media_posts(simulation_id);
CREATE INDEX idx_social_posts_platform ON social_media_posts(simulation_id, platform);
```

### `social_media_comments`

```sql
CREATE TABLE public.social_media_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES social_media_posts(id) ON DELETE CASCADE,
    platform_id text NOT NULL,
    parent_comment_id uuid REFERENCES social_media_comments(id) ON DELETE CASCADE,
    author text NOT NULL,
    message text NOT NULL,
    created_time timestamptz NOT NULL,
    transformed_content text,
    sentiment jsonb,
    import_timestamp timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);
```

### `social_media_agent_reactions`

```sql
CREATE TABLE public.social_media_agent_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    post_id uuid REFERENCES social_media_posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES social_media_comments(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    reaction_type text NOT NULL,
    reaction_content text NOT NULL,
    reaction_intensity integer CHECK (reaction_intensity >= 1 AND reaction_intensity <= 10),
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT check_reaction_target
        CHECK ((post_id IS NOT NULL AND comment_id IS NULL)
            OR (post_id IS NULL AND comment_id IS NOT NULL))
);
```

---

## Chat-System

### `chat_conversations`

Neue Tabelle für Konversationen (bisher war `agent_chats` flach).

```sql
CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title text,
    status text DEFAULT 'active',                     -- active, archived
    message_count integer DEFAULT 0,
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, user_id, agent_id)
);

CREATE INDEX idx_conversations_simulation ON chat_conversations(simulation_id);
CREATE INDEX idx_conversations_user ON chat_conversations(user_id);
```

### `chat_messages`

```sql
CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role text NOT NULL,                               -- user, assistant
    content text NOT NULL CHECK (length(content) <= 5000),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at);
```

---

## AI & Prompts

### `prompt_templates`

```sql
CREATE TABLE public.prompt_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid REFERENCES simulations(id) ON DELETE CASCADE,   -- NULL = Plattform-Default
    template_type text NOT NULL,                      -- agent_generation, event_generation, etc.
    category text NOT NULL,                           -- text_generation, image_generation, etc.
    locale text NOT NULL DEFAULT 'en',                -- Sprache des Templates
    template_name text NOT NULL,
    prompt_content text NOT NULL,
    system_prompt text,
    variables jsonb DEFAULT '[]',
    description text,
    default_model text,
    temperature numeric(3,2) DEFAULT 0.8,
    max_tokens integer DEFAULT 500,
    negative_prompt text,                             -- Für Bildgenerierung
    is_system_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    parent_template_id uuid REFERENCES prompt_templates(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, template_type, locale) WHERE simulation_id IS NOT NULL
);

CREATE INDEX idx_templates_simulation ON prompt_templates(simulation_id, template_type, locale);
CREATE INDEX idx_templates_active ON prompt_templates(is_active) WHERE is_active = true;
```

---

## Logging & Audit

### `audit_log`

Konsolidiert `social_trends_audit`, `api_usage_logs`, `prompt_usage_logs`.

```sql
CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,                             -- create, update, delete, generate, api_call
    entity_type text,                                 -- agent, building, event, prompt, etc.
    entity_id uuid,
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_simulation ON audit_log(simulation_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

---

## Eliminierte Tabellen

| Alte Tabelle | Grund | Ersatz |
|-------------|-------|--------|
| `locations` | Redundant mit cities/zones/streets | Entfernt |
| `streets` VIEW | Simpler Alias | Entfernt |
| `agent_propaganda_responses` | Velgarien-spezifisch | In Simulation-Settings + generische `agent_interactions` |
| `zone_propaganda_influence` | Velgarien-spezifisch + Typ-Mismatch | In generische `zone_attributes` |

---

## RLS-Policies (alle Tabellen)

### Standard-Policy für simulation-scoped Tabellen

```sql
-- Funktion: Prüft ob User Mitglied der Simulation ist
CREATE OR REPLACE FUNCTION public.user_has_simulation_access(sim_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM simulation_members
    WHERE simulation_id = sim_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Funktion: Prüft ob User eine bestimmte Rolle hat
CREATE OR REPLACE FUNCTION public.user_has_simulation_role(sim_id uuid, min_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM simulation_members
    WHERE simulation_id = sim_id
      AND user_id = auth.uid()
      AND role IN (
        CASE min_role
          WHEN 'viewer' THEN ARRAY['owner','admin','editor','viewer']
          WHEN 'editor' THEN ARRAY['owner','admin','editor']
          WHEN 'admin'  THEN ARRAY['owner','admin']
          WHEN 'owner'  THEN ARRAY['owner']
        END
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Template für jede Tabelle:
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select ON agents FOR SELECT
  USING (user_has_simulation_access(simulation_id));

CREATE POLICY agents_insert ON agents FOR INSERT
  WITH CHECK (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agents_update ON agents FOR UPDATE
  USING (user_has_simulation_role(simulation_id, 'editor'));

CREATE POLICY agents_delete ON agents FOR DELETE
  USING (user_has_simulation_role(simulation_id, 'admin'));
```

---

## Migration-Mapping: Alt → Neu

### Spalten-Renames

| Alt | Neu | Tabelle |
|-----|-----|---------|
| `charakter` | `character` | agents |
| `hintergrund` | `background` | agents |
| `portrait_description_encoded` | `portrait_description` | agents |
| `"timestamp"` | `event_timestamp` | events |
| `dystopian_title` | `title` | campaigns |
| `facebook_id` | `platform_id` | social_media_posts |
| `velgarien_event_id` | `linked_event_id` | social_media_posts |

### Tabellen-Renames

| Alt | Neu |
|-----|-----|
| `propaganda_campaigns` | `campaigns` |
| `facebook_posts` | `social_media_posts` |
| `facebook_comments` | `social_media_comments` |
| `facebook_agent_reactions` | `social_media_agent_reactions` |
| `agent_chats` | `chat_conversations` + `chat_messages` |

### Typ-Korrekturen

| Alt | Neu | Änderung |
|-----|-----|---------|
| `agents.id` (text) | `agents.id` (uuid) | text → uuid |
| `events.id` (text) | `events.id` (uuid) | text → uuid |
| `agent_chats.agent_id` (uuid) | `chat_conversations.agent_id` (uuid) | Typ-Mismatch behoben |
| `zone_propaganda_influence.zone_id` (varchar) | eliminiert | Typ-Mismatch behoben |
| Alle `varchar(N)` | `text` | Einheitlicher String-Typ |

### Enum → Taxonomy Migration

| Alt (Enum/CHECK) | Neu (Taxonomy) | Werte |
|-------------------|---------------|-------|
| `gender_type` ENUM | `taxonomy(type='gender')` | männlich→male, weiblich→female, divers→diverse, alien→alien |
| `profession_type` ENUM | `taxonomy(type='profession')` | wissenschaftler→scientist, etc. |
| `building_special_type` ENUM | `taxonomy(type='building_special_type')` | akademie→academy, etc. |
| `urgency_level` CHECK | `taxonomy(type='urgency_level')` | NIEDRIG→low, MITTEL→medium, etc. |
| `target_demographic` CHECK | `taxonomy(type='target_demographic')` | Bildungssektor→education_sector, etc. |
| `propaganda_type` CHECK | `taxonomy(type='campaign_type')` | surveillance, control, etc. |
| `zone_type` CHECK | `taxonomy(type='zone_type')` | residential, commercial, etc. |
| `security_level` CHECK | `taxonomy(type='security_level')` | low, medium, high, restricted |
