# 04 - Domain Models: Entitäten mit Simulation-Scope

**Version:** 1.0
**Datum:** 2026-02-15

---

## Übersicht

Alle Entitäten tragen eine `simulation_id` und sind damit einer Simulation zugeordnet. Die Simulation ist die Top-Level-Entity.

```
Simulation (Top-Level)
├── Agents
│   ├── AgentProfessions
│   └── AgentInteractions (mit Events, Buildings, Trends)
├── Buildings
│   ├── BuildingAgentRelations
│   ├── BuildingEventRelations
│   └── BuildingProfessionRequirements
├── Events
│   └── EventReactions
├── Cities
│   ├── Zones
│   └── CityStreets
├── Campaigns
│   ├── CampaignEvents
│   └── CampaignMetrics
├── SocialTrends
│   ├── TrendKeywords
│   └── TrendKeywordAssociations
├── SocialMedia
│   ├── SocialMediaPosts
│   ├── SocialMediaComments
│   └── SocialMediaAgentReactions
├── ChatConversations
│   └── ChatMessages
├── PromptTemplates
└── SimulationTaxonomies
```

---

## 1. Simulation

**Top-Level Entity** - Container für alle anderen Entitäten.

```typescript
interface Simulation {
  id: UUID;
  name: string;                     // "Velgarien"
  slug: string;                     // "velgarien"
  description: string;
  theme: SimulationTheme;           // 'dystopian' | 'utopian' | 'fantasy' | 'scifi' | 'historical' | 'custom'
  status: SimulationStatus;         // 'draft' | 'configuring' | 'active' | 'paused' | 'archived'
  content_locale: string;           // "de"
  additional_locales: string[];     // ["en"]
  owner_id: UUID;
  icon_url?: string;
  banner_url?: string;
  created_at: string;               // ISO 8601
  updated_at: string;
  archived_at?: string;
  deleted_at?: string;

  // Relations (loaded on demand)
  members?: SimulationMember[];
  settings?: SimulationSetting[];
  taxonomies?: SimulationTaxonomy[];
}
```

**Zugehörige Entitäten:**

```typescript
interface SimulationMember {
  id: UUID;
  simulation_id: UUID;
  user_id: UUID;
  role: SimulationRole;             // 'owner' | 'admin' | 'editor' | 'viewer'
  invited_by?: UUID;
  joined_at: string;

  // Populated
  user?: UserProfile;
}

interface SimulationSetting {
  id: UUID;
  simulation_id: UUID;
  category: SettingCategory;        // 'general' | 'world' | 'ai' | 'integration' | 'design' | 'access'
  key: string;
  value: any;                       // JSON value
  updated_by?: UUID;
  created_at: string;
  updated_at: string;
}

interface SimulationTaxonomy {
  id: UUID;
  simulation_id: UUID;
  taxonomy_type: TaxonomyType;      // 'gender' | 'profession' | 'system' | 'building_type' | ...
  value: string;                    // Internal value (always English)
  label: Record<string, string>;    // {"de": "Wissenschaftler", "en": "Scientist"}
  description?: Record<string, string>;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  metadata?: Record<string, any>;
}
```

---

## 2. Agent

**Bewohner/Akteure der Simulation.**

```typescript
interface Agent {
  id: UUID;
  simulation_id: UUID;
  name: string;
  system?: string;                  // Referenz auf Taxonomy 'system'
  character?: string;               // Charakter-Beschreibung
  background?: string;              // Hintergrund-Geschichte
  gender?: string;                  // Referenz auf Taxonomy 'gender'
  primary_profession?: string;      // Referenz auf Taxonomy 'profession'
  portrait_image_url?: string;
  portrait_description?: string;
  data_source?: string;
  created_by_user?: UUID;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations (loaded on demand)
  professions?: AgentProfession[];
  reactions?: EventReaction[];
  building_relations?: BuildingAgentRelation[];
}
```

**Mapping Alt → Neu:**
- `charakter` → `character`
- `hintergrund` → `background`
- `portrait_description_encoded` → `portrait_description`
- `event_reactions` JSONB → eliminiert (nur noch `event_reactions` Tabelle)
- `id` TEXT → `id` UUID

