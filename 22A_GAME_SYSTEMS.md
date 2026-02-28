# Game Systems Design — Mechanically Meaningful Attributes

## Context

The metaverse.center platform has ~160 editable parameters across agents, buildings, events, zones, streets, embassies, relationships, and echoes. Currently most of these are **decorative** — they feed into AI generation prompts but don't mechanically influence each other or the simulation state. The user (acting as game designer / lore director) wants a comprehensive concept where **every attribute has tangible influence** on the simulation, with info bubbles explaining effects and new UI surfaces displaying computed metrics.

This is a **design document / spec**, not an implementation plan. It defines the game systems, their interactions, and the UI surfaces needed. Implementation phases are outlined at the end.

---

## I. Core Design Philosophy

**"Every number tells a story, every story changes a number."**

The simulation isn't a passive database — it's a living organism where agent skills affect building function, building condition shapes zone stability, zone stability gates event severity, and events ripple across the multiverse through embassy channels. The player (simulation admin) is a **demiurge**: every edit is an act of worldbuilding with consequences that cascade through interconnected systems.

**Four Laws:**
1. **No orphan attributes** — every editable field influences at least one computed metric
2. **Bidirectional influence** — entities affect each other (agents shape buildings, buildings shape agents)
3. **Cross-simulation bleed is earned** — multiverse influence scales with diplomatic investment and event magnitude
4. **Tension through asymmetry** — every offensive capability has a defensive counter; every resource spent abroad is a resource not spent at home

---

## II. Eight Core Systems

Systems 1–5 are the **simulation economy** (always active, PvE). Systems 6–8 are the **competitive layer** (active only during Epochs, PvP).

### System 1: Staffing Economy

**Concept:** Buildings need agents with the right professions to function. An understaffed hospital can't heal; an overstaffed tavern wastes talent. Agent qualifications determine effectiveness, not just presence.

**Inputs:**
| Field | Entity | Current State |
|-------|--------|---------------|
| `population_capacity` | Building | Editable (number input) |
| `building_type` | Building | Editable (taxonomy dropdown) |
| `professions` | Agent | Editable via separate UI (qualification_level 1-10, specialization) |
| `building_condition` | Building | Editable (taxonomy: good/moderate/poor/ruined) |
| `profession_requirements` | Building | Exists in schema, not exposed in UI |

**Computed Metrics:**
- **Staffing Ratio** = assigned agents / population_capacity (0-100%+)
  - < 50% → "Critically Understaffed" (red)
  - 50-80% → "Understaffed" (amber)
  - 80-120% → "Operational" (green)
  - > 120% → "Overcrowded" (blue)
- **Qualification Match** = avg(qualification_level of matching professions) / required qualification
  - Uses `profession_requirements` on building + `professions` on assigned agents
  - Unqualified agents count as 0.3 weight; qualified at full weight
- **Building Readiness** = staffing_ratio × qualification_match × condition_factor
  - `condition_factor`: good=1.0, moderate=0.75, poor=0.5, ruined=0.2
  - This is the **master metric** — a building with great staff but ruined condition still barely functions

**Downstream Effects:**
- Building Readiness feeds into **Zone Stability** (System 2)
- Understaffed critical buildings (hospitals, watchtowers, power plants) reduce zone `security_level`
- AI generation uses readiness: low-readiness buildings get grimmer descriptions, desperate staff reactions
- Event generation biased toward building types with low readiness (crises emerge from neglect)

---

### System 2: District Health

**Concept:** Zones have a measurable health score based on their buildings' readiness, security level, and population pressure. Healthy districts attract events of opportunity; sick districts attract disasters.

**Inputs:**
| Field | Entity | Current State |
|-------|--------|---------------|
| `zone_type` | Zone | Set in migrations, not editable in UI |
| `security_level` | Zone | Set in migrations, not editable in UI |
| `population_estimate` | Zone | Not editable |
| Building Readiness scores | Buildings in zone | Computed (System 1) |
| Events in zone | Events with matching `location` | Existing |

**Computed Metrics:**
- **Infrastructure Score** = avg(Building Readiness) across all buildings in zone
  - Weighted by building_type criticality:
    - Critical (hospital, power, water, barracks): weight 2.0
    - Important (market, school, government): weight 1.5
    - Standard (residential, workshop, tavern): weight 1.0
    - Luxury (theater, garden, shrine): weight 0.5
- **Security Factor** = taxonomy mapping:
  - fortress/maximum → 1.0, high → 0.85, guarded → 0.7, moderate → 0.55, low → 0.4, lawless → 0.2, contested → 0.3
- **Event Pressure** = count of impact_level ≥ 6 events in last 30 days in this zone / 10
  - Capped at 1.0 — represents accumulated stress
- **Zone Stability** = (infrastructure_score × 0.5) + (security_factor × 0.3) - (event_pressure × 0.2)
  - Range: 0.0–1.0
  - < 0.3 → "Critical" — zone is failing, cascading crises likely
  - 0.3–0.5 → "Unstable" — one more shock could tip it
  - 0.5–0.7 → "Functional" — holding together
  - 0.7–0.9 → "Stable" — thriving
  - > 0.9 → "Exemplary" — model district

**Downstream Effects:**
- Zone Stability is the **primary input** for AI event generation — low-stability zones generate crisis events
- Affects bleed: events from unstable zones carry higher `echo_strength` (desperate reality bleeds louder)
- Ambassador effectiveness: ambassadors stationed in unstable zones have diminished diplomatic influence
- City-level aggregate: avg(zone_stability) across all zones = **Simulation Health** (displayed on dashboard)

---

### System 3: Diplomatic Influence

**Concept:** Embassies aren't just decorative links — they're channels of power. An embassy with qualified ambassadors, active bleed vectors, and well-maintained buildings projects more influence than a neglected outpost.

**Inputs:**
| Field | Entity | Current State |
|-------|--------|---------------|
| `bleed_vector` | Embassy | Editable (7 options) |
| `status` | Embassy | Lifecycle transitions |
| `embassy_metadata.ambassador_*` | Embassy | Ambassador agent assignment |
| Ambassador agent's `character`, `background`, profession | Agent | Editable |
| Embassy building's `building_condition`, readiness | Building | Computed (System 1) |
| `strength` | SimulationConnection | Editable (0-1 float) |
| `bleed_vectors[]` | SimulationConnection | Array of active channels |

**Computed Metrics:**
- **Embassy Effectiveness** (per embassy) =
  - `building_health` (avg readiness of both embassy buildings): 0-1
  - `ambassador_quality` (avg of: agent has profession matching 'diplomat'? + character length as proxy for depth + relationship count): 0-1
  - `vector_alignment` (does embassy's bleed_vector appear in connection's bleed_vectors[]?): 0 or 1
  - **Formula:** building_health × 0.4 + ambassador_quality × 0.4 + vector_alignment × 0.2
- **Diplomatic Reach** (per simulation) = sum(embassy_effectiveness) across all active embassies
  - Simulations with higher reach have stronger echo generation (echo_strength multiplier)
  - Displayed on Cartographer's Map as line thickness between nodes
- **Cultural Export** = count of completed outbound echoes in last 30 days
  - High export = this simulation's events shape other worlds
- **Cultural Import** = count of inbound completed echoes
  - High import = this simulation is being shaped by others

**Downstream Effects:**
- Diplomatic Reach modifies `echo_strength` on outbound echoes (more embassies = louder voice)
- Embassy Effectiveness gates which bleed vectors actually function (effectiveness < 0.3 → embassy is dormant)
- Ambassador agents gain narrative weight in AI generation (their character traits color the bleed)
- Map visualization: line thickness (reach), line color (dominant bleed vector), node glow intensity (stability)

