---
title: "ADR-005: Competitive Layer als Template-Clone-Architektur"
id: adr-005
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, epochs, competitive, cloning, game-instances]
---

# ADR-005: Competitive Layer als Template-Clone-Architektur

## Status

Accepted

## Context

Spieler gestalten ihre Simulationen kreativ (Templates). Fuer kompetitives PvP muessen alle Seiten gleiche Ausgangsbedingungen haben. Das erfordert eine Trennung zwischen kreativem Template und normalisierter Spielinstanz.

## Decision

Epochs klonen Template-Simulationen in isolierte Game Instances mit normalisierten Werten. Templates bleiben unveraendert.

## Consequences

- `clone_simulations_for_epoch()` (~250 Zeilen PL/pgSQL) normalisiert: Agenten-Cap (max 6), Gebaeude-Cap (max 8), Zustand (alle→'good'), Kapazitaet (alle→30), Sicherheits-Verteilung (1×high, 2×medium, 1×low), Qualifikation (alle→5).
- Nach Epoch-Abschluss werden Instances archiviert.
- Templates koennen waehrend laufender Epochs weiter bearbeitet werden, ohne den Wettbewerb zu beeinflussen.
