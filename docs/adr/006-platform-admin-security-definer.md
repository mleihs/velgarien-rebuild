---
title: "ADR-006: Platform Admin via SECURITY DEFINER RPC"
id: adr-006
date: 2026-02-15
lang: de
type: spec
status: active
tags: [adr, admin, security, rpc, auth]
---

# ADR-006: Platform Admin via SECURITY DEFINER RPC

## Status

Accepted

## Context

Admin-Endpunkte benoetigen Zugriff auf `auth.users` (Benutzerliste, Benutzerdetails, Loeschung). Die GoTrue Admin API erwartet HS256-Tokens, die lokale Supabase-Instanz verwendet jedoch ES256.

## Decision

Admin-Endpunkte nutzen PostgreSQL SECURITY DEFINER-Funktionen statt GoTrue Admin API.

## Consequences

- SECURITY DEFINER-Funktionen (`admin_list_users`, `admin_get_user`, `admin_delete_user`) umgehen das HS256/ES256-Problem.
- Direkter `auth.users`-Zugriff mit korrekter Berechtigung.
- Alle drei Funktionen pruefen `is_platform_admin()` intern.
- Funktioniert identisch in lokaler und Production-Umgebung.