---

## 3. AgentProfession

**Berufe/Qualifikationen eines Agenten.**

```typescript
interface AgentProfession {
  id: UUID;
  simulation_id: UUID;
  agent_id: UUID;
  profession: string;               // Referenz auf Taxonomy 'profession'
  qualification_level: number;      // 1-5
  specialization?: string;
  certified_at?: string;
  certified_by?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;

  // Populated
  agent?: Agent;
  profession_label?: string;        // Lokalisiertes Label
}
```

---

## 4. Building

**Orte und Strukturen in der Simulation.**

```typescript
interface Building {
  id: UUID;
  simulation_id: UUID;
  name: string;
  type: string;                     // Referenz auf Taxonomy 'building_type'
  description?: string;
  style?: string;
  location?: GeoLocation;           // JSON: {lat, lng, address}
  city_id?: UUID;
  zone_id?: UUID;
  street_id?: UUID;
  address?: string;
  population_capacity: number;
  construction_year?: number;
  condition?: string;
  geojson?: GeoJSON;
  image_url?: string;
  image_prompt_text?: string;
  special_type?: string;            // Referenz auf Taxonomy 'building_special_type'
  special_attributes?: Record<string, any>;
  data_source?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  agents?: BuildingAgentRelation[];
  events?: BuildingEventRelation[];
  profession_requirements?: BuildingProfessionRequirement[];
  city?: City;
  zone?: Zone;
  street?: CityStreet;
}
```

---

## 5. Event

**Geschehnisse und Nachrichten in der Simulation.**

```typescript
interface Event {
  id: UUID;
  simulation_id: UUID;
  title: string;
  type?: string;
  description?: string;
  event_timestamp: string;          // Renamed: timestamp → event_timestamp
  data_source: string;              // 'local' | 'generated' | 'imported' | 'transformed'
  metadata?: Record<string, any>;
  source_platform?: string;
  propaganda_type?: string;         // Referenz auf Taxonomy 'campaign_type'
  target_demographic?: string;      // Referenz auf Taxonomy 'target_demographic'
  urgency_level?: string;           // Referenz auf Taxonomy 'urgency_level'
  campaign_id?: UUID;
  original_trend_data?: Record<string, any>;
  impact_level: number;             // 1-10
  location?: string;
  tags: string[];
  external_refs?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  reactions?: EventReaction[];
  campaign?: Campaign;
}
```

---

## 6. EventReaction

**Reaktionen von Agenten auf Events.**

```typescript
interface EventReaction {
  id: UUID;
  simulation_id: UUID;
  event_id: UUID;
  agent_id: UUID;
  agent_name: string;
  reaction_text: string;
  reaction_timestamp: string;
  emotion?: string;
  confidence_score?: number;        // 0.0-1.0
  data_source?: string;
  created_at: string;
  updated_at: string;

  // Populated
  agent?: Agent;
  event?: Event;
}
```

---

## 7. City

**Übergeordnete geographische Einheit.**

```typescript
interface City {
  id: UUID;
  simulation_id: UUID;
  name: string;
  layout_type?: string;
  description?: string;
  population: number;
  map_center_lat?: number;
  map_center_lng?: number;
  map_default_zoom: number;
  created_at: string;
  updated_at: string;

  // Relations
  zones?: Zone[];
  streets?: CityStreet[];
  buildings?: Building[];
}
```

---

## 8. Zone

**Geographische Unterteilung einer Stadt.**

```typescript
interface Zone {
  id: UUID;
  simulation_id: UUID;
  city_id: UUID;
  name: string;
  description?: string;
  zone_type: string;                // Referenz auf Taxonomy 'zone_type'
  population_estimate: number;
  security_level: string;           // Referenz auf Taxonomy 'security_level'
  data_source?: string;
  created_at: string;
  updated_at: string;

  // Relations
  city?: City;
  streets?: CityStreet[];
  buildings?: Building[];
}
```

---

## 9. CityStreet

```typescript
interface CityStreet {
  id: UUID;
  simulation_id: UUID;
  city_id: UUID;
  zone_id?: UUID;
  name?: string;
  type?: string;
  length_km?: number;
  geojson?: GeoJSON;
  created_at: string;
  updated_at: string;
}
```