---

### System 4: Crisis & Opportunity Engine

**Concept:** Events aren't random — they emerge from system state. Low zone stability generates crises; high readiness generates opportunities. The `impact_level` a user sets determines how far the event ripples.

**Inputs:**
| Field | Entity | Current State |
|-------|--------|---------------|
| `impact_level` | Event | Editable (1-10 range slider) |
| `event_type` | Event | Editable (taxonomy) |
| `tags` | Event | Editable (freeform array) |
| `location` | Event | Editable (freeform text) |
| Zone Stability | Zone | Computed (System 2) |
| Agent Relationships | AgentRelationship | intensity, type |

**Event Ripple Mechanics:**
- **Local Ripple Radius** = `impact_level` determines how many zones are affected:
  - 1-3: Only the event's zone
  - 4-6: Event's zone + adjacent zones (same city)
  - 7-8: Entire city
  - 9-10: All cities in simulation
- **Relationship Cascade** = events involving an agent cascade to related agents:
  - `intensity` ≥ 7 relationships: affected agent generates a reaction regardless of `impact_level`
  - `intensity` 4-6: reaction only if `impact_level` ≥ 5
  - `intensity` 1-3: reaction only if `impact_level` ≥ 8
- **Bleed Threshold** = existing `bleed_min_impact` (default 8) but modified by:
  - Zone Stability < 0.3: threshold reduced by 1 (desperate realities bleed easier)
  - Embassy Effectiveness > 0.8 on the channel: threshold reduced by 1
  - Both can stack: minimum threshold floor of 5

**Tags as Triggers:**
- Tags matching a bleed_vector name (e.g., "commerce", "memory") increase echo_strength by 0.2 for that vector
- Tags matching an agent's `system` attract that agent's attention (reaction probability increased)
- Tags matching a building_type trigger building-specific consequences (e.g., tag "fire" + building_type "residential" → condition degrades)

**Downstream Effects:**
- High-impact events in unstable zones are the primary source of cross-simulation bleed
- Events modify building_condition (destructive events: random buildings in zone degrade one step)
- Events with tag matching relationship_type generate relationship-intensity changes (rivals become enemies during crises)
- AI generation incorporates zone stability + building readiness + relationship graph into event narratives

---

### System 5: Bleed Permeability

**Concept:** The multiverse isn't equally permeable everywhere. Each simulation has a bleed profile shaped by its embassies, zone stability, and the thematic alignment of its events.

**Inputs:**
| Field | Entity | Current State |
|-------|--------|---------------|
| `bleed_enabled` | Settings (world) | Editable toggle |
| `bleed_min_impact` | Settings (world) | Editable (1-10) |
| `bleed_max_depth` | Settings (world) | Editable (1-3) |
| `bleed_strength_decay` | Settings (world) | Editable (0-1, stored but unused) |
| `bleed_auto_approve` | Settings (world) | Editable toggle |
| `strength` | SimulationConnection | Editable (0-1) |
| `bleed_vectors[]` | SimulationConnection | Array of active channels |
| Embassy Effectiveness | Embassy | Computed (System 3) |
| Zone Stability (simulation avg) | Zone | Computed (System 2) |

**Computed Metrics:**
- **Bleed Permeability** (per simulation) =
  - `bleed_enabled` ? 1.0 : 0.0 (master gate)
  - × avg(connection.strength) across active connections
  - × (1 - (avg_zone_stability × 0.3)) → unstable worlds bleed MORE (reality fractures)
  - × diplomatic_reach_factor (more embassies = more channels open)
- **Echo Cascade Probability** = base_probability × source_permeability × target_permeability × connection_strength
  - This replaces the current binary threshold check with a **probabilistic** system
  - Events meeting `bleed_min_impact` always create echoes; events 1-2 below threshold have a probability proportional to permeability
- **Bleed Strength Decay** = `bleed_strength_decay` ^ `echo_depth`
  - Finally gives meaning to the stored-but-unused `bleed_strength_decay` setting
  - Depth 1: full strength × decay^1, Depth 2: × decay^2, Depth 3: × decay^3

**Vector Specialization:**
Each of the 7 bleed vectors responds to specific entity attributes:

| Vector | Resonates With | Effect |
|--------|---------------|--------|
| **Commerce** | Buildings with type: market/workshop/warehouse + events tagged "trade"/"economy" | Echoed events focus on economic disruption/opportunity |
| **Language** | Agents with high qualification_level in communication/diplomatic professions | Echo narratives adopt linguistic patterns from source simulation |
| **Memory** | Events with impact_level ≥ 9 (traumatic/monumental) | Echoes manifest as déjà vu, prophetic dreams, or false memories |
| **Resonance** | Agent relationships with intensity ≥ 8 | Parallel relationships form in target simulation |
| **Architecture** | Buildings with construction_year + style attributes | Buildings in target zone develop architectural elements from source |
| **Dream** | Agents with "mystical"/"psionic"/"spiritual" in character/background | Echoes arrive as visions rather than events; subjective, unreliable |
| **Desire** | Events with tags matching unfulfilled needs (low-readiness buildings) | Echo manifests as yearning; target simulation starts wanting what source has |

---

### System 6: Epochs — Competitive Time Structure

**Concept:** An Epoch is a time-limited competitive season. During an Epoch, simulation owners become active players competing (or allying) for dominance. Outside of Epochs, the simulation economy (Systems 1–5) still runs, but there are no scores and no offensive actions.

**Epoch Lifecycle:**
```
EPOCH: "The First Convergence" (configurable, e.g. 14 days)
├── Foundation Phase (first ~20%, e.g. 3 days)
│   • +50% Resonance Point income
│   • No offensive operative missions allowed
│   • Build infrastructure, staff buildings, establish embassies
│   • Form alliances (teams)
│
├── Competition Phase (middle ~65%, e.g. 9 days)
│   • Full mechanics: operatives, bleed weaponization, sabotage
│   • Alliances locked (no new teams, but members can betray)
│   • Score snapshots taken every cycle
│
├── Reckoning Phase (final ~15%, e.g. 2 days)
│   • Bleed permeability doubled across all connections
│   • All bleed thresholds reduced by 2
│   • Echo cascade depth +1 (max 4 during Reckoning)
│   • Dramatic escalation — everything gets chaotic
│
└── Scoring & Resolution
    • Final scores computed (average across all cycle snapshots)
    • Winner declared (individual or team)
    • Epoch archived — scores preserved as historical record
    • Operatives recalled, temporary effects reset
```

**Resonance Points (RP) — The Action Economy:**
- Each simulation receives RP at the start of each **cycle** (configurable, default: every 8 hours = 3 cycles/day)
- Default allocation: **10 RP per cycle**, cap: **30 RP** (prevents hoarding across 3+ cycles)
- Foundation Phase: **15 RP per cycle** (50% bonus)
- RP is spent on:
  - Deploying operatives (3–8 RP depending on type)
  - Triggering deliberate bleed events (2 RP)
  - Repairing buildings damaged by sabotage (1 RP per condition step)
  - Boosting embassy effectiveness temporarily (2 RP, +0.2 for one cycle)
  - Counter-intelligence sweep (3 RP, reveals active enemy operatives in your simulation)
- **Unspent RP carries over** up to the cap — but excess is lost (use it or lose it)
- RP is **not transferable** between allied simulations (prevents kingmaking)

**Cycle Resolution:**
At each cycle boundary:
1. RP allocated to all participating simulations
2. Queued operative missions resolve (success/failure determined)
3. Building condition changes from sabotage applied
4. Echo cascades triggered
5. Score snapshot taken
6. Notifications sent to all players

