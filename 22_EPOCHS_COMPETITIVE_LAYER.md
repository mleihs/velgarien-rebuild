# 22 - Epochs & Competitive Layer

**Version:** 1.0
**Date:** 2026-02-27

---

## Overview

Epochs are time-limited competitive seasons where simulation owners become active players competing for multiverse dominance. During an Epoch, every worldbuilding decision — staffing buildings, maintaining embassies, managing events — has direct scoring consequences. Simulations deploy covert operatives through embassies to sabotage rivals, gather intelligence, and spread propaganda, while defending their own worlds from infiltration.

Outside of Epochs, the simulation economy (staffing, zone stability, diplomacy, bleed) runs as PvE infrastructure. Epochs activate the PvP competitive layer on top of this foundation.

### Lore Context

> "The Cartographers observed. They mapped. They recorded. But they never intervened — until the Convergence. When the walls between Shards thinned beyond safe limits, the Bureau declared an Epoch: a controlled collision of realities. The Shards would compete. The strongest narrative would persist. The weakest would fade. This was not cruelty. This was triage."

Epochs represent moments when the multiverse forces its simulations into direct competition. The Bleed intensifies, embassies become espionage channels, and the careful infrastructure each simulation owner has built is tested under fire.

---

## Feature Architecture

### Database Schema

**6 new tables** (migration 032):

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `game_epochs` | Epoch definitions + lifecycle | `name`, `status` (lobby→foundation→competition→reckoning→completed), `config` (JSONB), `current_cycle` |
| `epoch_participants` | Simulation enrollment per epoch | `epoch_id`, `simulation_id`, `team_id`, `current_rp`, `final_scores` |
| `epoch_teams` | Alliance definitions | `name`, `epoch_id`, `created_by_simulation_id`, `dissolved_at`, `dissolved_reason` |
| `operative_missions` | Deployed operatives + results | `agent_id`, `operative_type`, `source_simulation_id`, `target_simulation_id`, `embassy_id`, `status`, `success_probability`, `mission_result` |
| `epoch_scores` | Score snapshots per cycle | `cycle_number`, 5 dimension scores + composite, unique per (epoch, simulation, cycle) |
| `battle_log` | Narrative event feed | `event_type`, `narrative`, `is_public`, `metadata` |

**4 materialized views** (migration 031):

| View | Purpose |
|------|---------|
| `mv_building_readiness` | Staffing ratio x qualification match x condition factor per building |
| `mv_zone_stability` | Infrastructure score + security factor - event pressure per zone |
| `mv_embassy_effectiveness` | Building health x ambassador quality x vector alignment per embassy |
| `mv_simulation_health` | Aggregate zone stability + diplomatic reach per simulation |

### Backend

| Component | File | Purpose |
|-----------|------|---------|
| **Epoch Router** | `routers/epochs.py` (268 lines) | CRUD epochs, join/leave, team management, lifecycle transitions |
| **Operatives Router** | `routers/operatives.py` (145 lines) | Deploy, recall, list missions, counter-intelligence |
| **Scores Router** | `routers/scores.py` (79 lines) | Leaderboard, score history, final standings |
| **Game Mechanics Router** | `routers/game_mechanics.py` (171 lines) | Simulation health, building readiness, zone stability |
| **Epoch Service** | `services/epoch_service.py` (501 lines) | Lifecycle (create → start → advance → resolve → complete), RP allocation, cycle resolution |
| **Operative Service** | `services/operative_service.py` (559 lines) | Deploy/recall/resolve missions, success probability calculation |
| **Scoring Service** | `services/scoring_service.py` (389 lines) | 5-dimension scoring, normalization, composite weighting |
| **Battle Log Service** | `services/battle_log_service.py` (259 lines) | Record + query competitive event narratives |
| **Game Mechanics Service** | `services/game_mechanics_service.py` (310 lines) | Read materialized views, compute live simulation metrics |

### Frontend

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **EpochCommandCenter** | `components/epoch/EpochCommandCenter.ts` | 1288 | Main dashboard — lobby/active epoch views, 5 tabs |
| **EpochCreationWizard** | `components/epoch/EpochCreationWizard.ts` | 1141 | 3-step epoch setup (Parameters/Economy/Doctrine) |
| **DeployOperativeModal** | `components/epoch/DeployOperativeModal.ts` | 1469 | 3-step operative deployment (Asset/Mission/Target) |
| **EpochLeaderboard** | `components/epoch/EpochLeaderboard.ts` | 411 | Sortable score table with per-dimension bars |
| **EpochBattleLog** | `components/epoch/EpochBattleLog.ts` | 262 | Narrative event feed with filtering |
| **EpochsApiService** | `services/api/EpochsApiService.ts` | 203 | 27 API methods for epochs + operatives + scores |

