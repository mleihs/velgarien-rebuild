# 17 - Implementation Plan: Step-by-Step Tasks

**Version:** 1.0
**Datum:** 2026-02-15

---

## Wie dieses Dokument zu verwenden ist

Jeder Task hat:
- **ID** — Eindeutige Referenz (P1.1.1 = Phase 1, Abschnitt 1, Task 1)
- **Dateien** — Welche Dateien erstellt/geandert werden
- **Akzeptanz** — Wie man pruft, dass der Task erledigt ist
- **Abh.** — Welche Tasks vorher erledigt sein mussen
- **Ref.** — Welches Spezifikations-Dokument die Details enthalt

Nach jedem Abschnitt gibt es einen **Checkpoint** — einen testbaren Zustand.

---

## Phase 1: Plattform-Grundgerust

### 1.1 Projekt-Setup

#### P1.1.1 — Repository + Projektstruktur erstellen
**Dateien:**
```
velgarien-platform/
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── config.py
│   ├── dependencies.py
│   ├── routers/__init__.py
│   ├── models/__init__.py
│   ├── services/__init__.py
│   ├── middleware/__init__.py
│   └── utils/__init__.py
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       └── index.html
├── supabase/
│   └── migrations/
├── biome.json
├── .env.example
├── .gitignore
└── pyproject.toml
```
**Akzeptanz:** `ls` zeigt die Struktur. `.gitignore` enthalt `.env`, `node_modules`, `__pycache__`, `dist`.
**Abh.:** Keine
**Ref.:** 13_TECHSTACK §Projektstruktur

#### P1.1.2 — Backend Dependencies installieren
**Dateien:** `backend/pyproject.toml`, `backend/requirements.txt`
**Aktion:** Alle Dependencies aus 13_TECHSTACK §Python-Konfiguration
**Akzeptanz:** `pip install -e .` erfolgreich. `python -c "import fastapi; import supabase; import httpx"` ohne Fehler.
**Abh.:** P1.1.1

#### P1.1.3 — Frontend Dependencies installieren
**Dateien:** `frontend/package.json`
**Aktion:** `npm install` mit allen Dependencies aus 13_TECHSTACK §Frontend Hinzufugen
**Akzeptanz:** `npm install` ohne Fehler. `npm run dev` startet Vite auf Port 5173.
**Abh.:** P1.1.1

#### P1.1.4 — Biome konfigurieren
**Dateien:** `biome.json`
**Aktion:** Konfiguration aus 13_TECHSTACK §Biome-Konfiguration
**Akzeptanz:** `npx biome check frontend/src/` lauft ohne Config-Fehler.
**Abh.:** P1.1.3

#### P1.1.5 — TypeScript konfigurieren
**Dateien:** `frontend/tsconfig.json`
**Aktion:** Konfiguration aus 13_TECHSTACK §TypeScript-Konfiguration
**Akzeptanz:** `npx tsc --noEmit` erfolgreich (oder nur erwartete Fehler bei fehlenden Quellen).
**Abh.:** P1.1.3

#### P1.1.6 — Vite konfigurieren
**Dateien:** `frontend/vite.config.ts`
**Aktion:** Konfiguration aus 13_TECHSTACK §Vite-Konfiguration (Proxy auf Port 8000, manualChunks)
**Akzeptanz:** `npm run dev` startet. Proxy leitet `/api` an `localhost:8000` weiter.
**Abh.:** P1.1.3

#### P1.1.7 — .env.example + Umgebungsvariablen
**Dateien:** `.env.example`, `backend/.env` (nicht committen!)
**Aktion:** Alle Variablen aus 13_TECHSTACK §FastAPI-Konfiguration (Settings Klasse)
**Akzeptanz:** Datei enthalt alle 8 Variablen mit Platzhaltern.
**Abh.:** P1.1.1

**Checkpoint 1.1:** Leeres Projekt mit korrekter Struktur, alle Dependencies installiert, Linting funktioniert.

---

### 1.2 Datenbank-Schema

#### P1.2.1 — Foundation-Tabellen (simulations, members, settings, taxonomies)
**Dateien:** `supabase/migrations/001_foundation.sql`
**Aktion:** CREATE TABLE fur:
1. `simulations` (mit allen Spalten, Status-Enum als CHECK)
2. `simulation_members` (user_id, role, UNIQUE)
3. `simulation_settings` (category + key, jsonb value)
4. `simulation_taxonomies` (taxonomy_type, value, jsonb label)
5. `simulation_invitations`
6. Alle Indexes
**Akzeptanz:** Migration lauft ohne Fehler. `SELECT * FROM simulations` gibt leere Tabelle.
**Abh.:** P1.1.7 (Supabase-Credentials)
**Ref.:** 03_DATABASE_SCHEMA_NEW §Foundation-Tabellen

#### P1.2.2 — Geographische Tabellen (cities, zones, streets)
**Dateien:** `supabase/migrations/002_geography.sql`
**Aktion:** CREATE TABLE fur `cities`, `zones`, `city_streets` mit FKs
**Akzeptanz:** FK-Constraint Tests: INSERT in zones mit ungultiger city_id schlagt fehl.
**Abh.:** P1.2.1
**Ref.:** 03_DATABASE_SCHEMA_NEW §Geographie

