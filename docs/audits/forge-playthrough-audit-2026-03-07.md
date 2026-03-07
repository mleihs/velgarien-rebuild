---
title: "Simulation Forge — Live Playthrough Audit"
id: forge-playthrough-audit
version: "1.0"
date: 2026-03-07
lang: en
type: audit
status: active
tags: [forge, audit, playthrough, ux, content-quality, admin]
---

# Simulation Forge — Live Playthrough Audit Report

**Date:** 7 March 2026
**Auditor:** Claude (automated browser playthrough via WebMCP)
**Seed Prompt:** *"A drowned cathedral city where tidal memory preserves the voices of the dead, and each district speaks a different century's dialect"*
**Selected Anchor:** Tidal Phenomenology
**Materialized Simulation:** Tidal Phenomenology (purged after audit)
**Environment:** Local dev (Vite :5173, FastAPI :8000, Supabase :54321), real API calls (OpenRouter, Replicate, Tavily)

---

## 1. UX/UI Audit

### Phase I — The Astrolabe

**Strengths:**
- Seed prompt input is clear and inviting.
- Research phase fires correctly (real OpenRouter call).
- Three philosophical anchor options rendered as cards with title, description, core question, literary influence, and bleed signature suggestion — genuinely compelling content.
- Anchor selection is intuitive (click to select, click to proceed).

**Issues Found:**
- No loading skeleton or progress indicator during research API call — just a spinner. For a call that takes 8–15 seconds, a multi-step progress bar or "Consulting the archives..." animation would reduce perceived wait time.
- The anchor cards are text-dense. On mobile widths, they would likely overflow or become unreadable. Consider a card-expand pattern or accordion.

### Phase II — The Drafting Table

**Strengths:**
- Three-chunk generation (geography → agents → buildings) is a natural flow.
- Entity cards render cleanly with names and descriptions.
- Accept/reject staging pattern gives the user real editorial control.

**Issues Found:**
- No visual distinction between "staged" (pending review) vs "committed" entities. After generating agents, all 6 appear in a list with no indication of their staging status.
- The generation config sliders (agent_count, building_count, etc.) have no tooltips or recommended ranges. A user might set agent_count to 50 without understanding cost/time implications.
- No "regenerate single entity" option — it's all-or-nothing per chunk type. If 5 of 6 agents are good but one is weak, the user must accept all or regenerate all.

### Phase III — The Darkroom

**Strengths:**
- Auto-theme generation produces a complete design system (colors, fonts, card frame styles, image style prompts).
- The generated palette is thematically coherent (aquamarine/teal primary, aged gold accents, deep ocean backgrounds).

**Issues Found:**
- Color pickers and font selectors not fully validated — theme_config was stored correctly but UX for manual override wasn't tested.
- No live preview of the generated theme applied to sample components.

### Phase IV — The Ignition

**Strengths:**
- Hold-to-confirm pattern (2-second press) is a good safety mechanism for an irreversible operation.
- Summary readout before ignition shows key metrics.
- Materialization completes successfully with real AI calls (~75 seconds for full pipeline).

**Critical Issues Found:**
1. **Hold button race condition:** `_holdProgress` reached 1.0 but `_executeIgnition()` never fired on first attempt. The `setInterval` timer completed but the component's reactive property update didn't trigger the ignition callback reliably. Required manual invocation via browser console.
2. **Error state never shown:** `_executeIgnition()` catch block only called `VelgToast.error()` but never set `this._error`, so the error panel with retry button was dead code. **[FIXED]**
3. **Generic 500 for all RPC errors:** Backend returned HTTP 500 for "Insufficient tokens" (which should be 402). Frontend had no way to distinguish between retryable and non-retryable errors. **[FIXED]**
4. **State lost on page refresh:** ForgeStateManager was entirely in-memory. A page refresh during the multi-minute ignition phase would lose the draft reference. **[FIXED]**

### General UX Observations

