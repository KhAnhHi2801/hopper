# Project Overview

## Goal

Hopper is a POD (print-on-demand) → sales-channel import system. It imports products from POD platforms (Printify now; Printway/ShineOn planned later) into sales channels (Shopify now; Etsy planned later).

This is a fullstack upskilling project: the explicit purpose is learning job-market-relevant backend/frontend patterns — NestJS DI/decorators, BullMQ async messaging, Redis dual-use (queue + cache), envelope-encrypted centralized credentials, GraphQL Admin API, Vite Module Federation — not shortcuts. The user writes all feature code themselves; Claude explains concepts and reviews.

## MVP Scope

- **4 backend microservices**, communicating only via BullMQ (never direct HTTP/DB calls between services):
  - `api-gateway` — the only synchronous HTTP entry point.
  - `orchestration-service` — owns Postgres (`credentials`, `job_status`), decides what to enqueue.
  - `printify-service` — source adapter: fetches from Printify, normalizes to the shared product contract.
  - `shopify-service` — destination adapter: maps the shared contract to Shopify's GraphQL Admin API.
- **1 shared package**: `packages/product-contract` — the intermediate product shape every adapter validates against.
- **Micro-frontend** (Vite Module Federation): `shell` (host) + `catalog-mfe` + `job-status-mfe` (remotes) — added for extra learning practice beyond the original backend-only scope.

Full architecture, phase breakdown, and open decisions live in `plans/260728-2056-pod-to-shopify-import-system/plan.md`.

## Current Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Workspace scaffolding | Completed |
| 2 | Shared product-contract package | Completed |
| 3 | printify-service | Completed |
| 4-15 | orchestration-service, shopify-service, api-gateway, docker-compose, CI, frontend MFEs | Pending |

This doc set (`docs/*.md`) currently describes only what's built through Phase 3. It will be extended incrementally as later phases complete — see `project-roadmap.md` for the full phase list.