**Epoch Configuration (set by epoch creator):**
| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `duration_days` | 14 | 3–60 | Total epoch length |
| `cycle_hours` | 8 | 2–24 | Hours between cycle resolutions |
| `rp_per_cycle` | 10 | 5–25 | Base RP allocation |
| `rp_cap` | 30 | 15–75 | Maximum stored RP |
| `foundation_pct` | 20 | 10–30 | % of duration for foundation phase |
| `reckoning_pct` | 15 | 10–25 | % of duration for reckoning phase |
| `max_team_size` | 3 | 2–8 | Max simulations per alliance |
| `allow_betrayal` | true | bool | Whether alliance members can attack each other |

---

### System 7: Operatives — Covert Warfare

**Concept:** Operatives are specialized agents deployed through embassies to influence rival simulations. They're real agents in the database — with portraits, personalities, and backstories — but they serve a military/intelligence function. **Embassies are the ONLY channel for deploying operatives** — you cannot attack a simulation you have no embassy with. This creates a strategic tension: embassies enable both diplomacy AND warfare.

**Operative Types:**

| Type | Cost (RP) | Deploy Time | Mission Duration | Effect |
|------|-----------|-------------|------------------|--------|
| **Spy** | 3 RP | Instant | 3 cycles | Reveals target simulation's health metrics, zone stability scores, building readiness, and active operatives for the duration |
| **Saboteur** | 5 RP | 1 cycle | Single action | Degrades one target building's condition by one step (good→moderate→poor→ruined). Target chosen by attacker. |
| **Propagandist** | 4 RP | 1 cycle | 2 cycles | Generates a negative event (impact 6-8) in target simulation. AI-generated narrative themed to the embassy's bleed vector. |
| **Assassin** | 8 RP | 2 cycles | Single action | "Wounds" a target agent — reduces their relationship intensities by 2 and removes ambassador status for 3 cycles. Does NOT delete the agent. |
| **Guardian** | 3 RP | Instant | Permanent (while deployed) | Passive counter-intelligence. Each guardian in a zone increases detection probability for all enemy operatives in that zone by 20%. Guardians can be deployed to your OWN simulation only. |
| **Infiltrator** | 6 RP | 2 cycles | 3 cycles | Temporarily reduces a target embassy's effectiveness by 50%. Can target embassies between ANY two simulations (disrupting rivals' alliances). |

**Operative Agents:**
- Operatives are agents with an `operative_type` field (spy/saboteur/propagandist/assassin/guardian/infiltrator)
- They can be **existing agents** reassigned as operatives, or **new agents** created specifically for the role
- An agent assigned as operative is **unavailable for domestic staffing** — they leave their building post. This creates the core trade-off: military power costs domestic stability.
- Operatives have full agent attributes (name, character, background, profession) which influence their effectiveness:
  - Qualification level in matching profession (spy → "intelligence", saboteur → "demolition", etc.) adds success probability
  - Character traits matching the mission type add narrative richness to mission reports

**Success Probability:**
```
base_probability = 0.5
+ operative_qualification × 0.05  (0-10 scale → +0 to +0.50)
- target_zone_security × 0.05    (security_level maps to 0-10 → -0 to -0.50)
- guardian_presence × 0.20        (per guardian in zone → -0.20 each)
+ embassy_effectiveness × 0.15   (the embassy used for deployment → +0 to +0.15)

Final probability clamped to [0.05, 0.95]
```

**Failure Consequences:**
- **Undetected failure**: Mission simply fails. No consequences. Operative returns.
- **Detected failure** (probability: 1 - success_probability when failing):
  - The operative is **captured** (removed from play for remainder of epoch)
  - A "Diplomatic Incident" event is auto-generated in BOTH simulations (impact 7)
  - Embassy effectiveness between the two simulations reduced by 0.3 for 3 cycles
  - The attacking player is revealed (breaks covert status)

**Embassy Requirement — Strategic Implications:**
- You MUST have an active embassy with a target to deploy operatives against them
- Dissolving an embassy **immediately recalls all your operatives** through that channel
- An enemy can dissolve their side of the embassy to cut off your operative pipeline
- But dissolving an embassy also cuts your OWN ability to project influence (bleed, cultural export)
- **Strategic choice**: Keep embassy open (offense + defense possible) vs. close it (safe but isolated)

---

### System 8: Scoring & Victory

**Concept:** Five scoring dimensions reward different playstyles. A simulation can win through cultural dominance, military supremacy, diplomatic mastery, or balanced excellence. Teams share a combined score.

**Five Score Dimensions:**

#### 1. Stability Score (Defensive / Builder)
- **What it rewards:** Keeping your simulation healthy and functional
- **Formula:** avg(zone_stability) across all cycles in the epoch
- **Range:** 0–100 (zone_stability × 100)
- **Strategy:** Staff buildings, maintain conditions, minimize event damage
- **Counter:** Enemy saboteurs degrade buildings; propagandists create destabilizing events

#### 2. Influence Score (Cultural / Soft Power)
- **What it rewards:** Shaping other simulations through bleed
- **Formula:** sum(echo_strength × (1 if completed, 0 otherwise)) for all outbound echoes during epoch
- **Range:** 0–∞ (uncapped, relative to other players)
- **Strategy:** Create high-impact events, maintain effective embassies, align bleed vectors
- **Counter:** Target can increase bleed_min_impact, deploy infiltrators to weaken your embassies

#### 3. Sovereignty Score (Defensive / Isolationist)
- **What it rewards:** Resisting foreign influence and maintaining narrative independence
- **Formula:** 100 × (1 - (inbound_echo_impact / total_event_impact))
  - If no events: 100 (perfect sovereignty by default)
  - inbound_echo_impact = sum of impact_levels of events with `data_source = 'bleed'`
  - total_event_impact = sum of impact_levels of ALL events
- **Range:** 0–100
- **Strategy:** Strengthen bleed defenses, deploy guardians, maintain high zone stability (stable zones resist bleed)
- **Counter:** Enemy propagandists inject foreign events; high-impact echoes from unstable neighbors

#### 4. Diplomatic Score (Alliance / Network)
- **What it rewards:** Building and maintaining a strong diplomatic network
- **Formula:** sum(embassy_effectiveness) × (1 + 0.1 × active_alliance_count)
- **Range:** 0–∞ (scales with embassy count and alliance health)
- **Strategy:** Establish embassies, assign skilled ambassadors, maintain embassy buildings
- **Counter:** Infiltrators reduce embassy effectiveness; captured operatives cause diplomatic incidents

#### 5. Military Score (Offensive / Aggressive)
- **What it rewards:** Successful covert operations against rivals
- **Formula:** sum(mission_value) - sum(failure_penalty)
  - Successful spy: +2, saboteur: +5, propagandist: +3, assassin: +8, infiltrator: +4
  - Failed (undetected): 0
  - Failed (detected/captured): -3 (any type)
- **Range:** -∞ to +∞ (high risk, high reward)
- **Strategy:** Deploy qualified operatives through effective embassies against weak targets
- **Counter:** Deploy guardians, maintain high zone security, close compromised embassies

**Composite Score:**
- Default weights: Stability 25%, Influence 20%, Sovereignty 20%, Diplomatic 15%, Military 20%
- Weights configurable per epoch (epoch creator can emphasize specific playstyles)
- Normalized across participants: each dimension rescaled to 0–100 relative to highest scorer in that dimension
- **Final Score** = weighted sum of normalized dimensions

**Team Scoring:**
- Team score = sum of member scores (encourages balanced teams)
- Alliance bonus: +5% to all dimensions for each active alliance member
- **Betrayal mechanic** (if `allow_betrayal = true`):
  - An allied simulation can deploy operatives against allies
  - If detected: alliance immediately dissolves, betrayer gets -20% to Diplomatic Score for remainder of epoch
  - If undetected: normal operative effects apply, alliance remains intact (but the betrayer knows...)
  - Strategic tension: betrayal is high-risk but can eliminate a competitor from within