#### P1.2.3 — Entity-Tabellen (agents, buildings, events)
**Dateien:** `supabase/migrations/003_entities.sql`
**Aktion:** CREATE TABLE fur `agents`, `buildings`, `events` + alle Indexes
**Akzeptanz:** INSERT eines Test-Agents mit simulation_id erfolgreich.
**Abh.:** P1.2.1, P1.2.2
**Ref.:** 03_DATABASE_SCHEMA_NEW §Entity-Tabellen

#### P1.2.4 — Beziehungs-Tabellen
**Dateien:** `supabase/migrations/004_relations.sql`
**Aktion:** CREATE TABLE fur:
- `agent_professions`
- `building_agent_relations`
- `building_profession_requirements`
- `building_event_relations`
- `event_reactions`
**Akzeptanz:** FKs verifiziert. INSERT mit nicht-existierender agent_id schlagt fehl.
**Abh.:** P1.2.3
**Ref.:** 03_DATABASE_SCHEMA_NEW §Beziehungen

#### P1.2.5 — Campaign + Social Tabellen
**Dateien:** `supabase/migrations/005_social.sql`
**Aktion:** CREATE TABLE fur `campaigns`, `social_trends`, `social_media_posts`, `social_media_comments`, `social_media_agent_reactions`
**Akzeptanz:** Alle FKs vorhanden und enforced.
**Abh.:** P1.2.3
**Ref.:** 03_DATABASE_SCHEMA_NEW §Social

#### P1.2.6 — Chat + Prompt Tabellen
**Dateien:** `supabase/migrations/006_chat_prompts.sql`
**Aktion:** CREATE TABLE fur `chat_conversations`, `chat_messages`, `prompt_templates`, `audit_log`
**Akzeptanz:** Alle 26 Tabellen existieren. `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'` = 26.
**Abh.:** P1.2.3
**Ref.:** 03_DATABASE_SCHEMA_NEW §Chat, §Prompts

#### P1.2.7 — RLS-Helper-Funktionen
**Dateien:** `supabase/migrations/007_rls_functions.sql`
**Aktion:** CREATE FUNCTION:
- `user_has_simulation_access(sim_id uuid) → boolean`
- `user_simulation_role(sim_id uuid) → text`
**Akzeptanz:** Funktionen existieren und geben korrekte Ergebnisse zuruck.
**Abh.:** P1.2.1
**Ref.:** 10_AUTH_AND_SECURITY §RLS

#### P1.2.8 — RLS-Policies fur alle Tabellen
**Dateien:** `supabase/migrations/008_rls_policies.sql`
**Aktion:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + SELECT/INSERT/UPDATE/DELETE Policies fur alle 26 Tabellen
**Akzeptanz:** RLS ist auf allen Tabellen aktiviert. Query als nicht-authentifizierter User gibt 0 Rows.
**Abh.:** P1.2.7, P1.2.6 (alle Tabellen mussen existieren)
**Ref.:** 10_AUTH_AND_SECURITY §RLS-Policies

**Checkpoint 1.2:** 26 Tabellen mit FKs, Indexes und RLS-Policies deployed. Schema vollstandig.

---

### 1.3 Backend Foundation

#### P1.3.1 — FastAPI App + Config
**Dateien:** `backend/app.py`, `backend/config.py`
**Aktion:**
- `config.py`: `Settings(BaseSettings)` mit allen Env-Variablen
- `app.py`: `FastAPI()` + CORSMiddleware + SecurityHeadersMiddleware
**Akzeptanz:** `uvicorn backend.app:app` startet. `GET /docs` zeigt Swagger UI.
**Abh.:** P1.1.2
**Ref.:** 13_TECHSTACK §FastAPI-Konfiguration

#### P1.3.2 — Auth Dependencies (JWT + Supabase Client)
**Dateien:** `backend/dependencies.py`
**Aktion:**
- `get_current_user()` — JWT-Validierung via python-jose
- `get_supabase()` — Client mit User-JWT (RLS aktiv)
- `get_admin_supabase()` — Service Key (nur fur Admin-Ops)
- `get_simulation_context()` — Membership-Prufung
- `require_role()` — Rollen-Prufung
**Akzeptanz:** Unit-Test: Gultiger JWT → CurrentUser. Ungultiger JWT → 401.
**Abh.:** P1.3.1
**Ref.:** 10_AUTH_AND_SECURITY §Backend JWT-Validierung

#### P1.3.3 — Health Router
**Dateien:** `backend/routers/health.py`
**Aktion:** `GET /api/v1/health` → `{"status": "ok", "version": "2.0.0"}`
**Akzeptanz:** `curl localhost:8000/api/v1/health` gibt 200 + JSON.
**Abh.:** P1.3.1

#### P1.3.4 — Users Router
**Dateien:** `backend/routers/users.py`, `backend/models/user.py`
**Aktion:** `GET /api/v1/users/me` → User-Profil + Mitgliedschaften
**Akzeptanz:** Authentifizierter Request gibt User-Daten + Simulationsliste zuruck.
**Abh.:** P1.3.2
**Ref.:** 05_API_SPECIFICATION §Users

#### P1.3.5 — Simulations Router (CRUD)
**Dateien:** `backend/routers/simulations.py`, `backend/models/simulation.py`, `backend/services/simulation_service.py`
**Aktion:** 6 Endpoints: GET all, GET one, POST create, PUT update, DELETE, POST archive
**Akzeptanz:** Simulation erstellen → in DB. Listen → zeigt nur eigene.
**Abh.:** P1.3.2, P1.2.1
**Ref.:** 05_API_SPECIFICATION §Simulations

