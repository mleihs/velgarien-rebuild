---
title: "ADR-002: Settings als Key-Value Store"
id: adr-002
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, settings, configuration, key-value]
---

# ADR-002: Settings als Key-Value Store

## Status

Accepted

## Context

Simulationen benoetigen individuelle Konfigurationsmoeglichkeiten (AI-Modelle, Design-Tokens, Zugangskontrolle, etc.). Ein starres Schema wuerde bei jeder neuen Setting-Option eine Migration erfordern.

## Decision

Settings als `simulation_settings(simulation_id, category, setting_key, setting_value)` Tabelle.

## Consequences

- Maximale Flexibilitaet. Neue Settings koennen ohne Schema-Migration hinzugefuegt werden.
- Kategorisierung ermoeglicht effiziente Abfragen.
- Trade-off: Kein DB-Level-Constraint auf erlaubte Keys/Values (validiert in der Service-Schicht).