### API Endpoints

**Epoch CRUD & Lifecycle:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/epochs` | optional | List all epochs (paginated) |
| GET | `/epochs/active` | optional | Get active epoch |
| GET | `/epochs/{id}` | optional | Get epoch detail |
| POST | `/epochs` | owner | Create epoch |
| PATCH | `/epochs/{id}` | creator | Update epoch config |
| POST | `/epochs/{id}/start` | creator | Start epoch (lobby → foundation) |
| POST | `/epochs/{id}/advance` | creator | Advance phase |
| POST | `/epochs/{id}/cancel` | creator | Cancel epoch |
| POST | `/epochs/{id}/resolve-cycle` | creator | Trigger cycle resolution |

**Participants & Teams:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/epochs/{id}/participants` | optional | List participants |
| POST | `/epochs/{id}/participants` | owner | Join epoch with simulation |
| DELETE | `/epochs/{id}/participants/{sim}` | owner | Leave epoch |
| GET | `/epochs/{id}/teams` | optional | List teams |
| POST | `/epochs/{id}/teams` | owner | Create team |
| POST | `/epochs/{id}/teams/{tid}/join` | owner | Join team |
| POST | `/epochs/{id}/teams/leave` | owner | Leave team |

**Operatives:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/epochs/{id}/operatives` | owner | List your missions |
| GET | `/epochs/{id}/operatives/{mid}` | owner | Get mission detail |
| POST | `/epochs/{id}/operatives` | owner | Deploy operative |
| POST | `/epochs/{id}/operatives/{mid}/recall` | owner | Recall operative |
| GET | `/epochs/{id}/operatives/threats` | owner | List detected threats |
| POST | `/epochs/{id}/operatives/counter-intel` | owner | Counter-intelligence sweep (3 RP) |

**Scores & Battle Log:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/epochs/{id}/scores/leaderboard` | optional | Current leaderboard |
| GET | `/epochs/{id}/scores/standings` | optional | Final standings |
| GET | `/epochs/{id}/scores/simulations/{sid}` | owner | Score history |
| GET | `/epochs/{id}/battle-log` | optional | Battle log entries |

**Public (no auth):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/epochs` | List epochs |
| GET | `/public/epochs/active` | Active epoch |
| GET | `/public/epochs/{id}` | Epoch detail |
| GET | `/public/epochs/{id}/participants` | Participants |
| GET | `/public/epochs/{id}/teams` | Teams |
| GET | `/public/epochs/{id}/leaderboard` | Public leaderboard |
| GET | `/public/epochs/{id}/standings` | Final standings |
| GET | `/public/epochs/{id}/battle-log` | Public battle log |

---

## How It Works

### Epoch Lifecycle

```
LOBBY ──→ FOUNDATION ──→ COMPETITION ──→ RECKONING ──→ COMPLETED
          (first ~20%)    (middle ~65%)    (final ~15%)
