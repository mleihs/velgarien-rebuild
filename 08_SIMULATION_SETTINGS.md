# 08 - Simulation Settings: Komplett-Spezifikation

**Version:** 1.0
**Datum:** 2026-02-15

---

## Übersicht

Das Settings-System ist das **Kernstück** der Multi-Simulations-Plattform. Es ermöglicht die vollständige Konfiguration jeder Simulation über eine dedizierte UI.

### Settings-Kategorien

| Kategorie | Tab | Beschreibung |
|-----------|-----|-------------|
| **General** | Allgemein | Name, Beschreibung, Thema, Sprache |
| **World** | Welt | Taxonomien/Enums anpassen |
| **AI** | KI | Modelle, Prompts, Parameter |
| **Integration** | Integrationen | Externe APIs, Social Media |
| **Design** | Design | Theme, Farben, Typography |
| **Access** | Zugang | Sichtbarkeit, Rollen, Einladungen |

---

## 1. General Settings

### Felder

| Setting Key | Typ | Default | Beschreibung |
|------------|-----|---------|-------------|
| `general.name` | string | (required) | Simulations-Name (z.B. "Velgarien") |
| `general.slug` | string | (auto) | URL-freundlicher Name (read-only nach Erstellung) |
| `general.description` | text | "" | Beschreibung der Simulation |
| `general.theme` | enum | "custom" | dystopian, utopian, fantasy, scifi, historical, custom |
| `general.content_locale` | string | "en" | Hauptsprache für Inhalte |
| `general.additional_locales` | string[] | [] | Weitere Inhalts-Sprachen |
| `general.timezone` | string | "UTC" | Zeitzone für Timestamps |
| `general.icon_url` | string | null | Simulations-Icon |
| `general.banner_url` | string | null | Simulations-Banner |

### UI-Spezifikation

```
┌─────────────────────────────────────────┐
│ Allgemeine Einstellungen                │
├─────────────────────────────────────────┤
│                                         │
│ Name *                                  │
│ [Velgarien                          ]   │
│                                         │
│ URL-Slug (nicht änderbar)               │
│ [velgarien                          ]   │
│                                         │
│ Thema                                   │
│ [Dystopisch                        ▾]   │
│   ○ Dystopisch                          │
│   ○ Utopisch                            │
│   ○ Fantasy                             │
│   ○ Sci-Fi                              │
│   ○ Historisch                          │
│   ○ Benutzerdefiniert                   │
│                                         │
│ Inhalts-Sprache *                       │
│ [Deutsch                           ▾]   │
│                                         │
│ Weitere Sprachen                        │
│ [☑ Englisch] [☐ Französisch] [☐ ...]   │
│                                         │
│ Zeitzone                                │
│ [Europe/Berlin                     ▾]   │
│                                         │
│ Beschreibung                            │
│ ┌─────────────────────────────────────┐ │
│ │ Eine dystopische Weltensimulation   │ │
│ │ in der...                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Icon / Banner                           │
│ [Hochladen] [Entfernen]                │
│                                         │
│           [Änderungen speichern]        │
└─────────────────────────────────────────┘
```

---

## 2. World Settings (Taxonomien)

### Verwaltet alle dynamischen Enums/Kategorien

| Taxonomy Type | Velgarien-Default | Beschreibung |
|--------------|-------------------|-------------|
| `system` | Politik, Militär, Zivil, Wirtschaft, Unterwelt, Klerus, Wissenschaft | Agenten-Systeme |
| `profession` | Wissenschaftler, Führungsperson, Militär, Ingenieur, Künstler, Mediziner, Sicherheitspersonal, Verwaltung, Handwerker, Spezialist | Professionen |
| `gender` | Männlich, Weiblich, Divers, Alien | Gender-Optionen |
| `building_type` | Wohnkomplex, Bürogebäude, Fabrik, Klinik, Bildungseinrichtung, Kulturzentrum, Regierungsgebäude, Handelsgebäude, Infrastruktur | Gebäudetypen |
| `building_style` | Brutalistisch, Modern, Klassisch, Futuristisch, Industrial | Gebäude-Stile |
| `building_special_type` | Akademie, Militärakademie, Medizinisches Zentrum, Forschungslabor, Propagandazentrum | Spezialgebäude |
| `event_type` | NEWS, PROPAGANDA, SOCIAL, POLITICAL, ECONOMIC, CULTURAL | Event-Typen |
| `campaign_type` | Surveillance, Control, Distraction, Loyalty, Productivity, Conformity | Kampagnen-Typen |
| `target_demographic` | Bildungssektor, Arbeitende Bevölkerung, Gesundheitsbewusste, Allgemein | Zielgruppen |
| `urgency_level` | Niedrig, Mittel, Hoch, Kritisch | Dringlichkeitsstufen |
| `zone_type` | Residential, Commercial, Industrial, Military, Religious, Government, Slums, Ruins | Zonen-Typen |
| `security_level` | Low, Medium, High, Restricted | Sicherheitsstufen |
| `sentiment` | Positive, Negative, Neutral, Mixed | Sentiment-Typen |

