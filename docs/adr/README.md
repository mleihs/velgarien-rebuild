---
title: "Architecture Decision Records"
id: adr-index
lang: en
type: spec
status: active
tags: [adr, architecture, index]
---

# Architecture Decision Records

Extracted from [Platform Architecture](../specs/platform-architecture.md). Each ADR documents a key architectural choice, its context, and consequences.

## ADR Index

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](001-simulation-row-level-tenant.md) | Simulation als Row-Level Tenant (`simulation_id` FK + RLS) | Accepted |
| [ADR-002](002-settings-key-value-store.md) | Settings als Key-Value Store (`simulation_settings` table) | Accepted |
| [ADR-003](003-taxonomies-dynamic-tables.md) | Taxonomien als dynamische Tabellen (statt PostgreSQL ENUMs) | Accepted |
| [ADR-004](004-prompt-templates-per-simulation.md) | Prompt-Templates pro Simulation + Locale (fallback chain) | Accepted |
| [ADR-005](005-competitive-layer-template-clone.md) | Competitive Layer als Template-Clone-Architektur | Accepted |
| [ADR-006](006-platform-admin-security-definer.md) | Platform Admin via SECURITY DEFINER RPC | Accepted |
| [ADR-007](007-database-logic-in-database.md) | Datenbank-Logik in der Datenbank (~48 functions, 53 triggers) | Accepted |

## Template for New ADRs

```markdown
---
title: "ADR-NNN: [Short Title]"
id: adr-nnn
date: YYYY-MM-DD
lang: de
type: spec
status: active
tags: [adr, ...]
---

# ADR-NNN: [Short Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Context

[What is the issue that we're seeing that is motivating this decision?]

## Decision

[What is the change that we're proposing and/or doing?]

## Alternatives Considered

[What other options were evaluated?]

## Consequences

[What becomes easier or more difficult to do because of this change?]
```