**Victory Conditions:**
- **Overall Victory:** Highest composite score at epoch end
- **Dimension Titles** (bragging rights): Highest in each individual dimension earns a title:
  - Stability → "The Unshaken"
  - Influence → "The Resonant"
  - Sovereignty → "The Sovereign"
  - Diplomatic → "The Architect"
  - Military → "The Shadow"
- **Team Victory:** Highest team composite score (if teams exist)

**Leaderboard:**
- Live during epoch (updated each cycle)
- Shows: rank, simulation name, composite score, per-dimension bars, team affiliation
- Historical: past epochs with final standings, preserved permanently

---

## III. Cross-System Interaction Matrix (Updated with Competitive Layer)

```
                    Staff  District  Diplo   Crisis  Bleed   Epochs  Operatives  Scoring
                    Econ   Health    Infl    Engine  Perm    Time    Warfare     Victory
Staffing Economy     —      ★★★       ★       ★★      ·       ·       ★★★         ★★
District Health     ★★       —        ★★      ★★★     ★★      ·       ★★          ★★★
Diplomatic Infl      ·      ★★        —        ★      ★★★     ·       ★★★         ★★
Crisis Engine       ★★      ★★★       ★★       —      ★★★     ★       ★           ★★
Bleed Permeability   ·       ★        ★★      ★★★      —      ★★      ★           ★★★
Epochs               ·       ·         ·       ★★      ★★      —      ★★★         ★★★
Operatives          ★★★     ★★★       ★★       ★★      ★      ★★★      —          ★★★
Scoring              ·       ·         ·        ·       ·      ★★★      ★           —

★★★ = strong influence, ★★ = moderate, ★ = weak, · = negligible
```

**Key feedback loops (PvE, always active):**
1. **Death Spiral:** Low staffing → low readiness → low zone stability → crisis events → building damage → even lower readiness
2. **Diplomatic Amplifier:** Good embassies → high reach → echo strength multiplier → more cultural export → narrative influence
3. **Bleed Cascade:** Unstable zone → low bleed threshold → events bleed easier → target zone destabilized → THEIR events bleed back
4. **Recovery Loop:** High-readiness buildings → stable zone → opportunity events → positive narratives → attract agents

**Key feedback loops (PvP, epoch-only):**
5. **Guns vs. Butter:** Deploying operatives abroad removes agents from domestic staffing → weakens YOUR zone stability → lowers YOUR stability score. Aggressive play has a domestic cost.
6. **Embassy Paradox:** Embassies enable BOTH diplomacy (scoring) AND warfare (operatives). Closing an embassy stops enemy operatives but also kills your own offensive capability and diplomatic score.
7. **Sabotage Cascade:** Successful sabotage → building degraded → zone unstable → bleed threshold lowered → YOUR negative propagandist events bleed BACK to you through other connections. Aggression can backfire.
8. **Detection Spiral:** Failed covert op → diplomatic incident → embassy effectiveness drops → future operations have lower success probability → more failures. Reckless aggression self-destructs.
9. **Betrayal Gambit:** Ally in secret → build trust/embassies → strike from within. But detection destroys diplomatic score AND alliance. High reward, catastrophic risk.

---

## IV. User Roles & Permissions per System

The existing role hierarchy is: **Owner** > **Editor** > **Viewer** (per simulation via `simulation_members`). The competitive layer adds platform-level roles.

### Role Matrix

| Capability | Viewer | Editor | Owner | Epoch Creator |
|------------|--------|--------|-------|---------------|
| View simulation health / metrics | yes | yes | yes | yes |
| View building readiness / zone stability | yes | yes | yes | yes |
| View leaderboard / scores | yes | yes | yes | yes |
| Edit agents, buildings, events | — | yes | yes | — |
| Assign agents to buildings | — | yes | yes | — |
| Manage embassies | — | — | yes | — |
| Deploy operatives (during epoch) | — | — | yes | — |
| Spend Resonance Points | — | — | yes | — |
| Approve/reject incoming echoes | — | — | yes | — |
| Form/leave alliances | — | — | yes | — |
| Configure bleed/world settings | — | — | yes | — |
| Create an epoch | — | — | yes* | yes |
| Join an epoch with simulation | — | — | yes | — |
| Configure epoch parameters | — | — | — | yes |
| End epoch early / pause epoch | — | — | — | yes |

*Any simulation owner can create an epoch (becoming the epoch creator).

### Epoch Creator Role
- A **new platform-level role** (not per-simulation)
- The user who creates an epoch becomes its administrator
- Can configure epoch parameters, pause/resume, end early
- Cannot participate with their own simulation (referee model) **OR** can participate (player-host model) — configurable per epoch
- In larger deployments, could be a dedicated "Game Master" user

### Spectator Mode
- Any authenticated user (even without simulation ownership) can view:
  - Epoch leaderboard
  - Public simulation health metrics
  - Cartographer's Map with live competitive data
  - Battle log (anonymized operative actions with narrative descriptions)
- This supports an audience / community around competitive play

---

## V. Interface Design per System

### V.A. Simulation Health Dashboard

**Route:** `/simulations/{slug}/health`
**Nav position:** Between Lore and Agents (second tab)
**Accessible to:** All roles (read-only for viewers)

```
┌─────────────────────────────────────────────────────────────┐
│  ░░ SIMULATION HEALTH ░░          Overall: 0.72 ████████░░  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ ZONE STABILITY ──────────────┐  ┌─ STAFFING OVERVIEW ──┐│
│  │                                │  │                       ││
│  │  Industrial Dist.              │  │  23/31 buildings      ││
│  │  ████████████░░░  0.78  Stable │  │  staffed              ││
│  │                                │  │                       ││
│  │  Sacred Quarter                │  │  Avg readiness: 0.68  ││
│  │  ████████░░░░░░░  0.55  Funct. │  │                       ││
│  │                                │  │  ⚠ CRITICAL:          ││
│  │  Market Ward                   │  │  • Hospital    32%    ││
│  │  █████████████░░  0.91  Exemp. │  │  • Watchtower   0%    ││
│  │                                │  │                       ││
│  │  Outer Wastes                  │  │  ▲ OVERCROWDED:       ││
│  │  ████░░░░░░░░░░░  0.29  Crit! │  │  • Tavern     145%    ││
│  │                                │  │                       ││
│  └────────────────────────────────┘  └───────────────────────┘│
│                                                               │
│  ┌─ DIPLOMACY ───────────────────┐  ┌─ BLEED ACTIVITY ──────┐│
│  │  Reach: 2.4                   │  │  Permeability: 0.61   ││
│  │  Active embassies: 3          │  │                       ││
│  │                               │  │  Outbound echoes:  7  ││
│  │  ● Capybara Kingdom    0.82   │  │  Inbound echoes:   4  ││
│  │  ○ Station Null         0.61   │  │                       ││
│  │  ○ Speranza            0.34   │  │  Cascade risk: LOW    ││
│  │                               │  │  ░░░░░░░░░░░░░░░░░░░ ││
│  └───────────────────────────────┘  └───────────────────────┘│
│                                                               │
│  ┌─ RECENT EVENTS (impact ≥ 7) ──────────────────────────────┐│
│  │  ⚡ The Spire Collapse   impact:9  Sacred Quarter          ││
│  │    → Echoed to Station Null via memory vector              ││
│  │  ⚡ Market Fire           impact:7  Market Ward             ││
│  │    → 2 buildings degraded (Grain Store: good→moderate)     ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Interaction details:**
- Zone bars are **clickable** → expands to show: infrastructure score, security factor, event pressure breakdown, list of buildings with individual readiness
- Embassy entries are **clickable** → navigates to embassy detail / partner simulation
- Recent events are **clickable** → opens event detail panel
- All values update on page load (no real-time — materialized views refresh on data changes)
- Color scheme follows simulation theme tokens

---

### V.B. Building Readiness (on existing BuildingCard + BuildingDetailsPanel)

**On BuildingCard** (compact):
```
┌────────────────────────────┐
│  [building image]           │
│                             │
│  The Iron Hospital          │
│  hospital · good            │
│  ┌──────────────────────┐   │
│  │ ████░░░░░░  32%  ⚠  │   │  ← readiness bar, color-coded
│  └──────────────────────┘   │
└────────────────────────────┘
```

**On BuildingDetailsPanel** (expanded, in a new "Operations" section):
```
┌─ OPERATIONS ──────────────────────────────┐
│                                            │
│  Readiness    ████░░░░░░  0.32  CRITICAL   │
│                                            │
│  ┌─ Breakdown ─────────────────────────┐   │
│  │  Staffing:      3 / 10  (30%)       │   │
│  │  Qualification: 0.65               │   │
│  │  Condition:     Good (×1.0)         │   │
│  │                                     │   │
│  │  Required:                          │   │
│  │  • Doctor (2 needed, 1 assigned)    │   │
│  │  • Nurse (3 needed, 1 assigned)     │   │
│  │  • Porter (5 needed, 1 assigned)    │   │
│  │                                     │   │
│  │  Contributing to: Sacred Quarter    │   │
│  │  Zone stability impact: -0.12       │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