### UI-Spezifikation: Taxonomy Editor

```
┌─────────────────────────────────────────────────┐
│ Welt-Einstellungen                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Kategorie: [Professionen              ▾]        │
│                                                 │
│ ┌──────┬───────────────┬──────────┬──────────┐  │
│ │ Reihe│ Interner Wert │ Label    │ Aktionen │  │
│ ├──────┼───────────────┼──────────┼──────────┤  │
│ │  ↕ 1 │ scientist     │ DE: Wissenschaftler  │  │
│ │      │               │ EN: Scientist │ ✏️ 🗑️│  │
│ ├──────┼───────────────┼──────────┼──────────┤  │
│ │  ↕ 2 │ leader        │ DE: Führungsperson   │  │
│ │      │               │ EN: Leader    │ ✏️ 🗑️│  │
│ ├──────┼───────────────┼──────────┼──────────┤  │
│ │  ↕ 3 │ military      │ DE: Militär          │  │
│ │      │               │ EN: Military  │ ✏️ 🗑️│  │
│ ├──────┼───────────────┼──────────┼──────────┤  │
│ │  ... │               │          │          │  │
│ └──────┴───────────────┴──────────┴──────────┘  │
│                                                 │
│ Drag & Drop zum Sortieren                       │
│                                                 │
│ [+ Neuen Wert hinzufügen]                       │
│                                                 │
│ ── Hinzufügen ──                                │
│ Interner Wert: [alchemist          ]            │
│ Label (DE):    [Alchemist          ]            │
│ Label (EN):    [Alchemist          ]            │
│ [Hinzufügen] [Abbrechen]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. AI Settings

### 3.1 Text-Modelle pro Zweck

| Setting Key | Velgarien-Default | Beschreibung |
|------------|-------------------|-------------|
| `ai.models.agent_description` | deepseek/deepseek-chat-v3-0324 | Agent-Beschreibungen |
| `ai.models.agent_reactions` | meta-llama/llama-3.3-70b-instruct:free | Event-Reaktionen |
| `ai.models.building_description` | meta-llama/llama-3.3-70b-instruct:free | Gebäude-Beschreibungen |
| `ai.models.event_generation` | deepseek/deepseek-chat-v3-0324 | Event-Generierung |
| `ai.models.chat_response` | deepseek/deepseek-chat-v3-0324 | Chat-Antworten |
| `ai.models.news_transformation` | meta-llama/llama-3.2-3b-instruct:free | News-Transformation |
| `ai.models.social_trends` | meta-llama/llama-3.3-70b-instruct:free | Trend-Titel/Beschreibungen |
| `ai.models.fallback` | shisa-ai/shisa-v2-llama3.3-70b:free | Fallback-Modell |

### 3.2 Bild-Modelle

| Setting Key | Velgarien-Default | Beschreibung |
|------------|-------------------|-------------|
| `ai.image_models.agent_portrait` | stability-ai/stable-diffusion (SD 1.5) | Agent-Portraits |
| `ai.image_models.building_image` | stability-ai/stable-diffusion (SD 1.5) | Gebäude-Bilder |
| `ai.image_models.fallback` | sd15 | Fallback |

### 3.3 Bild-Parameter

| Setting Key | Default | Beschreibung |
|------------|---------|-------------|
| `ai.image_params.width` | 512 | Bildbreite |
| `ai.image_params.height` | 512 | Bildhöhe |
| `ai.image_params.guidance_scale` | 7.5 | Guidance Scale |
| `ai.image_params.num_inference_steps` | 50 | Inference Steps |
| `ai.image_params.scheduler` | "K_EULER" | Scheduler |

### 3.4 Prompt-Templates

Verwaltung über eigene UI (Prompt Template Editor).

| Setting Key | Beschreibung |
|------------|-------------|
| `ai.prompts.agent_generation.{locale}` | Agent-Generierungs-Prompt |
| `ai.prompts.building_generation.{locale}` | Gebäude-Generierungs-Prompt |
| `ai.prompts.portrait_description.{locale}` | Portrait-Beschreibungs-Prompt |
| `ai.prompts.event_generation.{locale}` | Event-Generierungs-Prompt |
| `ai.prompts.chat_system.{locale}` | Chat System-Prompt |
| `ai.prompts.news_transformation.{locale}` | News-Transformations-Prompt |
| ... | Alle 22 Prompts aus dem Altsystem |

### 3.5 Generierungs-Parameter

| Setting Key | Default | Beschreibung |
|------------|---------|-------------|
| `ai.params.temperature.default` | 0.8 | Default Temperatur |
| `ai.params.max_tokens.default` | 500 | Default Max Tokens |
| `ai.params.negative_prompt.agent` | "cartoon, anime..." | Negative Prompt (Agenten) |
| `ai.params.negative_prompt.building` | "people, humans..." | Negative Prompt (Gebäude) |

### UI-Spezifikation: AI Settings

```
┌─────────────────────────────────────────────────┐
│ KI-Einstellungen                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ ── Text-Modelle ──                              │
│                                                 │
│ Agent-Beschreibungen:                           │
│ [deepseek/deepseek-chat-v3-0324         ▾]     │
│ Temperatur: [0.8] Max Tokens: [300]             │
│                                                 │
│ Event-Reaktionen:                               │
│ [meta-llama/llama-3.3-70b-instruct:free ▾]     │
│ Temperatur: [0.7] Max Tokens: [100]             │
│                                                 │
│ ... (weitere Modelle)                           │
│                                                 │
│ ── Bild-Modelle ──                              │
│                                                 │
│ Agent-Portraits:                                │
│ [stability-ai/stable-diffusion          ▾]     │
│ Größe: [512]×[512]  Steps: [50]                │
│                                                 │
│ ── Prompt-Templates ──                          │
│                                                 │
│ [Prompt-Editor öffnen →]                        │
│ 22 Templates konfiguriert (12 DE, 10 EN)        │
│                                                 │
│           [Änderungen speichern]                │
└─────────────────────────────────────────────────┘
```

---

## 4. Integration Settings

### Externe Services pro Simulation

| Setting Key | Typ | Beschreibung |
|------------|-----|-------------|
| `integration.facebook.page_id` | string | Facebook Page ID |
| `integration.facebook.access_token` | encrypted | Page Access Token |
| `integration.facebook.api_version` | string | API Version (z.B. "v23.0") |
| `integration.facebook.enabled` | boolean | Facebook-Integration aktiv |
| `integration.guardian.api_key` | encrypted | Guardian API Key |
| `integration.guardian.enabled` | boolean | Guardian aktiv |
| `integration.newsapi.api_key` | encrypted | NewsAPI Key |
| `integration.newsapi.enabled` | boolean | NewsAPI aktiv |
| `integration.openrouter.api_key` | encrypted | OpenRouter API Key (Override) |
| `integration.replicate.api_key` | encrypted | Replicate API Key (Override) |

**Verschlüsselung:** Alle API-Keys werden mit AES-256 verschlüsselt in der Datenbank gespeichert. Der Verschlüsselungs-Key kommt aus einer Umgebungsvariable.

### UI-Spezifikation

```
┌─────────────────────────────────────────────────┐
│ Integrationen                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ ── Facebook ──                          [An ○]  │
│ Page ID:      [203648343900979     ]            │
│ Access Token: [••••••••••••••••••••]  [Testen]  │
│ API Version:  [v23.0               ]            │
│                                                 │
│ ── The Guardian ──                      [An ○]  │
│ API Key:      [••••••••••••••••••••]  [Testen]  │
│                                                 │
│ ── NewsAPI ──                           [An ○]  │
│ API Key:      [••••••••••••••••••••]  [Testen]  │
│                                                 │
│ ── AI-Provider (Überschreibungen) ──            │
│ OpenRouter Key: [Plattform-Default verwenden]   │
│ Replicate Key:  [Plattform-Default verwenden]   │
│                                                 │
│           [Änderungen speichern]                │
└─────────────────────────────────────────────────┘
```

---

## 5. Design Settings

### Theme-Tokens pro Simulation

| Setting Key | Velgarien-Default | Beschreibung |
|------------|-------------------|-------------|
| `design.colors.primary` | `#ff3333` | Primärfarbe |
| `design.colors.primary_hover` | `#cc0000` | Primär-Hover |
| `design.colors.secondary` | `#333333` | Sekundärfarbe |
| `design.colors.accent` | `#ff6600` | Akzentfarbe |
| `design.colors.background` | `#1a1a1a` | Hintergrund |
| `design.colors.surface` | `#2a2a2a` | Oberflächen |
| `design.colors.text` | `#f0f0f0` | Textfarbe |
| `design.colors.text_muted` | `#999999` | Gedämpfter Text |
| `design.colors.border` | `#444444` | Rahmenfarbe |
| `design.colors.error` | `#ff4444` | Fehlerfarbe |
| `design.colors.success` | `#44ff44` | Erfolgsfarbe |
| `design.colors.warning` | `#ffaa00` | Warnfarbe |
| `design.typography.font_family` | "Courier New, monospace" | Hauptschrift |
| `design.typography.heading_font` | "Arial Black, sans-serif" | Überschriften |
| `design.typography.font_size_base` | "16px" | Basis-Schriftgröße |
| `design.logo_url` | null | Eigenes Logo |
| `design.custom_css` | null | Custom CSS (max 10KB) |