```

1. **Lobby** — Epoch created, simulations join, teams form. No game mechanics active.
2. **Foundation** — +50% RP income. Build infrastructure, staff buildings, establish embassies. No offensive operatives allowed (guardians OK).
3. **Competition** — Full mechanics. All 6 operative types available. Alliances locked. Scores snapshot each cycle.
4. **Reckoning** — Bleed permeability doubled, thresholds reduced by 2, cascade depth +1. Dramatic escalation.
5. **Completed** — Final scores computed, winner declared, operatives recalled.

### Resonance Points (RP)

RP is the action economy currency. Each simulation receives RP at the start of each cycle.

| Setting | Default | Description |
|---------|---------|-------------|
| RP per cycle | 10 | Base allocation (foundation: 15) |
| RP cap | 30 | Maximum stored RP — excess is lost |
| Cycle interval | 8 hours | Time between cycle resolutions |

**RP costs:**

| Action | Cost |
|--------|------|
| Deploy Spy | 3 RP |
| Deploy Guardian | 3 RP |
| Deploy Propagandist | 4 RP |
| Deploy Saboteur | 5 RP |
| Deploy Infiltrator | 6 RP |
| Deploy Assassin | 8 RP |
| Counter-intelligence sweep | 3 RP |

### Operative Types

| Type | Cost | Deploy Time | Duration | Effect |
|------|------|-------------|----------|--------|
| **Spy** | 3 RP | Instant | 3 cycles | Reveals target's health metrics, zone stability, active operatives |
| **Saboteur** | 5 RP | 1 cycle | Single action | Degrades one target building's condition by one step |
| **Propagandist** | 4 RP | 1 cycle | 2 cycles | Generates a destabilizing event (impact 6-8) in target zone |
| **Assassin** | 8 RP | 2 cycles | Single action | Wounds target agent — reduces relationships by 2, removes ambassador status for 3 cycles |
| **Guardian** | 3 RP | Instant | Permanent | +20% enemy detection probability per guardian in zone. Deploys to OWN simulation only. |
| **Infiltrator** | 6 RP | 2 cycles | 3 cycles | Reduces target embassy effectiveness by 50% |

### Success Probability

```
base_probability = 0.5
+ operative_qualification × 0.05  (0-10 scale → +0 to +0.50)
- target_zone_security × 0.05    (mapped 0-10 → -0 to -0.50)
- guardian_presence × 0.20        (per guardian in zone)
+ embassy_effectiveness × 0.15   (0-1 → +0 to +0.15)

Final: clamped to [0.05, 0.95]
```

**Failure outcomes:**
- **Undetected failure** — Mission fails silently. Operative returns. No consequences.
- **Detected failure** (probability: 1 - success_probability) — Operative captured (removed for epoch). Diplomatic Incident event in both simulations (impact 7). Embassy effectiveness -0.3 for 3 cycles. Attacker identity revealed.

### Scoring — 5 Dimensions

| Dimension | What it rewards | Default Weight | Title |
|-----------|----------------|----------------|-------|
| **Stability** | Keeping simulation healthy (avg zone stability) | 25% | "The Unshaken" |
| **Influence** | Shaping other worlds via bleed echoes | 20% | "The Resonant" |
| **Sovereignty** | Resisting foreign influence | 20% | "The Sovereign" |
| **Diplomatic** | Embassy network + alliances | 15% | "The Architect" |
| **Military** | Successful covert operations | 20% | "The Shadow" |

**Composite score** = weighted sum of normalized dimensions. Each dimension is rescaled 0–100 relative to the highest scorer in that dimension. Configurable weights via Epoch Creation Wizard presets: Balanced / Builder / Warmonger / Diplomat.

**Team scoring** = sum of member scores + 5% alliance bonus per active member.

### Alliances & Betrayal

- Teams form during lobby/foundation. Max team size configurable (default 3).
- Alliances lock when competition phase begins (no new teams).
- If `allow_betrayal = true`: allied simulations can covertly attack each other.
  - **Detected betrayal** → alliance immediately dissolves, betrayer gets -20% Diplomatic Score.
  - **Undetected betrayal** → normal operative effects, alliance intact.

### Embassy Requirement

Embassies are the **only channel** for deploying operatives. You cannot attack a simulation without an active embassy connection.

**Strategic implications:**
- Embassies enable both diplomacy (scoring) AND warfare (operatives)
- Dissolving an embassy immediately recalls all your operatives through that channel
- An enemy can dissolve their embassy to cut off your operative pipeline
- But dissolving also kills your own offensive capability and diplomatic score

---

## User Interface

### Epoch Command Center (`/epoch`)

Platform-level route accessible to all authenticated users. Five tabs:

1. **Overview** — Epoch status banner (name, phase, day counter, next cycle countdown, RP counter), quick actions panel
2. **Leaderboard** — Sortable table with rank, simulation name, composite score, per-dimension bars, team affiliation
3. **Operations** — Your active operatives (status, remaining cycles), detected threats, deploy button
4. **Battle Log** — Chronological narrative feed of competitive events (filterable by type)
5. **Alliances** — Your team, invite/leave controls

**Lobby view** (no active epoch): Past epochs list + Create Epoch button (owners only).

**Design:** Military command console aesthetic. Dark background (gray-950), green (#4ade80) accent for active elements, amber (#f59e0b) for RP/warnings. Monospace readouts for stats. Scan-line texture overlay.

### Epoch Creation Wizard

3-step modal wizard:

1. **Parameters** — Name, duration (3-60 days), cycle interval (2-24 hours), phase percentages (foundation/reckoning split with computed competition phase)
2. **Economy** — RP per cycle, RP cap, max team size, allow betrayal toggle
3. **Doctrine** — 5 score weight sliders (must sum to 100%) with presets: Balanced (25/20/20/15/20), Builder (40/15/15/10/20), Warmonger (15/15/15/15/40), Diplomat (15/20/20/30/15)

### Deploy Operative Modal

3-step tactical dossier wizard:

1. **Asset** — Select agent from your simulation. Shows dossier card (portrait, professions, character excerpt). Warning about leaving building post.
2. **Mission** — Choose operative type (6 cards with cost/duration/effect). Select embassy route. Guardian special case (deploys to own simulation, no embassy needed).
3. **Target** — Select target zone/building/agent based on mission type. SVG targeting ring shows success probability with factor breakdown. Confirmation summary with RP cost.

**Design:** Tactical dossier aesthetic. Amber (#f59e0b) accent, scan-line textures, CLASSIFIED watermark, targeting ring SVG for success probability visualization.

---

## TypeScript Interfaces

```typescript
type EpochStatus = 'lobby' | 'foundation' | 'competition' | 'reckoning' | 'completed' | 'cancelled';
type OperativeType = 'spy' | 'saboteur' | 'propagandist' | 'assassin' | 'guardian' | 'infiltrator';

