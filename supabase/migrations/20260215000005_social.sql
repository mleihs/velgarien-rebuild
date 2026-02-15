-- Migration 005: Social & Campaign tables
-- Tables: social_trends (FIRST), campaigns, social_media_posts, social_media_comments,
--         social_media_agent_reactions, campaign_events, campaign_metrics
-- Also: ALTER events to add campaign_id FK

-- social_trends MUST come before campaigns (campaigns references social_trends)
CREATE TABLE public.social_trends (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    platform text NOT NULL,
    raw_data jsonb,
    volume integer DEFAULT 0,
    url text,
    fetched_at timestamptz DEFAULT now(),
    relevance_score numeric(4,2) CHECK (relevance_score >= 0 AND relevance_score <= 10),
    sentiment text,
    is_processed boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_trends_simulation ON social_trends(simulation_id);
CREATE INDEX idx_trends_platform ON social_trends(simulation_id, platform);
CREATE INDEX idx_trends_fetched ON social_trends(fetched_at DESC);

-- campaigns
CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 500),
    description text,
    campaign_type text,
    target_demographic text,
    urgency_level text,
    source_trend_id uuid REFERENCES social_trends(id) ON DELETE SET NULL,
    is_integrated_as_event boolean DEFAULT false,
    event_id uuid REFERENCES events(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaigns_simulation ON campaigns(simulation_id);
CREATE INDEX idx_campaigns_type ON campaigns(simulation_id, campaign_type);
CREATE INDEX idx_campaigns_trend ON campaigns(source_trend_id);
CREATE INDEX idx_campaigns_event ON campaigns(event_id);

-- NOW add campaign_id FK to events (forward reference resolved)
ALTER TABLE events ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX idx_events_campaign ON events(campaign_id);

-- social_media_posts
CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    platform text NOT NULL,
    platform_id text NOT NULL,
    page_id text,
    author text,
    message text,
    source_created_at timestamptz NOT NULL,
    attachments jsonb DEFAULT '[]',
    reactions jsonb DEFAULT '{}',
    transformed_content text,
    transformation_type text,
    transformed_at timestamptz,
    original_sentiment jsonb,
    transformed_sentiment jsonb,
    is_published boolean DEFAULT false,
    linked_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
    imported_at timestamptz DEFAULT now(),
    last_synced_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, platform, platform_id)
);

CREATE INDEX idx_social_posts_simulation ON social_media_posts(simulation_id);
CREATE INDEX idx_social_posts_platform ON social_media_posts(simulation_id, platform);
CREATE INDEX idx_social_posts_event ON social_media_posts(linked_event_id);

-- social_media_comments
CREATE TABLE public.social_media_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES social_media_posts(id) ON DELETE CASCADE,
    platform_id text NOT NULL,
    parent_comment_id uuid REFERENCES social_media_comments(id) ON DELETE CASCADE,
    author text NOT NULL,
    message text NOT NULL,
    source_created_at timestamptz NOT NULL,
    transformed_content text,
    sentiment jsonb,
    imported_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_social_comments_post ON social_media_comments(post_id);
CREATE INDEX idx_social_comments_parent ON social_media_comments(parent_comment_id);
CREATE INDEX idx_social_comments_simulation ON social_media_comments(simulation_id);

-- social_media_agent_reactions
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

-- campaign_events
CREATE TABLE public.campaign_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    integration_type text NOT NULL,
    integration_status text NOT NULL DEFAULT 'pending',
    agent_reactions_generated boolean DEFAULT false,
    reactions_count integer DEFAULT 0,
    event_metadata jsonb DEFAULT '{}',
    performance_metrics jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(campaign_id, event_id)
);

CREATE INDEX idx_campaign_events_campaign ON campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_event ON campaign_events(event_id);

-- campaign_metrics
CREATE TABLE public.campaign_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_name text NOT NULL,
    metric_value numeric NOT NULL,
    metric_metadata jsonb DEFAULT '{}',
    measured_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