---

## 10. Campaign

**Organisierte Aktionen/Initiativen. Generischer Ersatz für `propaganda_campaigns`.**

```typescript
interface Campaign {
  id: UUID;
  simulation_id: UUID;
  title: string;                    // Renamed: dystopian_title → title
  description?: string;
  campaign_type?: string;           // Referenz auf Taxonomy 'campaign_type'
  target_demographic?: string;      // Referenz auf Taxonomy
  urgency_level?: string;           // Referenz auf Taxonomy
  source_trend_id?: UUID;
  integrated_as_event: boolean;
  event_id?: UUID;
  created_at: string;
  updated_at: string;

  // Relations
  source_trend?: SocialTrend;
  event?: Event;
  campaign_events?: CampaignEvent[];
  metrics?: CampaignMetric[];
}
```

---

## 11. SocialTrend

**Externe Nachrichten und Trends.**

```typescript
interface SocialTrend {
  id: UUID;
  simulation_id: UUID;
  name: string;
  platform: string;                 // Dynamisch, nicht CHECK-constrained
  raw_data?: Record<string, any>;
  volume: number;
  url?: string;
  fetched_at: string;
  relevance_score?: number;         // 0-10
  sentiment?: string;               // Dynamisch
  processed: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 12. Social Media (Posts, Comments, Reactions)

**Generische Social-Media-Integration (nicht mehr nur Facebook).**

```typescript
interface SocialMediaPost {
  id: UUID;
  simulation_id: UUID;
  platform: string;                 // 'facebook' | 'twitter' | 'instagram' | ...
  platform_id: string;              // Original-ID der Plattform
  page_id?: string;
  author?: string;
  message?: string;
  created_time: string;
  attachments: any[];
  reactions: Record<string, any>;
  transformed_content?: string;
  transformation_type?: string;
  transformation_timestamp?: string;
  original_sentiment?: Record<string, any>;
  transformed_sentiment?: Record<string, any>;
  is_published: boolean;
  linked_event_id?: UUID;
  import_timestamp: string;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

interface SocialMediaComment {
  id: UUID;
  simulation_id: UUID;
  post_id: UUID;
  platform_id: string;
  parent_comment_id?: UUID;
  author: string;
  message: string;
  created_time: string;
  transformed_content?: string;
  sentiment?: Record<string, any>;
  import_timestamp: string;
  created_at: string;
  updated_at: string;
}

interface SocialMediaAgentReaction {
  id: UUID;
  simulation_id: UUID;
  post_id?: UUID;                   // XOR comment_id
  comment_id?: UUID;                // XOR post_id
  agent_id: UUID;
  reaction_type: string;
  reaction_content: string;
  reaction_intensity?: number;      // 1-10
  created_at: string;
}
```

---

## 13. Chat System

**Konversationen zwischen Benutzern und Simulations-Agenten.**

```typescript
interface ChatConversation {
  id: UUID;
  simulation_id: UUID;
  user_id: UUID;
  agent_id: UUID;
  title?: string;
  status: 'active' | 'archived';
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  messages?: ChatMessage[];
  agent?: Agent;
}

interface ChatMessage {
  id: UUID;
  conversation_id: UUID;
  role: 'user' | 'assistant';
  content: string;                  // Max 5000 chars
  metadata?: Record<string, any>;
  created_at: string;
}
```

---

## 14. Prompt Templates

**AI-Prompt-Konfiguration pro Simulation und Sprache.**

```typescript
interface PromptTemplate {
  id: UUID;
  simulation_id?: UUID;             // NULL = Plattform-Default
  template_type: PromptTemplateType;
  category: PromptCategory;
  locale: string;                   // 'de' | 'en' | ...
  template_name: string;
  prompt_content: string;
  system_prompt?: string;
  variables: PromptVariable[];
  description?: string;
  default_model?: string;
  temperature: number;              // 0.0-2.0
  max_tokens: number;
  negative_prompt?: string;         // Für Bildgenerierung
  is_system_default: boolean;
  is_active: boolean;
  version: number;
  parent_template_id?: UUID;
  created_by?: UUID;
  created_at: string;
  updated_at: string;
}

type PromptTemplateType =
  | 'agent_generation'
  | 'agent_description'
  | 'agent_reactions'
  | 'agent_portrait_description'
  | 'user_agent_description'
  | 'user_agent_portrait_description'
  | 'building_generation'
  | 'building_description'
  | 'building_image_prompt'
  | 'building_image_generation'
  | 'social_trends_title'
  | 'social_trends_description'
  | 'event_reaction'
  | 'news_integration'
  | 'portrait_generation'
  | 'chat_system_prompt'
  | 'chat_with_memory'
  | 'news_transformation'
  | 'social_media_transformation'
  | 'social_media_sentiment'
  | 'social_media_agent_reaction';

type PromptCategory =
  | 'text_generation'
  | 'image_generation'
  | 'description_generation'
  | 'reaction_generation'
  | 'transformation'
  | 'analysis';
```

---

## 15. Beziehungs-Tabellen

```typescript
interface BuildingAgentRelation {
  id: UUID;
  simulation_id: UUID;
  building_id: UUID;
  agent_id: UUID;
  relation_type: string;            // 'assigned' | 'owner' | 'visitor' | 'worker'
  created_at: string;