### V.C. Epoch Command Center

**Route:** `/epoch` (platform-level, like `/multiverse`)
**Accessible to:** All authenticated users (owners can interact, others spectate)

#### Lobby View (no active epoch):
```
┌─────────────────────────────────────────────────────────────┐
│  ░░ EPOCH COMMAND CENTER ░░                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  No active epoch.                                             │
│                                                               │
│  [+ Create New Epoch]                (owner-only button)      │
│                                                               │
│  ┌─ PAST EPOCHS ─────────────────────────────────────────────┐│
│  │  #3  "The Reckoning"     14d    Winner: Velgarien  (72.3) ││
│  │  #2  "Convergence War"    7d    Winner: Team Alpha (68.1) ││
│  │  #1  "First Contact"      3d    Winner: Capybara   (81.0) ││
│  └───────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Active Epoch View:
```
┌─────────────────────────────────────────────────────────────┐
│  ░░ "THE CONVERGENCE" ░░        Day 7/14 · COMPETITION PHASE │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  Next cycle: 4h 23m                  RP: 18/30 ●●●●●●●●●○○○  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ LEADERBOARD ─────────────────────────────────────────────┐│
│  │ #  Simulation        Score  Stab Infl Sovr Dipl Milt      ││
│  │ 1  Velgarien          72.3  ████ ███░ ████ ██░░ ███░      ││
│  │ 2  Capybara Kingdom   68.1  ████ ██░░ ███░ ████ ██░░      ││
│  │ 3  Station Null       54.7  ██░░ ████ ██░░ █░░░ ████      ││
│  │ 4  Speranza          41.2  █░░░ ██░░ ███░ ██░░ █░░░      ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ YOUR OPERATIONS ─────────┐  ┌─ INTELLIGENCE ────────────┐│
│  │                            │  │                            ││
│  │  Active operatives: 3      │  │  Incoming threats: 2       ││
│  │  ● Spy in Station Null     │  │  ⚠ Unknown operative in   ││
│  │    Status: Active (2/3)    │  │    Sacred Quarter          ││
│  │  ● Saboteur → Speranza    │  │  ⚠ Propaganda event        ││
│  │    Status: Deploying (1/1) │  │    detected (Market Ward)  ││
│  │  ● Guardian in Market Ward │  │                            ││
│  │    Status: Vigilant        │  │  Last sweep: 2 cycles ago  ││
│  │                            │  │  [Sweep Now] (3 RP)        ││
│  │  [Deploy Operative]        │  │                            ││
│  └────────────────────────────┘  └────────────────────────────┘│
│                                                               │
│  ┌─ BATTLE LOG (last 24h) ───────────────────────────────────┐│
│  │  ⚔ Your saboteur damaged "Clockwork Forge" in Speranza    ││
│  │  🛡 Guardian detected spy in Industrial District (captured)││
│  │  💀 Your spy in Capybara was detected — diplomatic incident││
│  │  📢 Propagandist generated "The False Prophecy" in S.Null  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ ALLIANCES ───────────────┐  ┌─ QUICK ACTIONS ───────────┐│
│  │  Team "The Accord"        │  │  [Deploy Operative]  3-8 RP││
│  │  • Velgarien (you)        │  │  [Boost Embassy]     2 RP  ││
│  │  • Capybara Kingdom       │  │  [Repair Building]   1 RP  ││
│  │                           │  │  [Trigger Bleed]     2 RP  ││
│  │  [Invite to Alliance]     │  │  [Counter-Intel]     3 RP  ││
│  └───────────────────────────┘  └────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Deploy Operative Modal (wizard):
```
Step 1: Select Agent
┌──────────────────────────────────────────┐
│  Choose an agent to deploy as operative   │
│                                           │
│  ⚠ This agent will leave their current    │
│    building post (The Iron Hospital)      │
│                                           │
│  [Avatar] Elena Voss                      │
│  Profession: Intelligence (qual. 8)       │
│  Current post: The Iron Hospital          │
│  Influence score: 7.2                     │
│                                           │
│  [dropdown: select agent ▼]               │
└──────────────────────────────────────────┘

Step 2: Mission Type
┌──────────────────────────────────────────┐
│  [●] Spy (3 RP)         3 cycles         │
│  [ ] Saboteur (5 RP)    1 cycle deploy   │
│  [ ] Propagandist (4 RP) 2 cycles        │
│  [ ] Assassin (8 RP)    2 cycle deploy   │
│  [ ] Infiltrator (6 RP) 3 cycles         │
│                                           │
│  Success probability: 72%                 │
│  (qual. +0.40, security -0.15, emb. +0.12│
└──────────────────────────────────────────┘

Step 3: Target
┌──────────────────────────────────────────┐
│  Target simulation: [Station Null ▼]      │
│  Via embassy: [The Umbral Gate ▼]         │
│                                           │
│  Target zone: [Reactor Core ▼]            │
│  Target building: [Power Nexus ▼]  (sab.) │
│   — or —                                  │
│  Target agent: [Dr. Halcyon ▼]   (assn.)  │
│                                           │
│  Embassy effectiveness: 0.61              │
│  Zone security: guarded (-0.15)           │
│  Guardians present: 0                     │
│                                           │
│  Final success: 72%                       │
│  Cost: 5 RP (you have 18)                 │
│                                           │
│  [Cancel]              [Deploy] (5 RP)    │
└──────────────────────────────────────────┘
```

---

### V.D. Epoch Creation Wizard

**Route:** Modal from Epoch Command Center
**Accessible to:** Simulation owners