### Anwendung der Theme-Tokens

```css
/* Simulation-Theme wird als CSS Custom Properties injiziert */
:root[data-simulation="velgarien"] {
  --sim-color-primary: #ff3333;
  --sim-color-background: #1a1a1a;
  --sim-font-family: "Courier New", monospace;
  /* ... */
}
```

---

## 6. Access Settings

| Setting Key | Default | Beschreibung |
|------------|---------|-------------|
| `access.visibility` | "private" | public / private |
| `access.allow_registration` | false | Offene Registrierung erlauben |
| `access.default_role` | "viewer" | Standard-Rolle für neue Mitglieder |
| `access.invitation_expiry_hours` | 72 | Einladungs-Gültigkeit in Stunden |
| `access.max_members` | 100 | Maximale Mitgliederanzahl |

---

## Mapping: Hartcodierte Werte → Settings

| Bisher hartcodiert in | Wert | Neues Setting |
|----------------------|------|---------------|
| `config.py` AI_MODELS | 8 Modelle mit Params | `ai.models.*` |
| `config.py` IMAGE_MODELS | 3 Modelle | `ai.image_models.*` |
| `config.py` NEWS_TRANSFORMATION_PROMPT | Deutscher Prompt | `ai.prompts.news_transformation.de` |
| `config.py` FACEBOOK_PAGE_ID | "203648343900979" | `integration.facebook.page_id` |
| `config.py` GUARDIAN_API_KEY | Key | `integration.guardian.api_key` |
| `config.py` NEWSAPI_KEY | Key | `integration.newsapi.api_key` |
| DB `gender_type` ENUM | 4 Werte | `simulation_taxonomies(type='gender')` |
| DB `profession_type` ENUM | 10 Werte | `simulation_taxonomies(type='profession')` |
| DB `building_special_type` ENUM | 5 Werte | `simulation_taxonomies(type='building_special_type')` |
| DB CHECK `urgency_level` | 4 deutsche Werte | `simulation_taxonomies(type='urgency_level')` |
| DB CHECK `target_demographic` | 4 deutsche Werte | `simulation_taxonomies(type='target_demographic')` |
| DB CHECK `propaganda_type` | 6 englische Werte | `simulation_taxonomies(type='campaign_type')` |
| DB CHECK `zone_type` | 8 Werte | `simulation_taxonomies(type='zone_type')` |
| DB CHECK `security_level` | 4 Werte | `simulation_taxonomies(type='security_level')` |
| Frontend Design-Tokens CSS | 170+ Variables | `design.*` |
| Frontend "Velgarien" Texte | Hardcoded | `general.name` (dynamisch) |
| Backend Prompt-Templates | 22 Prompts | `prompt_templates` Tabelle |
| `image_service.py` | Dimensions, Steps | `ai.image_params.*` |
| `validation/strategy.py` | System-Liste, Typen | `simulation_taxonomies` |
