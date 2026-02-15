-- Migration 006: Chat and Prompt tables
-- Tables: chat_conversations, chat_messages, prompt_templates, audit_log

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title text,
    status text DEFAULT 'active',
    message_count integer DEFAULT 0,
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(simulation_id, user_id, agent_id)
);

CREATE INDEX idx_conversations_simulation ON chat_conversations(simulation_id);
CREATE INDEX idx_conversations_user ON chat_conversations(user_id);

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_role text NOT NULL,
    content text NOT NULL CHECK (length(content) <= 5000),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at);

CREATE TABLE public.prompt_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid REFERENCES simulations(id) ON DELETE CASCADE,
    template_type text NOT NULL,
    prompt_category text NOT NULL,
    locale text NOT NULL DEFAULT 'en',
    template_name text NOT NULL,
    prompt_content text NOT NULL,
    system_prompt text,
    variables jsonb DEFAULT '[]',
    description text,
    default_model text,
    temperature numeric(3,2) DEFAULT 0.8,
    max_tokens integer DEFAULT 500,
    negative_prompt text,
    is_system_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    parent_template_id uuid REFERENCES prompt_templates(id),
    created_by_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Partial unique indexes for prompt_templates
CREATE UNIQUE INDEX idx_prompt_templates_sim_unique
    ON prompt_templates(simulation_id, template_type, locale)
    WHERE simulation_id IS NOT NULL;

CREATE UNIQUE INDEX idx_prompt_templates_platform_unique
    ON prompt_templates(template_type, locale)
    WHERE simulation_id IS NULL;

CREATE INDEX idx_templates_simulation ON prompt_templates(simulation_id, template_type, locale);
CREATE INDEX idx_templates_active ON prompt_templates(is_active) WHERE is_active = true;

-- audit_log
CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_simulation ON audit_log(simulation_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