```
Step 1: Basic Info
┌──────────────────────────────────────────┐
│  Epoch Name: [The First Convergence    ] │
│  Duration:   [14] days                   │
│  Cycle interval: [8] hours               │
│                                           │
│  Foundation phase: [20]%  (2.8 days)      │
│  Reckoning phase:  [15]%  (2.1 days)     │
│  Competition phase: 65%   (9.1 days)      │
└──────────────────────────────────────────┘

Step 2: Economy
┌──────────────────────────────────────────┐
│  RP per cycle:  [10]  (foundation: 15)   │
│  RP cap:        [30]                      │
│  Max team size: [3]                       │
│  Allow betrayal: [✓]                     │
└──────────────────────────────────────────┘

Step 3: Score Weights
┌──────────────────────────────────────────┐
│  Stability:   ████████░░  25%             │
│  Influence:   ██████░░░░  20%             │
│  Sovereignty: ██████░░░░  20%             │
│  Diplomatic:  ████░░░░░░  15%             │
│  Military:    ██████░░░░  20%             │
│                           ───             │
│                           100%            │
│                                           │
│  [Balanced]  [Builder]  [Warmonger]       │
│  (presets)   (presets)  (presets)          │
└──────────────────────────────────────────┘

Step 4: Invite Participants
┌──────────────────────────────────────────┐
│  Open to all simulations: [✓]            │
│   — or —                                  │
│  Invite specific: [search simulations]    │
│                                           │
│  Min. participants: [2]                   │
│  Starts when minimum reached: [✓]        │
│                                           │
│  [Cancel]         [Create Epoch]          │
└──────────────────────────────────────────┘
```

---

### V.E. Enhanced Cartographer's Map (during Epochs)

The existing map gains competitive overlays during an active epoch:

```
┌─────────────────────────────────────────────────────────────┐
│  ░░ THE CARTOGRAPHER'S MAP ░░    "The Convergence" Day 7/14  │
│                                                               │
│            [Velgarien]──────────[Capybara Kingdom]            │
│             ╱  #1 72.3  ╲thick      #2 68.1     ╲           │
│            ╱               ╲                       ╲          │
│   [Station Null]────────────[Speranza]              │          │
│     #3 54.7    thin, red     #4 41.2                │          │
│                                                     │          │
│  Legend:                                            │          │
│  ● Line thickness = diplomatic reach                │          │
│  ● Line color = dominant bleed vector               │          │
│  ● Node glow speed = stability (fast = unstable)    │          │
│  ● Node size = simulation complexity                │          │
│  ● 🔴 = active operative deployed FROM this node    │          │
│  ● ⚠ = detected incoming operative                  │          │
│                                                               │
│  [Toggle: Competitive Overlay ON/OFF]                         │
└─────────────────────────────────────────────────────────────┘
```

**Tooltip on hover (during epoch):**
```
┌─ STATION NULL ──────────────────┐
│  Rank: #3 (54.7 pts)            │
│  Stability: 0.42 (Unstable)     │
│  Permeability: 0.78 (High)      │
│  Your operatives: 1 spy (active)│
│  Their operatives: 1 (detected) │
│  Embassy eff.: 0.61             │
│  Dominant vector: Memory        │
└──────────────────────────────────┘
```

---

### V.F. Notification System for Competitive Events

Competitive actions generate notifications (via existing `NotificationCenter`):

| Event | Recipient | Priority | Message |
|-------|-----------|----------|---------|
| Cycle resolved | All epoch participants | Normal | "Cycle 7 resolved. Your score: 72.3 (#1). RP: +10 (18/30)." |
| Operative deployed | Deploying player | Normal | "Agent Elena Voss deployed as Spy to Station Null." |
| Operative success | Deploying player | High | "Spy mission successful. Station Null health metrics revealed for 3 cycles." |
| Operative detected | Both players | Critical | "Diplomatic incident! Your saboteur was captured in Speranza." |
| Building sabotaged | Target player | Critical | "The Clockwork Forge was sabotaged! Condition: good → moderate." |
| Incoming propaganda | Target player | High | "Foreign propaganda event detected in Market Ward: 'The False Prophecy'." |
| Alliance formed | Team members | Normal | "Alliance 'The Accord' formed with Capybara Kingdom." |
| Alliance betrayal | Victim | Critical | "BETRAYAL: Capybara Kingdom attacked from within your alliance!" |
| Phase transition | All participants | High | "RECKONING PHASE begins. Bleed thresholds -2. Cascade depth +1." |
| Epoch ended | All participants | Critical | "Epoch 'The Convergence' ended. Winner: Velgarien (72.3 pts)." |

---

### V.G. Agent Operative Assignment UI (in AgentDetailsPanel)

When an epoch is active, agents gain an "Operative" section in their detail panel:

```
┌─ OPERATIVE STATUS ────────────────────────┐
│                                            │
│  [not deployed]                            │
│                                            │
│  Operative aptitude:                       │
│  • Spy:          72% (intelligence qual.8) │
│  • Saboteur:     45% (no demolition skill) │
│  • Propagandist: 68% (rhetoric qual.7)     │
│  • Assassin:     31% (no combat skill)     │
│  • Guardian:     55% (perception qual.5)   │
│                                            │
│  Currently posted: The Iron Hospital       │
│  ⚠ Deploying will reduce hospital          │
│    staffing from 30% to 20% (CRITICAL)     │
│                                            │
│  [Deploy as Operative]                     │
└────────────────────────────────────────────┘
```

If deployed:
```
┌─ OPERATIVE STATUS ────────────────────────┐
│                                            │
│  ⚔ DEPLOYED: Spy in Station Null          │
│  Via: The Umbral Gate (embassy)            │
│  Remaining: 2/3 cycles                     │
│  Status: Active — intel flowing            │
│                                            │
│  [Recall Agent] (returns next cycle)       │
└────────────────────────────────────────────┘
```

---

## VI. Info Bubbles for All Editable Fields

Info bubbles use the existing `_renderInfoBubble(text)` pattern (`.info-bubble` / `.info-bubble__icon` / `.info-bubble__tooltip` CSS). Each tooltip text explains the **mechanical effect** of the field.

### Agent Edit Modal

| Field | Info Bubble Text |
|-------|-----------------|
| **Name** | "The agent's identity. Used in relationship descriptions, event reactions, and embassy assignments." |
| **System** | "The faction or organization this agent belongs to. Events tagged with a matching system name will attract this agent's attention and increase reaction probability." |
| **Gender** | "Used in AI-generated text for pronouns and portrait generation." |
| **Character** | "Personality traits and behavioral patterns. Longer, more detailed descriptions produce richer AI reactions and relationship narratives. Agents with mystical/spiritual traits resonate with Dream bleed." |
| **Background** | "Origin story and life history. Feeds into AI generation for reactions, relationships, and echo narratives. Detailed backgrounds increase the agent's narrative weight in cross-simulation bleed." |
| **Portrait Description** | "Visual description used by the image AI. Does not affect game mechanics — purely aesthetic." |

### Building Edit Modal

| Field | Info Bubble Text |
|-------|-----------------|
| **Name** | "Building identifier. AI uses this for narrative flavor in events and descriptions." |
| **Type** | "Determines the building's function and staffing requirements. Critical types (hospital, power plant, barracks) have 2x weight in zone stability calculations. Matching bleed vectors (e.g., 'market' resonates with Commerce bleed)." |
| **Condition** | "Physical state of the building. Directly multiplies staffing effectiveness: Good x1.0, Moderate x0.75, Poor x0.5, Ruined x0.2. Destructive events can degrade condition. Low-condition buildings drag down zone stability." |
| **Capacity** | "Maximum population the building supports. The ratio of assigned agents to capacity determines staffing level. Understaffed critical buildings reduce zone security." |
| **Construction Year** | "Historical period. Feeds into AI image generation and lore. Buildings with explicit construction years resonate with Architecture bleed vector." |
| **Style** | "Architectural aesthetic. Affects AI image generation. When Architecture bleed transmits, this style may influence buildings in the target simulation." |
| **Description** | "Short functional summary (1-2 sentences). Used as context in AI image generation and event narratives." |