#### P1.3.6 — Pydantic Base Models
**Dateien:** `backend/models/common.py`
**Aktion:**
- `PaginatedResponse[T]` (data, total, page, limit)
- `ErrorResponse` (detail, code)
- `SuccessResponse[T]` (success, data)
- `CurrentUser` (id, email, access_token)
- `SimulationContext` (simulation_id, user, role)
**Akzeptanz:** Alle Models importierbar. Serialisierung/Deserialisierung korrekt.
**Abh.:** P1.1.2
**Ref.:** 05_API_SPECIFICATION §Response-Format

#### P1.3.7 — Backend Test-Setup
**Dateien:** `backend/tests/conftest.py`, `backend/tests/unit/test_models.py`
**Aktion:** Test-Fixtures, TestClient, JWT-Generator, erste Unit-Tests
**Akzeptanz:** `pytest backend/tests/unit/ -v` — alle Tests grun.
**Abh.:** P1.3.6
**Ref.:** 16_TESTING_STRATEGY §Backend Testing

**Checkpoint 1.3:** FastAPI lauft mit 3 Routers (health, users, simulations). JWT-Auth funktioniert. Tests laufen.

---

### 1.4 Frontend Foundation

#### P1.4.1 — Entry Point + App Shell
**Dateien:** `frontend/src/main.ts`, `frontend/src/app-shell.ts`, `frontend/index.html`
**Aktion:** Lit-basierte App-Shell mit Router-Outlet. Registriert alle Top-Level Routes.
**Akzeptanz:** `npm run dev` → Browser zeigt leere App-Shell.
**Abh.:** P1.1.6
**Ref.:** 07_FRONTEND_COMPONENTS §Routing

#### P1.4.2 — Router Setup
**Dateien:** `frontend/src/router.ts`
**Aktion:** `@lit-labs/router` Reactive Controller mit allen Routes aus 07_FRONTEND_COMPONENTS §Route-Definitionen
**Akzeptanz:** Navigation zu `/auth/login` zeigt Login-Placeholder. `/simulations` zeigt Dashboard-Placeholder.
**Abh.:** P1.4.1
**Ref.:** 07_FRONTEND_COMPONENTS §Routing

#### P1.4.3 — Design Tokens
**Dateien:**
```
frontend/src/styles/
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   ├── shadows.css
│   ├── z-index.css
│   └── animation.css
├── base/
│   ├── reset.css
│   └── global.css
└── index.css                # Importiert alle Token-Dateien
```
**Aktion:** 176+ CSS Custom Properties aus 12_DESIGN_SYSTEM
**Akzeptanz:** Browser DevTools zeigen alle `--token-*` Variablen auf `:root`.
**Abh.:** P1.4.1
**Ref.:** 12_DESIGN_SYSTEM §Token-System

#### P1.4.4 — Shared Component Styles
**Dateien:**
```
frontend/src/styles/components/
├── button.css
├── card.css
├── form.css
├── modal.css
├── table.css
└── notification.css
```
**Aktion:** Button-Varianten (primary, secondary, danger, ghost), Card, Form-Inputs, Modal-Layout
**Akzeptanz:** Test-HTML mit allen Varianten sieht korrekt aus (Brutalist-Asthetik).
**Abh.:** P1.4.3
**Ref.:** 12_DESIGN_SYSTEM §Buttons, §Cards, §Forms

