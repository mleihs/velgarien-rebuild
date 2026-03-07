---
title: "ADR-001: Simulation als Row-Level Tenant"
id: adr-001
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, architecture, multi-tenancy, rls]
---

# ADR-001: Simulation als Row-Level Tenant

## Status

Accepted

## Context

Die Plattform muss mehrere Simulationen isoliert voneinander betreiben. Jede Simulation hat eigene Agenten, Gebaeude, Events, Zonen und Konfigurationen. Drei Isolationsstrategien standen zur Auswahl.

## Decision

Alle Entitaeten in derselben Datenbank, isoliert durch `simulation_id` FK + RLS Policies.

## Alternatives Considered

- **Separate Datenbank pro Simulation** — Zu hoher Overhead
- **Separate Schemas pro Simulation** — Komplex bei Migrationen
- **Row-Level mit `simulation_id`** — Gewaehlt

## Consequences

- Supabase unterstuetzt RLS nativ. Row-Level-Isolation bietet gute Balance zwischen Isolation und Einfachheit.
- Migrations wirken auf alle Simulationen gleichzeitig.
- Jede Query wird automatisch nach `simulation_id` gefiltert.
- RLS Policies erzwingen Isolation auf DB-Ebene.
