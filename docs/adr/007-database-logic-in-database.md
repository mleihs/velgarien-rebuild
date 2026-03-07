---
title: "ADR-007: Datenbank-Logik in der Datenbank"
id: adr-007
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, database, functions, triggers, invariants]
---

# ADR-007: Datenbank-Logik in der Datenbank

## Status

Accepted

## Context

Geschaefts-Invarianten (State Machines, Slug-Immutabilitaet, Owner-Guards) und atomare Multi-Tabellen-Operationen (Epoch-Cloning, Forge-Materialisierung, Cascade Events) muessen zuverlaessig durchgesetzt werden — unabhaengig davon, welcher Code-Pfad die Daten modifiziert.

## Decision

Geschaefts-Invarianten, abgeleitete Daten und atomare Multi-Tabellen-Operationen werden als PostgreSQL Functions und Triggers implementiert — nicht in der Anwendungsschicht.

## Alternatives Considered

- **Alle Logik in FastAPI** — Bypass-Risiko durch Application-Bugs, Race Conditions, fehlende Service-Aufrufe
- **Hybridansatz mit PG fuer Invarianten** — Gewaehlt

## Rule

Wenn die Logik eine Daten-Invariante schuetzt (State Machines, Slug-Immutabilitaet, Owner-Guard) oder atomar mehrere Tabellen modifiziert (`clone_simulations_for_epoch`, `fn_materialize_shard`, `process_cascade_events`) → PostgreSQL. Wenn sie externe APIs orchestriert (OpenRouter, Replicate, SMTP) → FastAPI.

## Consequences

- ~48 Functions, 53 Trigger-Eintraege, 4 Materialized Views.
- Invarianten werden auf DB-Ebene erzwungen, unabhaengig vom Aufrufer (API, Migration, direkter DB-Zugriff).
- Siehe [Database Schema](../references/database-schema.md) fuer vollstaendige Dokumentation.
