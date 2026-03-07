---
title: "ADR-008: Resonance Function Caps Hardcoded vs. Settings"
id: adr-008
date: 2026-03-07
lang: en
type: spec
status: active
tags: [adr, resonance, database, settings, technical-debt]
---

# ADR-008: Resonance Function Caps Hardcoded vs. Settings

## Status

Accepted (with known debt)

## Context

The resonance gameplay integration (migrations 078-080) introduces PostgreSQL functions that clamp outputs to specific ranges:

- `fn_resonance_operative_modifier()`: clamp `[-0.04, +0.04]`
- `fn_target_zone_pressure()`: cap `0.04`
- `fn_attacker_pressure_penalty()`: cap `0.04`

These cap values are also seeded into `simulation_settings` as `resonance_operative_pressure_cap`, `resonance_operative_modifier_cap`, and `resonance_operative_penalty_cap`. However, the PostgreSQL functions use hardcoded `DECLARE cap NUMERIC := 0.04` rather than reading from `simulation_settings`.

## Decision

Hardcode caps in PostgreSQL functions for Phase 1. The `simulation_settings` values serve as documentation and future integration points.

Reading settings in hot-path functions would require JOINs against `simulation_settings` during N-mission resolution within `resolve_cycle()`. For a typical epoch with 4 players × 3 operatives × per-cycle resolution, this adds unnecessary query overhead.

## Alternatives Considered

- **Read from settings at runtime** — Adds JOIN overhead per function call. Rejected for performance.
- **Materialize settings into a lookup table** — Adds complexity (refresh triggers, staleness). Overkill for 3 values.
- **Hardcode with no settings rows** — Loses discoverability. Rejected.

## Consequences

- Changing caps requires a `CREATE OR REPLACE FUNCTION` migration.
- `simulation_settings` values are advisory, not enforced by the database functions.
- Per-simulation cap overrides are not possible without function changes.

## Known Debt

- No `CHECK` constraint on `effective_magnitude` — could exceed 1.0 if the `trg_compute_effective_magnitude` trigger is bypassed by a direct UPDATE.
- `mv_zone_stability` refresh is manual (triggered by `fn_refresh_zone_stability()`). Zone pressure values used by resonance functions may be stale between refreshes.
- Settings and function caps could drift if settings are updated without a corresponding function migration.