interface EpochConfig {
  duration_days: number;     // 3-60
  cycle_hours: number;       // 2-24
  rp_per_cycle: number;      // 5-25
  rp_cap: number;            // 15-75
  foundation_pct: number;    // 10-30
  reckoning_pct: number;     // 10-25
  max_team_size: number;     // 2-8
  allow_betrayal: boolean;
  score_weights: EpochScoreWeights;
  referee_mode: boolean;
}

interface Epoch {
  id: UUID;
  name: string;
  description?: string;
  created_by_id: UUID;
  starts_at?: string;
  ends_at?: string;
  current_cycle: number;
  status: EpochStatus;
  config: EpochConfig;
}

interface OperativeMission {
  id: UUID;
  epoch_id: UUID;
  agent_id: UUID;
  operative_type: OperativeType;
  source_simulation_id: UUID;
  target_simulation_id?: UUID;   // null for guardians
  embassy_id?: UUID;             // null for guardians
  target_entity_id?: UUID;       // building/agent/embassy
  target_entity_type?: string;
  target_zone_id?: UUID;
  status: string;                // deploying/active/success/failed/detected/captured
  cost_rp: number;
  success_probability?: number;
  deployed_at: string;
  resolves_at: string;
  mission_result?: Record<string, unknown>;
}

interface LeaderboardEntry {
  rank: number;
  simulation_id: UUID;
  simulation_name: string;
  team_name?: string;
  stability: number;
  influence: number;
  sovereignty: number;
  diplomatic: number;
  military: number;
  composite: number;
}
```

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database tables (migration 032) | Applied locally | NOT pushed to production |
| Materialized views (migration 031) | Applied locally | NOT pushed to production |
| Backend routers (3) | Complete | epochs, operatives, scores |
| Backend services (5) | Complete | epoch, operative, scoring, battle_log, game_mechanics |
| Frontend components (5) | Complete | Command center, wizard, deploy modal, leaderboard, battle log |
| Frontend API service | Complete | 27 methods covering all endpoints |
| TypeScript types | Complete | 12 interfaces + 3 union types |
| i18n (EN + DE) | Complete | 1322 total strings |
| Public API endpoints (8) | Complete | Spectator access to leaderboard, battle log, epoch info |
| Production deployment | Pending | Migrations not pushed, code not deployed |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| `22_GAME_SYSTEMS.md` | Full game design spec — all 8 systems with formulas, cross-system interactions |
| `20_RELATIONSHIPS_ECHOES_MAP.md` | Agent relationships + event echoes (Bleed mechanic) — feeds into scoring |
| `21_EMBASSIES.md` | Embassy architecture — required channel for operative deployment |
| `concept.md` | Multiverse lore — Cartographers, the Bleed, the Convergence |
| `GAME_DESIGN_DOCUMENT.md` | Comprehensive game design document for external game designers |