- Toast notifications use consistent "SIGNAL CONFIRMED" branding — good identity.
- Phase indicator bar with sweep animation is visually effective but the `prefers-reduced-motion` handling is correct.
- CRT scanline overlay is subtle enough to be atmospheric without impeding readability.
- No "save and exit" option — if a user starts a forge and needs to leave, they lose progress (mitigated by sessionStorage fix, but only for same-tab refreshes).

---

## 2. Content Quality — Literature Professor Analysis

### Seed → Anchor Coherence: A

The three generated philosophical anchors ("Chronolinguistic Strata," "Tidal Phenomenology," "Acoustic Archaeology") are remarkably well-differentiated. Each takes the seed's core images — drowning, memory, dialect — and refracts them through distinct intellectual lenses:

- **Chronolinguistic Strata** reads like a Borgesian thought experiment applied to philology.
- **Tidal Phenomenology** engages genuinely with Bachelard and Merleau-Ponty (not just name-dropping).
- **Acoustic Archaeology** brings in Foucault's heterotopia concept with surprising precision.

The literary influence pairings are not obvious — "Bachelard's *Water and Dreams* intersecting with Merleau-Ponty's theories of perception" is a real academic intersection, not a hallucinated one.

### Agent Writing Quality: B+

**Naming (A-):**
The agent names achieve a balance between evocative and pronounceable:
- *Echo Blackwater* — sound + water, direct but effective
- *Chronos Marsh* — temporal + wetland, slightly on-the-nose
- *Mercator Vale* — cartographic + topographic, excellent double meaning
- *Mnemonia Frost* — memory + coldness, elegant
- *Vector Tideweaver* — directional + craft, strong compound
- *Aria Saltweave* — musical + material, lovely

The names share a consistent cultural register — all feel like they belong to the same world. The compound-surname pattern (Blackwater, Tideweaver, Saltweave) establishes a naming convention that implies a society where identity is tied to elemental forces.

**Backgrounds (B):**
Echo Blackwater's background demonstrates genuine narrative craft — the detail about crying "in harmony with the cathedral bells as they rang underwater for the first time" is precise, sensory, and establishes both character and world simultaneously. The psychological depth of "beginning to hear voices even when she's above water" creates genuine dramatic tension.

However, there's a pattern weakness: every agent has a dramatic origin tied to a tidal event. While thematically coherent, this creates a sense of sameness. Real communities have diversity of origin — some people are exceptional, others are ordinary people in extraordinary circumstances.

### Building Descriptions: A-

*The Mnemonist's Spire* description is the standout — "Rising like a twisted nautilus shell" establishes immediate spatial imagination, and the detail about "time-catching mirrors" that "somehow capture and replay fragments of conversations from different centuries when submerged" is both mechanically specific and narratively rich.

The building names form a satisfying taxonomy of institutional types:
- **Archive:** The Mnemonist's Spire, The Whispering Vault
- **Commerce:** The Drowned Bell Exchange, The Chronometric Exchange
- **Craft:** The Tidewright's Workshop
- **Social:** The Dialectic Bathhouse
- **Communication:** The Remembrance Rookery

This distribution implies a functioning society with information preservation, trade, craft, leisure, and communication — suggesting the AI understood that a city needs functional diversity, not just atmospheric nouns.

### Zone & Street Names: B+

**Zones:** The Resonant Depths, Mercantile Meridian, Mnemonic Warren, Tidemark Archives, The Submergent Quarter — each suggests both geography and function. "Mnemonic Warren" is particularly evocative (labyrinthine memory).

**Streets:** Remembrance Row, Merchant's Meander, Whisperwell Way — alliterative and navigable. Slightly less inventive than the zone names.

### Overall Literary Assessment

The content pipeline produces fiction of solid mid-literary quality — comparable to a competent fantasy worldbuilding supplement. The best outputs (anchor descriptions, building descriptions) reach toward genuine literary distinction. The weakest (street names) are functional but unremarkable. The overall coherence between seed → anchor → entities is the most impressive quality: nothing feels random or disconnected.