  // Populated
  building?: Building;
  agent?: Agent;
}

interface BuildingEventRelation {
  id: UUID;
  simulation_id: UUID;
  building_id: UUID;
  event_id: UUID;
  relation_type: string;
  created_at: string;
}

interface BuildingProfessionRequirement {
  id: UUID;
  simulation_id: UUID;
  building_id: UUID;
  profession: string;               // Referenz auf Taxonomy
  min_qualification_level: number;  // 1-5
  is_mandatory: boolean;
  description?: string;
  created_at: string;
}

interface CampaignEvent {
  id: UUID;
  simulation_id: UUID;
  campaign_id: UUID;
  event_id: UUID;
  integration_type: string;
  integration_status: string;
  agent_reactions_generated: boolean;
  reactions_count: number;
  event_metadata?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CampaignMetric {
  id: UUID;
  simulation_id: UUID;
  campaign_id: UUID;
  metric_name: string;
  metric_value: number;
  metric_metadata?: Record<string, any>;
  measured_at: string;
}
```

---

## Taxonomy-Typen

Die folgenden Taxonomy-Typen ersetzen alle hartcodierten ENUMs und CHECK Constraints:

| Taxonomy-Typ | Ersetzt | Velgarien-Seed-Werte |
|-------------|---------|---------------------|
| `gender` | `gender_type` ENUM | male, female, diverse, alien |
| `profession` | `profession_type` ENUM | scientist, leader, military, engineer, artist, medic, security, admin, craftsman, specialist |
| `system` | Hardcoded in validation | politics, military, civil, economy, underworld, clergy, science |
| `building_type` | Hardcoded in validation | residential, office, factory, clinic, education, culture, government, trade, infrastructure, other |
| `building_style` | Hardcoded in validation | brutalist, modern, classic, futuristic, industrial |
| `building_special_type` | `building_special_type` ENUM | academy, military_academy, medical_center, research_lab, propaganda_center |
| `campaign_type` | `propaganda_type` CHECK | surveillance, control, distraction, loyalty, productivity, conformity |
| `target_demographic` | `target_demographic` CHECK | education_sector, working_population, health_conscious, general_population |
| `urgency_level` | `urgency_level` CHECK | low, medium, high, critical |
| `zone_type` | `zone_type` CHECK | residential, commercial, industrial, military, religious, government, slums, ruins |
| `security_level` | `security_level` CHECK | low, medium, high, restricted |
| `event_type` | Hardcoded | political, economic, social, environmental, technological, cultural, military, disaster, other |
| `sentiment` | `sentiment` CHECK | positive, negative, neutral, mixed |
| `interaction_type` | CHECK | supportive, resistant, fearful, neutral |
| `campaign_tone` | `tone` CHECK | authoritarian, paternalistic, urgent, reassuring, threatening |
| `complexity_level` | CHECK | simple, medium, complex, sophisticated |
