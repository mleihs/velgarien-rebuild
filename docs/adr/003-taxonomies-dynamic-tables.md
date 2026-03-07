---
title: "ADR-003: Taxonomien als dynamische Tabellen"
id: adr-003
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, taxonomies, enums, configuration]
---

# ADR-003: Taxonomien als dynamische Tabellen

## Status

Accepted

## Context

Das Altsystem verwendet PostgreSQL ENUMs fuer Kategorisierungen (Agent-Typen, Gebaeude-Zustaende, etc.). ENUMs erfordern Schema-Migrationen zum Aendern und sind nicht pro Simulation anpassbar.

## Decision

Statt PostgreSQL ENUMs eine `simulation_taxonomies` Tabelle mit `(simulation_id, taxonomy_type, value, label, sort_order)`.

## Consequences

- Dynamische Tabellen erlauben Aenderungen per UI ohne Deployment.
- Jede Simulation kann eigene Enum-Werte definieren (z.B. deutsche Labels fuer Velgarien, englische fuer The Gaslit Reach).
- Trade-off: Kein DB-Level CHECK-Constraint, aber FK-Referenzen moeglich.
