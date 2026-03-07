---
title: "ADR-004: Prompt-Templates pro Simulation + Locale"
id: adr-004
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, prompts, ai, i18n, templates]
---

# ADR-004: Prompt-Templates pro Simulation + Locale

## Status

Accepted

## Context

AI-Prompts muessen pro Simulation und Sprache anpassbar sein. Velgarien nutzt deutsche Prompts mit dystopischem Ton, The Gaslit Reach englische mit viktorianischem Stil.

## Decision

`prompt_templates(simulation_id, template_type, locale, content, ...)`.

## Consequences

- Ermoeglicht simulation-spezifische und sprachspezifische Prompts ohne Code-Aenderungen.
- Fallback-Kette: Simulation+Locale → Simulation+Default-Locale → Plattform-Default.
- Templates koennen ueber die Settings-UI bearbeitet werden.