---

## 3. Game Design Analysis

### Entity Balance: B

- **6 agents** for a new simulation is reasonable for a starter roster.
- **7 buildings** provides enough points of interest for early gameplay.
- **5 zones** with **5 streets** creates a navigable geography.

The default config (`agent_count: 6, building_count: 7, zone_count: 5, street_count: 5`) produces a tight, playable map. This is better than over-generating — new simulations should feel intimate, with room to grow through gameplay.

### Agent Diversity Concern

All 6 agents appear to be "extraordinary" figures — acoustic prodigies, tidal scholars, memory-workers. A healthy simulation also needs ordinary roles: merchants, laborers, skeptics. The generation prompt may be biased toward creating "important" characters. Consider adding a `mundanity_ratio` parameter to ensure 30-40% of generated agents are ordinary citizens.

### Theme-Gameplay Coherence: A-

The generated theme config is mechanically interesting:
- `card_frame_foil: "aquatic"` — implies card borders with water effects
- `card_frame_corners: "tentacles"` — visual identity in the UI itself
- `card_frame_texture: "illumination"` — manuscript-style ornamentation
- `card_frame_nameplate: "cartouche"` — Egyptian/nautical reference

These aren't just aesthetic choices — they create a visual language that reinforces the drowned-cathedral metaphor every time a player interacts with a card.

### Image Style Prompts: B+

Four distinct prompt variants for different contexts:
- **Portrait:** "wet plate collodion photography, submerged in turquoise water..." — appropriate for agent cards
- **Building:** "underwater gothic architecture photography, bioluminescent algae..." — atmospheric
- **Lore:** "maritime manuscript illumination, flowing water ink effects, gold leaf accents..." — implies hand-crafted documentation
- **Banner:** "submerged cathedral cityscape, rays of light penetrating deep water..." — epic establishing shots

The prompts demonstrate understanding of different visual registers for different content types — portraits need intimacy, buildings need space, lore needs texture, banners need grandeur.

### Playability Assessment

This simulation would work in an Epoch. The 5-zone geography with distinct character (Resonant Depths vs Mercantile Meridian) creates natural faction territories. The 6 agents have enough thematic differentiation for players to develop distinct strategies. The tidal memory concept provides a natural time-cycle mechanic (high tide reveals, low tide conceals) that maps well to turn-based gameplay.

**Missing for full playability:** Agent aptitudes are not visible in the draft data. The 36-point budget system with 3-9 range needs to be verified post-materialization.

---

## 4. Image Quality Assessment

Images were generated via Replicate (background batch processing). During the live playthrough, the simulation was viewed after materialization — AI-generated portraits and building images appeared on entity cards. However, the simulation was purged before a systematic image review could be completed.

**Style Prompt Effectiveness:** The prompt architecture is sound — using distinct prompts per content type (portrait/building/lore/banner) ensures visual variety while maintaining mood coherence. The "wet plate collodion photography" aesthetic for portraits is a strong stylistic choice that avoids generic fantasy art.

---

## 5. Admin Tools Audit

### Archive (Soft Delete): PASS

- Confirmation dialog: Clear messaging ("Archive 'Tidal Phenomenology'? It will be hidden from users but can be restored later.")
- Execution: Instant, no loading delay
- Feedback: Toast "Simulation archived." + counters update (Active 8→7, Trash 0→1)
- Reversibility: Trash tab shows RESTORE + PURGE buttons

### Restore: PASS (after fix)

- **Original bug:** HTTP 500 — PostgreSQL trigger `validate_simulation_status_transition()` had `"archived": []` (empty allowed transitions). The trigger correctly enforced its rules, but the rules were wrong.
- **Fix applied:** Migration `fix_archived_status_transition` added `"active"` to archived transitions.
- **Post-fix:** Restore works instantly via UI. Active counter increments, Trash counter decrements.
- **UX note:** No confirmation dialog for restore — this is correct (restore is non-destructive).