### Event Edit Modal

| Field | Info Bubble Text |
|-------|-----------------|
| **Title** | "Event headline. Preserved through bleed echoes — this is what agents in other simulations 'hear'." |
| **Type** | "Narrative category. Affects AI tone and which agents react. Different types trigger different relationship dynamics." |
| **Description** | "Full event narrative. Transformed by bleed vectors when echoing to other simulations (e.g., Commerce bleed rewrites through economic lens)." |
| **Date/Time** | "When the event occurred. Timeline ordering determines cause-and-effect chains. Recent high-impact events increase zone event pressure." |
| **Location** | "Where the event happened. Events are attributed to the matching zone for stability calculations. Zones with many high-impact events become unstable." |
| **Impact Level** | "How significant this event is (1-10). Determines ripple radius: 1-3 = local zone, 4-6 = adjacent zones, 7-8 = entire city, 9-10 = all cities. Events above the bleed threshold (default 8) can echo to connected simulations. Events in unstable zones or near effective embassies may bleed at lower thresholds." |
| **Tags** | "Freeform keywords. Tags matching a bleed vector name (commerce, memory, dream...) boost echo strength for that channel by 20%. Tags matching an agent's system increase their reaction probability. Tags matching a building type can trigger condition changes (e.g., 'fire' + 'residential')." |

### Embassy Create Modal (existing + enhanced)

| Field | Info Bubble Text |
|-------|-----------------|
| **Target Simulation** | "The partner world this embassy connects to. Each simulation pair can have multiple embassies with different bleed vectors." |
| **Target Building** | "The partner building that will house the embassy. Its condition and staffing affect embassy effectiveness. Well-maintained embassy buildings project stronger diplomatic influence." |
| **Bleed Vector** | "The thematic channel through which reality bleeds between worlds. Commerce: trade/economy events. Language: linguistic drift. Memory: traumatic echoes. Resonance: parallel relationships. Architecture: structural influence. Dream: subjective visions. Desire: yearning for what the other world has." |
| **The Question** | "The fundamental existential question this embassy explores. Shapes AI narrative when events bleed through this channel. A well-crafted question produces richer echo narratives." |
| **Local Ambassador** | "The agent who represents your simulation at this embassy. Agents with diplomatic professions and high qualification levels increase embassy effectiveness. Their personality traits color outbound bleed narratives." |
| **Ambassador Role** | "Diplomatic title (e.g., Cultural Attache, Trade Envoy). Affects how AI frames this agent's involvement in bleed narratives." |
| **Ambassador Quirk** | "A distinctive behavioral trait. Adds narrative flavor to embassy-related AI generation. Optional but enriches storytelling." |

### World Settings (Bleed Parameters)

| Setting | Info Bubble Text |
|---------|-----------------|
| **Bleed Enabled** | "Master switch for cross-simulation event propagation. When disabled, no events from this simulation will echo to other worlds, and no incoming echoes will be accepted." |
| **Min. Impact for Bleed** | "Minimum event impact level (1-10) required to trigger an echo. Default: 8. Can be effectively lowered by: unstable zones (-1), effective embassies (-1). Floor: 5." |
| **Max Cascade Depth** | "How many times an echo can re-echo (1-3). Depth 1: direct echo only. Depth 2: echoes of echoes. Depth 3: maximum — reality fractures deeply. Each depth level applies strength decay." |
| **Strength Decay** | "Multiplier applied per cascade depth (0-1). At 0.6: depth 1 = 60% strength, depth 2 = 36%, depth 3 = 22%. Lower values = echoes fade faster across hops." |
| **Auto-Approve Echoes** | "When enabled, incoming echoes skip 'pending' status and immediately begin AI generation. When disabled, an admin must approve each echo before it manifests." |

### Relationship Edit (in AgentDetailsPanel)

| Field | Info Bubble Text |
|-------|-----------------|
| **Relationship Type** | "The nature of this bond. Affects how both agents react to events involving the other. Type-specific narrative templates shape AI generation." |
| **Intensity** | "How strong this relationship is (1-10). High intensity (>=7): agents react to each other's events regardless of impact level. Medium (4-6): reactions require impact >=5. Low (1-3): reactions only for major events (impact >=8). Intensity >=8 resonates with the Resonance bleed vector." |
| **Bidirectional** | "When enabled, both agents feel the relationship equally. When disabled, only the source agent is affected — useful for unrequited bonds, secret alliances, or hierarchical roles." |

### Epoch Creation

| Field | Info Bubble Text |
|-------|-----------------|
| **Duration** | "How many days the epoch lasts (3-60). Shorter epochs favor aggressive play; longer epochs reward careful infrastructure building." |
| **Cycle Interval** | "Hours between cycle resolutions (2-24). Each cycle: RP allocated, missions resolve, scores snapshot. Shorter cycles = more action points = faster pace." |
| **RP per Cycle** | "Resonance Points allocated each cycle. Higher values enable more operatives and actions. Default 10 supports ~2 operations per cycle." |
| **RP Cap** | "Maximum storable RP. Excess is lost. Low caps force constant spending; high caps allow saving for big moves." |
| **Score Weights** | "How much each dimension contributes to the final score. Adjust to create different epoch flavors — 'Builder' emphasizes Stability, 'Warmonger' emphasizes Military." |
| **Allow Betrayal** | "When enabled, allied simulations can covertly attack each other. Detection dissolves the alliance and costs -20% Diplomatic Score. Creates tension within teams." |

### Deploy Operative

| Field | Info Bubble Text |
|-------|-----------------|
| **Agent Selection** | "This agent will leave their current building post. Their staffing contribution is lost while deployed. Agents with relevant professions (intelligence, demolition, rhetoric) have higher success probability." |
| **Mission Type** | "Each type has different cost, duration, and effect. Spies gather intel; Saboteurs damage buildings; Propagandists create destabilizing events; Assassins weaken target agents; Infiltrators degrade embassy effectiveness." |
| **Target Embassy** | "Operatives deploy THROUGH embassies. Higher embassy effectiveness = higher success probability. If the embassy is dissolved, the operative is immediately recalled." |
| **Target Zone** | "Zone security level affects success probability. Guarded zones are harder to infiltrate. Guardians in the zone further reduce your chances." |

---

## VII. Implementation Strategy

### Phase 1: Simulation Economy — Database Layer

Create materialized views for the PvE systems (1-5):

```sql
-- Building readiness (refreshed on agent/building changes)
CREATE MATERIALIZED VIEW mv_building_readiness AS ...

-- Zone stability (depends on building readiness)
CREATE MATERIALIZED VIEW mv_zone_stability AS ...

-- Embassy effectiveness (depends on building readiness + agent data)
CREATE MATERIALIZED VIEW mv_embassy_effectiveness AS ...

-- Simulation health (aggregates zone stability + diplomatic reach)
CREATE MATERIALIZED VIEW mv_simulation_health AS ...
```

Refresh triggers: after INSERT/UPDATE/DELETE on agents, buildings, events, embassies, agent_relationships.

**Migration 031:** Materialized views + refresh functions + triggers.

### Phase 2: Simulation Economy — Backend API

New endpoints:
- `GET /api/v1/simulations/{id}/health` → simulation health dashboard data
- `GET /api/v1/simulations/{id}/buildings/{id}/readiness` → single building readiness
- `GET /api/v1/simulations/{id}/zones/{id}/stability` → single zone stability
- `GET /api/v1/public/simulations/{id}/health` → public read for anonymous users

New service: `GameMechanicsService` — reads materialized views, formats response.

### Phase 3: Simulation Economy — Frontend