#### P1.4.5 — Supabase Client + Auth Service
**Dateien:**
```
frontend/src/services/supabase/
├── client.ts
├── SupabaseAuthService.ts
└── index.ts
```
**Aktion:**
- `client.ts`: `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
- `SupabaseAuthService`: signIn, signUp, signOut, resetPassword, onAuthStateChange
**Akzeptanz:** `SupabaseAuthService.signIn()` gibt Session mit access_token zuruck.
**Abh.:** P1.1.3
**Ref.:** 10_AUTH_AND_SECURITY §Frontend Auth Service

#### P1.4.6 — BaseApiService
**Dateien:** `frontend/src/services/api/BaseApiService.ts`
**Aktion:** `get<T>`, `post<T>`, `put<T>`, `delete<T>` mit:
- JWT aus Supabase Session
- Simulation-scoped URLs
- Einheitliches Error-Handling
**Akzeptanz:** Unit-Test: Request enthalt Authorization-Header mit JWT.
**Abh.:** P1.4.5
**Ref.:** 07_FRONTEND_COMPONENTS §BaseApiService

#### P1.4.7 — AppStateManager
**Dateien:** `frontend/src/services/AppStateManager.ts`
**Aktion:** Preact Signals fur:
- `currentUser`, `accessToken`
- `currentSimulation`, `currentRole`
- `simulations`, `taxonomies`, `settings`
- Computed: `isOwner`, `canEdit`, `canAdmin`
**Akzeptanz:** `appState.currentUser.value` reaktiv. Signal-Change lost Re-Render aus.
**Abh.:** P1.1.3
**Ref.:** 07_FRONTEND_COMPONENTS §State Management

#### P1.4.8 — Typ-Definitionen (Kern)
**Dateien:**
```
frontend/src/types/
├── models/
│   ├── simulation.ts
│   ├── agent.ts
│   ├── building.ts
│   ├── event.ts
│   └── taxonomy.ts
├── api/
│   ├── common.ts         # ApiResponse<T>, PaginatedResponse<T>
│   ├── requests.ts
│   └── responses.ts
└── index.ts
```
**Akzeptanz:** `import { Agent, Building, ApiResponse } from '../types'` funktioniert ohne Fehler.
**Abh.:** P1.1.5
**Ref.:** 07_FRONTEND_COMPONENTS §Typ-Definitionen

#### P1.4.9 — Login + Register Komponenten
**Dateien:**
```
frontend/src/components/auth/
├── LoginView.ts
└── RegisterView.ts
```
**Aktion:** Formulare fur Email/Password. Nutzen SupabaseAuthService. Redirect zu `/simulations` bei Erfolg.
**Akzeptanz:** Login mit gultigen Credentials → Redirect. Ungultige → Fehlermeldung.
**Abh.:** P1.4.5, P1.4.4, P1.4.7
**Ref.:** 07_FRONTEND_COMPONENTS §AuthViews

#### P1.4.10 — Simulations Dashboard
**Dateien:**
```
frontend/src/components/platform/
├── SimulationsDashboard.ts
├── SimulationCard.ts
└── CreateSimulationButton.ts
```
**Aktion:** Zeigt alle Simulationen des Users als Cards. Click → Navigation zu Simulation.
**Akzeptanz:** Dashboard zeigt Simulationen. Klick navigiert zu `/simulations/:id/agents`.
**Abh.:** P1.4.6, P1.4.7, P1.4.9
**Ref.:** 07_FRONTEND_COMPONENTS §Plattform-Level

#### P1.4.11 — Frontend Test-Setup
**Dateien:** `frontend/vitest.config.ts`, `frontend/tests/setup.ts`, `frontend/tests/helpers/fixtures.ts`
**Aktion:** vitest-Config, Supabase-Mocks, Factory-Helpers
**Akzeptanz:** `npx vitest run` lauft ohne Config-Fehler.
**Abh.:** P1.1.3
**Ref.:** 16_TESTING_STRATEGY §Frontend Testing

**Checkpoint 1.4:** Login funktioniert. Dashboard zeigt Simulationen. Navigation zwischen Views. Design-System aktiv.

---

### 1.5 CI/CD

#### P1.5.1 — GitHub Actions Workflow
**Dateien:** `.github/workflows/ci.yml`
**Aktion:** Jobs: lint → test-backend → test-frontend → build
**Akzeptanz:** Push auf main lost Pipeline aus. Alle Jobs grun.
**Abh.:** P1.3.7, P1.4.11
**Ref.:** 16_TESTING_STRATEGY §CI/CD Pipeline

**Checkpoint Phase 1:** Plattform-Grundgerust steht. Auth, DB-Schema, API-Grundstruktur, Frontend-Shell, CI/CD.

---

## Phase 2: Velgarien als erste Simulation

### 2.1 Backend CRUD Routers

#### P2.1.1 — Agents Router + Service
**Dateien:**
- `backend/routers/agents.py`
- `backend/models/agent.py` (AgentCreate, AgentUpdate, AgentResponse, AgentListResponse)
- `backend/services/agent_service.py`
- `backend/tests/integration/test_agents_router.py`
**Aktion:** 7 Endpoints: GET list, GET one, POST create, PUT update, DELETE, POST generate-portrait (stub), GET reactions
**Akzeptanz:** CRUD vollstandig testbar via `/docs`. Pagination funktioniert. Suche nach Name funktioniert.
**Abh.:** P1.3.5, P1.3.6
**Ref.:** 05_API_SPECIFICATION §Agents

#### P2.1.2 — Buildings Router + Service
**Dateien:** `backend/routers/buildings.py`, `backend/models/building.py`, `backend/services/building_service.py`
**Aktion:** 11 Endpoints inkl. Agent-Zuweisungen und Profession-Requirements
**Akzeptanz:** Building erstellen + Agent zuweisen + Requirements setzen funktioniert.
**Abh.:** P2.1.1 (fur Agent-Zuweisungen)
**Ref.:** 05_API_SPECIFICATION §Buildings

#### P2.1.3 — Events Router + Service
**Dateien:** `backend/routers/events.py`, `backend/models/event.py`, `backend/services/event_service.py`
**Aktion:** 8 Endpoints inkl. Reaktionen
**Akzeptanz:** Event erstellen + manuelle Reaktion hinzufugen funktioniert.
**Abh.:** P2.1.1
**Ref.:** 05_API_SPECIFICATION §Events

#### P2.1.4 — Agent Professions Router
**Dateien:** `backend/routers/agent_professions.py`, `backend/models/agent_profession.py`
**Aktion:** 4 Endpoints: GET, POST, PUT, DELETE
**Akzeptanz:** Profession einem Agent zuweisen/entfernen funktioniert.
**Abh.:** P2.1.1
**Ref.:** 05_API_SPECIFICATION §Agent Professions

#### P2.1.5 — Locations Router (Cities, Zones, Streets)
**Dateien:** `backend/routers/locations.py`, `backend/models/location.py`, `backend/services/location_service.py`
**Aktion:** 11 Endpoints fur CRUD von Cities, Zones, Streets
**Akzeptanz:** Stadt → Zone → Strasse Hierarchie funktioniert.
**Abh.:** P1.3.5
**Ref.:** 05_API_SPECIFICATION §Locations

#### P2.1.6 — Taxonomies Router
**Dateien:** `backend/routers/taxonomies.py`, `backend/models/taxonomy.py`, `backend/services/taxonomy_service.py`
**Aktion:** 5 Endpoints: GET all, GET by type, POST, PUT, DELETE
**Akzeptanz:** Taxonomie-Werte pro Simulation abrufbar. Neue Werte anlegen funktioniert.
**Abh.:** P1.3.5
**Ref.:** 05_API_SPECIFICATION §Taxonomies

#### P2.1.7 — Settings Router
**Dateien:** `backend/routers/settings.py`, `backend/models/settings.py`, `backend/services/settings_service.py`, `backend/utils/encryption.py`
**Aktion:** 5 Endpoints + Verschlusselung fur sensitive Werte (API-Keys)
**Akzeptanz:** Setting setzen + abrufen. Verschlusselte Werte werden maskiert in Response.
**Abh.:** P1.3.5
**Ref.:** 05_API_SPECIFICATION §Settings, 10_AUTH_AND_SECURITY §Verschlusselung

#### P2.1.8 — Chat Router
**Dateien:** `backend/routers/chat.py`, `backend/models/chat.py`, `backend/services/chat_service.py`
**Aktion:** 5 Endpoints: GET conversations, POST new, GET messages, POST message, DELETE
**Akzeptanz:** Konversation erstellen + Nachrichten senden/empfangen (ohne AI — nur Speicherung).
**Abh.:** P2.1.1
**Ref.:** 05_API_SPECIFICATION §Chat

**Checkpoint 2.1:** Alle CRUD-Routers funktional. 70+ Endpoints testbar via Swagger `/docs`.

---

### 2.2 Daten-Migration

#### P2.2.1 — Velgarien-Simulation + Taxonomien anlegen
**Dateien:** `supabase/seed/001_velgarien_simulation.sql`
**Aktion:** INSERT Simulation + Taxonomien (Gender, Professionen, Systeme, Gebaudetypen, Urgency, Zonen) aus 15_MIGRATION_STRATEGY §2.2
**Akzeptanz:** `SELECT count(*) FROM simulation_taxonomies WHERE simulation_id = 'velgarien-uuid'` > 40 Werte.
**Abh.:** P1.2.1
**Ref.:** 15_MIGRATION_STRATEGY §2.2 Taxonomien migrieren

#### P2.2.2 — Agent-Daten migrieren
**Dateien:** `supabase/seed/002_migrate_agents.sql`
**Aktion:** TEXT→UUID Mapping, Gender-Enum→Taxonomy-Value, Spalten umbenennen (charakter→character)
**Akzeptanz:** Alle Agenten migriert. `agents.character` (nicht `charakter`) vorhanden. Gender ist englischer Wert.
**Abh.:** P2.2.1, P1.2.3
**Ref.:** 15_MIGRATION_STRATEGY §2.3 Agenten

#### P2.2.3 — Events + Buildings + Beziehungen migrieren
**Dateien:** `supabase/seed/003_migrate_entities.sql`
**Aktion:** Events (TEXT→UUID), Buildings, Reaktionen, Professionen, Geographische Daten
**Akzeptanz:** Zahlen-Vergleich Alt vs Neu = 100%. Keine verwaisten FKs.
**Abh.:** P2.2.2
**Ref.:** 15_MIGRATION_STRATEGY §2.3 Events, Buildings, Beziehungen

#### P2.2.4 — Social Media + Chat Daten migrieren
**Dateien:** `supabase/seed/004_migrate_social_chat.sql`
**Aktion:** facebook_posts → social_media_posts, agent_chats → chat_conversations
**Akzeptanz:** Alle Chat-Konversationen + Nachrichten migriert.
**Abh.:** P2.2.3
**Ref.:** 15_MIGRATION_STRATEGY §2.3 Social Media, Chat

#### P2.2.5 — Migration verifizieren
**Dateien:** `supabase/seed/005_verify_migration.sql`
**Aktion:** Verifikations-Queries aus 15_MIGRATION_STRATEGY §2.4
**Akzeptanz:** 0 orphaned records. Zahlen stimmen uberein.
**Abh.:** P2.2.4

**Checkpoint 2.2:** Alle Velgarien-Daten im neuen Schema. Verifiziert.

---

### 2.3 Frontend Views

#### P2.3.1 — Shared Components
**Dateien:**
```
frontend/src/components/shared/
├── BaseModal.ts
├── SharedFilterBar.ts
├── DataTable.ts
├── ErrorState.ts
├── LoadingState.ts
├── EmptyState.ts
├── ConfirmDialog.ts
├── Toast.ts
└── Pagination.ts
```
**Akzeptanz:** Jede Komponente rendert korrekt in Isolation. Events werden dispatched.
**Abh.:** P1.4.4, P1.4.8
**Ref.:** 07_FRONTEND_COMPONENTS §Shared Components

#### P2.3.2 — SimulationShell (Layout)
**Dateien:** `frontend/src/components/layout/SimulationShell.ts`, `SimulationHeader.ts`, `SimulationNav.ts`
**Aktion:** Layout mit Header + Navigation (Tabs/Sidebar) + Content-Outlet
**Akzeptanz:** Navigation zwischen Agents/Buildings/Events/Chat/Settings funktioniert.
**Abh.:** P1.4.2, P1.4.7

#### P2.3.3 — API Services (Agents, Buildings, Events)
**Dateien:**
```
frontend/src/services/api/
├── AgentsApiService.ts
├── BuildingsApiService.ts
├── EventsApiService.ts
├── LocationsApiService.ts
├── TaxonomiesApiService.ts
└── index.ts
```
**Akzeptanz:** Unit-Tests: Requests werden mit korrektem JWT und Simulation-URL gesendet.
**Abh.:** P1.4.6, P1.4.8
**Ref.:** 07_FRONTEND_COMPONENTS §FastAPI Business-Logic Services

#### P2.3.4 — AgentsView + AgentEditModal
**Dateien:**
```
frontend/src/components/agents/
├── AgentsView.ts
├── AgentCard.ts
├── AgentEditModal.ts
└── AgentDetailsPanel.ts
```
**Aktion:** Liste mit Filter + Pagination, Card-Darstellung, Create/Edit Modal, Detail-Ansicht
**Akzeptanz:** Agents auflisten, erstellen, bearbeiten, loschen. Filter nach System/Gender.
**Abh.:** P2.3.1, P2.3.3, P2.1.1
**Ref.:** 07_FRONTEND_COMPONENTS §AgentsView

#### P2.3.5 — BuildingsView + BuildingEditModal
**Dateien:** `frontend/src/components/buildings/` (analog zu Agents)
**Akzeptanz:** Buildings CRUD. Agent-Zuweisung in Details.
**Abh.:** P2.3.1, P2.3.3, P2.1.2

#### P2.3.6 — EventsView + EventEditModal
**Dateien:** `frontend/src/components/events/` (analog zu Agents)
**Akzeptanz:** Events CRUD. Reaktionen anzeigen.
**Abh.:** P2.3.1, P2.3.3, P2.1.3

#### P2.3.7 — Zod Validation Schemas
**Dateien:**
```
frontend/src/types/validation/
├── agent.ts
├── building.ts
├── event.ts
└── common.ts
```
**Aktion:** Zod-Schemas parallel zu Backend Pydantic Models
**Akzeptanz:** Formulare validieren clientseitig bevor Request gesendet wird.
**Abh.:** P1.1.3
**Ref.:** 07_FRONTEND_COMPONENTS §Zod Validierung

#### P2.3.8 — Frontend Integration Tests
**Dateien:** `frontend/src/components/agents/AgentsView.test.ts` (+ analog fur Buildings, Events)
**Akzeptanz:** Component-Tests rendern Views, simulieren User-Interaktion, verifizieren API-Calls.
**Abh.:** P2.3.4, P1.4.11
**Ref.:** 16_TESTING_STRATEGY §Component Tests

**Checkpoint 2.3:** Feature-Parity mit Altsystem fur Agents, Buildings, Events. CRUD funktional End-to-End.

---

### 2.4 Chat System (Basis)

#### P2.4.1 — ChatView + Komponenten
**Dateien:**
```
frontend/src/components/chat/
├── ChatView.ts
├── ConversationList.ts
├── ChatWindow.ts
├── MessageList.ts
├── MessageInput.ts
└── AgentSelector.ts
```
**Aktion:** Konversationen auflisten, neue starten, Nachrichten senden/empfangen (ohne AI — direktes Speichern)
**Akzeptanz:** Konversation mit Agent starten. Nachricht senden → erscheint in Liste.
**Abh.:** P2.3.1, P2.1.8
**Ref.:** 07_FRONTEND_COMPONENTS §ChatView

**Checkpoint Phase 2:** Velgarien-Daten migriert. CRUD fur alle Kern-Entities. Chat-Basis. Feature-Parity ~80%.

---

## Phase 3: Settings, i18n, AI-Pipelines

### 3.1 Settings System

#### P3.1.1 — Settings API Services (Frontend)
**Dateien:** `frontend/src/services/api/SettingsApiService.ts`, `frontend/src/services/api/SimulationsApiService.ts`
**Akzeptanz:** Settings laden + speichern via API.
**Abh.:** P2.1.7

#### P3.1.2 — SettingsView mit Tabs
**Dateien:**
```
frontend/src/components/settings/
├── SettingsView.ts
├── SettingsTabs.ts
├── GeneralSettingsPanel.ts
├── WorldSettingsPanel.ts
├── AISettingsPanel.ts
├── IntegrationSettingsPanel.ts
├── DesignSettingsPanel.ts
└── AccessSettingsPanel.ts
```
**Akzeptanz:** 6 Tabs navigierbar. General-Tab: Name andern + speichern.
**Abh.:** P3.1.1, P2.3.1
**Ref.:** 07_FRONTEND_COMPONENTS §Settings-UI, 08_SIMULATION_SETTINGS

#### P3.1.3 — Taxonomie-Editor (World Tab)
**Dateien:** In `WorldSettingsPanel.ts`
**Aktion:** Dropdown mit Taxonomie-Typ. CRUD fur Werte. Sortierung per Drag&Drop (optional).
**Akzeptanz:** Neuen Taxonomie-Wert anlegen, Label andern, deaktivieren, loschen.
**Abh.:** P3.1.2, P2.1.6

---

### 3.2 i18n

#### P3.2.1 — @lit/localize Setup
**Dateien:** `frontend/lit-localize.json`, `frontend/src/locales/generated/`
**Aktion:** Runtime-Mode Konfiguration. Source locale: `en`. Target: `de`.
**Akzeptanz:** `npx lit-localize extract` generiert XLIFF-Dateien.
**Abh.:** P1.1.3
**Ref.:** 14_I18N_ARCHITECTURE §Konfiguration

#### P3.2.2 — Translation-Dateien (DE + EN)
**Dateien:** `frontend/src/locales/de.ts`, `frontend/src/locales/en.ts`
**Aktion:** Alle UI-Strings aus 14_I18N_ARCHITECTURE §Translation-Dateien
**Akzeptanz:** Beide Dateien kompilieren fehlerfrei.
**Abh.:** P3.2.1
**Ref.:** 14_I18N_ARCHITECTURE §Translation-Dateien

#### P3.2.3 — LocaleService + Locale-Wechsel
**Dateien:** `frontend/src/services/i18n/locale-service.ts`
**Aktion:** `setLocale()`, `getInitialLocale()`, Persistenz in localStorage
**Akzeptanz:** Locale wechseln → alle sichtbaren Strings andern sich sofort (ohne Reload).
**Abh.:** P3.2.2
**Ref.:** 14_I18N_ARCHITECTURE §Locale-Service

#### P3.2.4 — Komponenten auf msg() umstellen
**Aktion:** Alle hardcodierten Strings in allen Komponenten durch `msg()` ersetzen
**Akzeptanz:** `grep -r "Laden\.\.\." frontend/src/components/` → 0 Treffer.
**Abh.:** P3.2.3, P2.3.4+

#### P3.2.5 — FormatService (Datums-/Zahlenformatierung)
**Dateien:** `frontend/src/utils/formatters.ts`
**Aktion:** `formatDate`, `formatDateTime`, `formatNumber`, `formatPercent`, `formatRelativeTime` via Intl API
**Akzeptanz:** Unit-Tests: DE-Locale formatiert Datum als "15. Jan. 2026", EN als "Jan 15, 2026".
**Abh.:** P3.2.3
**Ref.:** 14_I18N_ARCHITECTURE §Datums- und Zahlenformatierung

---

### 3.3 Prompt-System

#### P3.3.1 — Prompt Templates Seed-Daten
**Dateien:** `supabase/seed/006_prompt_templates.sql`
**Aktion:** Alle 22 Prompts als DE + EN Templates (simulation_id = NULL = Plattform-Default)
**Akzeptanz:** `SELECT count(*) FROM prompt_templates WHERE simulation_id IS NULL` = 44 (22 × 2 Sprachen).
**Abh.:** P1.2.6
**Ref.:** 14_I18N_ARCHITECTURE §Alle 22 Prompts, 15_MIGRATION_STRATEGY §3.2

#### P3.3.2 — PromptResolver Service (Backend)
**Dateien:** `backend/services/prompt_service.py`
**Aktion:** 5-stufige Auflosungs-Kette: Sim+Locale → Sim+Default → Platform+Locale → Platform+EN → Hardcoded
**Akzeptanz:** Unit-Tests fur alle 5 Fallback-Stufen.
**Abh.:** P3.3.1
**Ref.:** 14_I18N_ARCHITECTURE §Prompt-Auflosungs-Kette

#### P3.3.3 — Prompt Templates Router
**Dateien:** `backend/routers/prompt_templates.py`
**Aktion:** 6 Endpoints: CRUD + Test-Endpoint (Prompt mit Variablen rendern)
**Akzeptanz:** Prompt laden, anpassen, testen via API.
**Abh.:** P3.3.2
**Ref.:** 05_API_SPECIFICATION §Prompt Templates

---

### 3.4 AI-Integration

#### P3.4.1 — OpenRouter Service (Async)
**Dateien:** `backend/services/external/openrouter.py`
**Aktion:** Async httpx Client. `generate(model, messages, temperature, max_tokens)`. Retry mit tenacity.
**Akzeptanz:** Mock-Test: Generiert Text. Retry bei 429. Fallback-Modell bei 503.
**Abh.:** P1.1.2
**Ref.:** 11_EXTERNAL_SERVICES §OpenRouter, 09_AI_INTEGRATION

#### P3.4.2 — Replicate Service (Async)
**Dateien:** `backend/services/external/replicate.py`
**Aktion:** Prediction erstellen → Poll bis succeeded → Download → WebP-Konvertierung → Supabase Storage Upload
**Akzeptanz:** Mock-Test: Prediction-Lifecycle funktioniert.
**Abh.:** P1.1.2
**Ref.:** 11_EXTERNAL_SERVICES §Replicate

#### P3.4.3 — Generation Router
**Dateien:** `backend/routers/generation.py`, `backend/services/generation_service.py`
**Aktion:** 5 Endpoints: Agent-Text, Building-Text, Portrait-Desc, Event, Image
**Akzeptanz:** Mit Mock: Agent-Beschreibung generieren → in DB gespeichert.
**Abh.:** P3.4.1, P3.4.2, P3.3.2
**Ref.:** 05_API_SPECIFICATION §Generation, 09_AI_INTEGRATION

#### P3.4.4 — Chat mit LangChain Memory
**Dateien:** `backend/services/chat_service.py` (erweitern)
**Aktion:** LangChain ConversationBufferMemory + OpenRouter. System-Prompt aus PromptResolver.
**Akzeptanz:** Chat-Nachricht → AI-Antwort im Charakter des Agenten. Memory uber mehrere Nachrichten.
**Abh.:** P3.4.1, P3.3.2, P2.1.8
**Ref.:** 09_AI_INTEGRATION §Chat-Pipeline

#### P3.4.5 — Frontend: Generation Services + UI
**Dateien:** `frontend/src/services/api/GenerationApiService.ts`
**Aktion:** Buttons in Agent/Building/Event Modals: "Beschreibung generieren", "Portrait generieren"
**Akzeptanz:** Click auf "Generieren" → Loading-State → Beschreibung/Bild erscheint.
**Abh.:** P3.4.3, P2.3.4

**Checkpoint Phase 3:** Settings-UI komplett. i18n aktiv (DE+EN). AI-Generierung funktional. Feature-Parity ~95%.

---

## Phase 4: Multi-User, Social, Polish

### 4.1 Einladungen + Rollen

#### P4.1.1 — Invitations Router + UI
**Dateien:** `backend/routers/invitations.py`, `frontend/src/components/platform/InvitationAcceptView.ts`
**Aktion:** Einladung erstellen → Token-URL → Annehmen → Mitglied der Simulation
**Abh.:** P1.3.5, P3.1.2

#### P4.1.2 — AccessSettingsPanel (Rollen-Verwaltung)
**Aktion:** Mitglieder-Liste, Rollen-Dropdown (Owner/Admin/Editor/Viewer), Einladungs-Links
**Abh.:** P4.1.1, P3.1.2

---

### 4.2 Social Features

#### P4.2.1 — Social Trends Router + View
**Dateien:** `backend/routers/social_trends.py`, `frontend/src/components/social/SocialTrendsView.ts`
**Aktion:** Trends abrufen, transformieren, Kampagnen erstellen
**Abh.:** P2.1.1, P3.4.1

#### P4.2.2 — Social Media Router + View
**Dateien:** `backend/routers/social_media.py`, `backend/services/external/facebook.py`
**Aktion:** Facebook Posts importieren, transformieren, Sentiment-Analyse
**Abh.:** P4.2.1, P3.4.1, P2.1.7 (Facebook-Settings)

#### P4.2.3 — News Integration
**Dateien:** `backend/services/external/news.py`
**Aktion:** Guardian + NewsAPI Integration, Transformation in Simulations-Kontext
**Abh.:** P3.4.1, P2.1.7

#### P4.2.4 — Campaigns Router + Dashboard
**Dateien:** `backend/routers/campaigns.py`, `frontend/src/components/social/CampaignDashboard.ts`
**Abh.:** P4.2.1

---

### 4.3 Realtime + Simulation-Erstellung

#### P4.3.1 — Supabase Realtime Service
**Dateien:** `frontend/src/services/supabase/SupabaseRealtimeService.ts`
**Aktion:** Live-Updates fur Chat-Nachrichten und Agent-Anderungen
**Abh.:** P1.4.5, P2.4.1

#### P4.3.2 — CreateSimulationWizard
**Dateien:** `frontend/src/components/platform/CreateSimulationWizard.ts`
**Aktion:** 3-Step Wizard: Basics → Taxonomien → Bestatigung
**Abh.:** P3.1.1, P2.1.6

---

### 4.4 Testing + Performance

#### P4.4.1 — E2E Tests (Playwright)
**Dateien:** `frontend/tests/e2e/*.spec.ts`
**Aktion:** 20+ E2E Tests fur alle kritischen Flows (Auth, Agent CRUD, Chat, Settings)
**Abh.:** Alle UI-Komponenten
**Ref.:** 16_TESTING_STRATEGY §E2E Testing

#### P4.4.2 — RLS Security Tests
**Dateien:** `backend/tests/integration/test_rls_policies.py`
**Aktion:** Isolation-Tests (User A sieht nicht User Bs Daten), Rollen-Tests (Viewer kann nicht schreiben)
**Abh.:** P4.1.1
**Ref.:** 16_TESTING_STRATEGY §RLS Security Tests

#### P4.4.3 — Performance Tests
**Dateien:** `backend/tests/performance/test_load.py`
**Aktion:** 100 gleichzeitige Requests. Suche uber 10.000 Agenten.
**Abh.:** P2.2.5
**Ref.:** 16_TESTING_STRATEGY §Performance Tests

**Checkpoint Phase 4:** Multi-User funktional. Social Features. Realtime. Umfassend getestet. Production-ready.

---

## Task-Ubersicht (Zahlen)

| Phase | Tasks | Dateien (geschatzt) | Endpoints |
|-------|-------|-------------------|-----------|
| Phase 1 | 28 Tasks | ~60 Dateien | 9 Endpoints |
| Phase 2 | 20 Tasks | ~80 Dateien | 70+ Endpoints |
| Phase 3 | 16 Tasks | ~50 Dateien | 20+ Endpoints |
| Phase 4 | 11 Tasks | ~30 Dateien | 15+ Endpoints |
| **Gesamt** | **75 Tasks** | **~220 Dateien** | **~108 Endpoints** |

---

## Abhangigkeitsgraph (kritischer Pfad)

```
P1.1.1 → P1.1.2+P1.1.3 → P1.2.1 → P1.2.3 → P1.2.8
                          ↓                      ↓
                     P1.3.1 → P1.3.2 → P1.3.5
                                        ↓
P1.4.1 → P1.4.5 → P1.4.6 → P1.4.9 → P1.4.10
                                        ↓
                              P2.1.1 → P2.3.4 → P2.3.8
                                        ↓
                              P2.2.1 → P2.2.5
                                        ↓
                              P3.1.2 → P3.2.4 → P3.4.3 → P3.4.5
                                                           ↓
                                                  P4.4.1 → DONE
```

**Kritischer Pfad:** Setup → Schema → Auth → CRUD → Migration → Settings → i18n → AI → Tests

---

## Querverweise

- **00-15** — Spezifikations-Dokumente (Referenz fur jede Task)
- **16_TESTING_STRATEGY.md** — Test-Patterns, CI/CD, Coverage-Ziele