### Purge (Hard Delete): PASS

- Confirmation dialog: Strong warning language ("This will permanently destroy 'Tidal Phenomenology' and ALL related data (agents, buildings, epochs, lore, images). This cannot be undone.")
- Button uses danger-red "DESTROY PERMANENTLY" — appropriate visual weight.
- Execution: Instant cascade delete.
- Cascade verification: All related records (agents, buildings, zones) deleted. Zero orphans.

### Admin Tools Issue: Orphaned Forge Drafts

After hard-deleting the simulation, the `forge_drafts` record (status: "completed") persists. There's no FK relationship between `forge_drafts` and `simulations`, so the cascade doesn't reach it. This is a minor data hygiene issue — over time, purged simulations will leave ghost drafts. Consider either:
1. Adding an FK from forge_drafts to simulations (if a `materialized_simulation_id` column exists or is added)
2. Including forge_draft cleanup in the hard-delete service method
3. Adding a "Purge orphaned drafts" button to the Data Cleanup admin tab

---

## 6. Architectural Issues Found & Fixed

### Fix 1: RPC Error Classification (Backend)
**File:** `backend/services/forge_orchestrator_service.py`
**Problem:** All PostgreSQL RPC exceptions returned as HTTP 500.
**Fix:** Added `_RPC_ERROR_MAP` lookup table mapping error messages to semantic HTTP status codes (402 for tokens, 400 for validation, 409 for already processed).

### Fix 2: Frontend Error State (Frontend)
**File:** `frontend/src/components/forge/VelgForgeIgnition.ts`
**Problem:** `_executeIgnition()` catch block never set `this._error`, so the error panel with retry button was dead code.
**Fix:** Set `this._error` in both catch and else branches.

### Fix 3: State Persistence (Frontend)
**File:** `frontend/src/services/ForgeStateManager.ts`
**Problem:** Forge wizard state was entirely in-memory — page refresh lost the draft.
**Fix:** Added sessionStorage persistence for draft ID + `restoreSession()` on wizard mount.

### Fix 4: Logging Reliability (Backend)
**File:** `backend/logging_config.py`
**Problem:** Structured logger stopped writing mid-session during uvicorn `--reload` restarts.
**Fix:** Added `_FlushingStreamHandler` that flushes after every emit + `atexit.register(logging.shutdown)`.

### Fix 5: Status Transition Trigger (Database)
**Migration:** `fix_archived_status_transition`
**Problem:** `validate_simulation_status_transition()` trigger had `"archived": []` — no transitions allowed from archived state, breaking the restore flow.
**Fix:** Changed to `"archived": ["active"]`.

---

## 7. Summary Scorecard

| Category | Grade | Notes |
|---|---|---|
| **Phase I UX** | B+ | Functional, needs loading states |
| **Phase II UX** | B | Staging flow unclear, no single-entity regen |
| **Phase III UX** | B | Works but no live preview |
| **Phase IV UX** | C+ | Hold button race condition, error state was broken |
| **Content Quality** | A- | Excellent seed→entity coherence |
| **Literary Depth** | B+ | Strong worldbuilding, some sameness in agent origins |
| **Game Balance** | B | Good defaults, needs mundane agent diversity |
| **Image Prompts** | B+ | Well-differentiated per content type |
| **Admin Archive** | A | Clean, clear, instant |
| **Admin Restore** | A | Working after trigger fix |
| **Admin Purge** | A- | Clean cascade but orphans forge drafts |
| **Error Handling** | B | Significantly improved after 5 fixes |
| **Logging** | B+ | Reliable after flushing handler fix |

**Overall: B+** — The Simulation Forge produces genuinely compelling AI-generated worldbuilding content through a well-structured 4-phase pipeline. The architectural issues found during this audit were real but fixable — all 5 have been resolved. The admin deletion tools are solid with good confirmation UX. The main areas for improvement are Phase IV reliability (hold button timing), single-entity regeneration in Phase II, and orphaned forge draft cleanup.