1. **Info bubbles** — add `_renderInfoBubble()` to all edit modals + settings panels
2. **SimulationHealthView** — new route `/simulations/{slug}/health`
3. **Readiness badges** on BuildingCard / BuildingDetailsPanel
4. **Stability bars** on zone list in LocationsView
5. **Agent influence** badge in AgentDetailsPanel

### Phase 4: AI Integration

Modify prompt templates to incorporate computed metrics:
- Event generation: "Zone stability is 0.29 (critical). Generate an event appropriate for a failing district."
- Agent reaction: "This agent has intensity-9 rival relationship with the event's protagonist."
- Echo generation: "Embassy effectiveness is 0.82 on commerce vector. Transform this event through economic lens."
- Building description: "Building readiness is 0.34 (critically understaffed). Describe the building reflecting its neglected state."

### Phase 5: Bleed Enhancement

- Replace binary threshold with probabilistic echo generation
- Implement `bleed_strength_decay` (currently stored but unused)
- Add vector-specific resonance bonuses (commerce events boost commerce echoes)
- Embassy effectiveness gates vector functionality

### Phase 6: Competitive Layer — Database

**Migration 032:** New tables for the competitive system:

```sql
-- Epoch definitions
CREATE TABLE game_epochs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by_id UUID REFERENCES auth.users NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby','foundation','competition','reckoning','completed','cancelled')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Epoch participation
CREATE TABLE epoch_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID REFERENCES game_epochs ON DELETE CASCADE NOT NULL,
  simulation_id UUID REFERENCES simulations ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES epoch_teams ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  current_rp INTEGER DEFAULT 0,
  last_rp_grant_at TIMESTAMPTZ,
  final_scores JSONB,
  UNIQUE(epoch_id, simulation_id)
);

-- Teams / alliances
CREATE TABLE epoch_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID REFERENCES game_epochs ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by_simulation_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  dissolved_at TIMESTAMPTZ,
  dissolved_reason TEXT
);

-- Operative missions
CREATE TABLE operative_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID REFERENCES game_epochs ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents ON DELETE CASCADE NOT NULL,
  operative_type TEXT NOT NULL CHECK (operative_type IN ('spy','saboteur','propagandist','assassin','guardian','infiltrator')),
  source_simulation_id UUID REFERENCES simulations NOT NULL,
  target_simulation_id UUID REFERENCES simulations,
  embassy_id UUID REFERENCES embassies,
  target_entity_id UUID,
  target_entity_type TEXT,
  target_zone_id UUID REFERENCES zones,
  status TEXT DEFAULT 'deploying' CHECK (status IN ('deploying','active','returning','success','failed','detected','captured')),
  cost_rp INTEGER NOT NULL,
  success_probability NUMERIC(3,2),
  deployed_at TIMESTAMPTZ DEFAULT now(),
  resolves_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  mission_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Score snapshots (one per simulation per cycle)
CREATE TABLE epoch_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID REFERENCES game_epochs ON DELETE CASCADE NOT NULL,
  simulation_id UUID REFERENCES simulations ON DELETE CASCADE NOT NULL,
  cycle_number INTEGER NOT NULL,
  stability_score NUMERIC(6,2) DEFAULT 0,
  influence_score NUMERIC(6,2) DEFAULT 0,
  sovereignty_score NUMERIC(6,2) DEFAULT 0,
  diplomatic_score NUMERIC(6,2) DEFAULT 0,
  military_score NUMERIC(6,2) DEFAULT 0,
  composite_score NUMERIC(6,2) DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(epoch_id, simulation_id, cycle_number)
);

-- Battle log
CREATE TABLE battle_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  epoch_id UUID REFERENCES game_epochs ON DELETE CASCADE NOT NULL,
  cycle_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  source_simulation_id UUID REFERENCES simulations,
  target_simulation_id UUID REFERENCES simulations,
  narrative TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 7: Competitive Layer — Backend

New services and routers:
- `EpochService` — create/join/transition epochs, RP allocation, cycle resolution
- `OperativeService` — deploy/recall operatives, resolve missions, success calculation
- `ScoringService` — compute per-dimension scores, normalize, composite
- `BattleLogService` — record and narrate competitive events

New routers:
- `routers/epochs.py` — CRUD epochs, join/leave, team management
- `routers/operatives.py` — deploy, recall, list active missions
- `routers/scores.py` — leaderboard, history, per-simulation breakdown
- `routers/public.py` additions — public leaderboard, public battle log

Background task: **Cycle resolver** — runs on schedule (configurable), processes:
1. RP allocation
2. Mission resolution (probability rolls)
3. Score snapshots
4. Phase transitions (foundation -> competition -> reckoning -> completed)
5. Notifications

### Phase 8: Competitive Layer — Frontend

1. **EpochCommandCenter** — platform-level route `/epoch`
2. **EpochCreationWizard** — modal from command center
3. **DeployOperativeModal** — 3-step wizard
4. **Enhanced AgentDetailsPanel** — operative status section
5. **Enhanced CartographerMap** — competitive overlay
6. **LeaderboardView** — sortable table with per-dimension bars
7. **BattleLogView** — narrative feed
8. **NotificationCenter** — competitive event notifications

### Phase 9: Balancing & Testing

- Automated balance tests
- Tune success probabilities, RP costs, score weights
- Playtest with 4 simulations

---

## VIII. New Database Tables Summary

| Table | Purpose | Rows (estimated) |
|-------|---------|-------------------|
| `game_epochs` | Epoch definitions + config | ~10s |
| `epoch_participants` | Simulation enrollment per epoch | ~40s |
| `epoch_teams` | Alliance definitions | ~10s |
| `operative_missions` | Deployed operatives + results | ~100s per epoch |
| `epoch_scores` | Score snapshots per cycle | ~participants x cycles |
| `battle_log` | Narrative event feed | ~100s per epoch |
| `mv_building_readiness` | Materialized view | ~buildings count |
| `mv_zone_stability` | Materialized view | ~zones count |
| `mv_embassy_effectiveness` | Materialized view | ~embassies count |
| `mv_simulation_health` | Materialized view | ~simulations count |

---

## IX. Verification

### Simulation Economy
1. **SQL views:** Query materialized views directly — verify computation formulas
2. **Backend tests:** `test_game_mechanics.py` — mock data, verify readiness/stability/effectiveness
3. **Frontend tests:** Info bubble rendering, badge display, bar calculations
4. **Manual:** Create low-condition building with no agents -> "Critical" badge
5. **Manual:** Assign agents -> readiness improves
6. **Manual:** High-impact event in unstable zone -> bleed threshold reduced
7. **Map:** Line thickness = embassy count, node pulse = stability

### Competitive Layer
8. **Backend tests:** `test_epoch_service.py` — lifecycle transitions, RP allocation, phase timing
9. **Backend tests:** `test_operative_service.py` — success probability calculation, failure consequences
10. **Backend tests:** `test_scoring_service.py` — all 5 dimensions, normalization, composite
11. **Manual:** Create epoch -> join with 2 simulations -> foundation phase (no attacks) -> competition phase
12. **Manual:** Deploy spy -> wait cycle -> verify intel revealed
13. **Manual:** Deploy saboteur -> success -> building condition degrades
14. **Manual:** Deploy saboteur -> detected -> diplomatic incident event in both sims
15. **Manual:** Form alliance -> verify team score = sum of members
16. **Manual:** Betrayal -> detected -> alliance dissolved, diplomatic score penalty
17. **Manual:** Reckoning phase -> verify bleed thresholds reduced, cascade depth increased
18. **Manual:** Epoch ends -> scores frozen, winner declared, operatives recalled
19. **Balance:** Run simulated epochs with varied strategies -> no single strategy dominates
