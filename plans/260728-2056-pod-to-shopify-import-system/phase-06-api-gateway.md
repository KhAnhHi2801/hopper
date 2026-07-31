---
title: "Phase 6: Api gateway"
status: todo
---

# Phase 6: Api gateway

## Overview

The only synchronous HTTP entry point for the frontend. No BullMQ here — pure HTTP proxy + auth to orchestration-service.

## Requirements

- [ ] Auth check (mechanism is an open decision — JWT vs API key vs session, pick one and document why)
- [ ] `ImportsController`: `POST /imports`, `GET /imports/:id`, `GET /imports`
- [ ] `CatalogController`: `GET /catalog/printify`
- [ ] Proxies all of the above to orchestration-service over HTTP

## Related Code Files

- Create: `services/api-gateway/src/imports/imports.controller.ts`
- Create: `services/api-gateway/src/catalog/catalog.controller.ts`
- Create: `services/api-gateway/src/auth/` (mechanism TBD)

## Implementation Steps

1. Decide and implement the auth mechanism (document the choice — this was left open in the plan).
2. Build `ImportsController` — thin proxy, validates request shape with a DTO, forwards to orchestration-service.
3. Build `CatalogController` — same pattern, forwards to orchestration-service's catalog endpoint (which internally does the BullMQ sync-over-async call).
4. Confirm this service has zero BullMQ wiring — it should be the one service in the system without a `BullModule`.

## Todo

- [ ] Auth mechanism chosen and implemented
- [ ] Imports endpoints proxy correctly
- [ ] Catalog endpoint proxies correctly, including the timeout/degraded-path response from orchestration-service
- [ ] No BullMQ dependency in this service's package.json

## Success Criteria

Frontend-facing REST API works end-to-end through this gateway with no direct queue access; unauthenticated requests are rejected per the chosen auth mechanism.
