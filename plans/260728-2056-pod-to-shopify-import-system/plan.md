---
title: 'POD to Shopify import system'
description: 'Microservices system importing products from Printify into Shopify, built as a fullstack upskilling exercise (NestJS, BullMQ, Module Federation).'
status: pending
priority: P1
effort: ''
tags: [nestjs, bullmq, microservices, module-federation, learning]
created: 2026-07-28
---

# POD to Shopify import system

## How We'll Work (teaching mode, not auto-implementation)

This project's purpose is the user's own practice — NOT to have Claude write the code. Per phase: explain the concept and shape of what's needed → user writes the code → review + explain what's wrong/right → next checkpoint. Code is written directly only when the user explicitly asks (e.g. "show me an example").

## Overview

Import products from POD platforms (Printify now; Printway/ShineOn later) into sales channels (Shopify now; Etsy later). MVP locked to 4 backend services (api-gateway, orchestration-service, printify-service, shopify-service) talking only via BullMQ, plus a micro-frontend (Vite Module Federation: shell + catalog-mfe + job-status-mfe) added for extra learning practice. Goal is job-market-relevant patterns, not shortcuts: NestJS DI/decorators, BullMQ producer/consumer + sync-over-async, Redis dual-use (queue vs cache), envelope-encrypted centralized credentials, Shopify GraphQL Admin API.

## Goals

| #   | Goal                                                                                                                                               | Priority |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Backend: 4 NestJS microservices communicating only via BullMQ, envelope-encrypted credentials, Postgres job status, MongoDB raw products           | P1       |
| 2   | Frontend: micro-frontend (Vite Module Federation) with shell + catalog-mfe + job-status-mfe                                                        | P1       |
| 3   | Runnable locally via docker-compose; CI (lint/test/build) via GitHub Actions                                                                       | P2       |
| 4   | User understands and can explain every new concept (BullMQ job/queue/worker, envelope encryption, MF shared/singleton) — not just copy-pasted code | P1       |

## Architecture

```
shell (host) ──lazy-loads──▶ catalog-mfe, job-status-mfe (remotes, Module Federation)
     │ HTTP
     ▼
api-gateway ──HTTP──▶ orchestration-service ──▶ Postgres (credentials [encrypted], job_status)
                  (only sync entry)      (decides what to enqueue)
                                                │ enqueue "printify-import"
                                                ▼
                                        BullMQ / Redis
                                                │ consume
                                                ▼
                                        printify-service
                                (fetch Printify API, Redis CACHE printify:product:{id},
                                 store raw doc → MongoDB raw_products, normalize → ProductDto)
                                                │
                          produce "shopify-import"     produce "job-events"
                                                ▼                    ▼
                                        shopify-service      orchestration-service
                                (map ProductDto → GraphQL     (consumes job-events,
                                 productCreate, call Shopify)  updates job_status)
                                                │
                          produce "shopify-import-result" ─────────▶ (same job-events consumer)
```

**BullMQ queues:**

| Queue              | Producer                          | Consumer              | Purpose                                                                                                |
| ------------------ | --------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `printify-import`  | orchestration-service             | printify-service      | trigger fetch+normalize of one Printify product                                                        |
| `shopify-import`   | printify-service                  | shopify-service       | hand off normalized `ProductDto` for creation on Shopify                                               |
| `job-events`       | printify-service, shopify-service | orchestration-service | status updates only — keeps ALL inter-service comms on BullMQ (no adapter touches Postgres directly)   |
| `printify-catalog` | orchestration-service             | printify-service      | sync-over-async request/reply for catalog listing (`waitUntilFinished`), backs `GET /catalog/printify` |

**Redis has two distinct, separately-coded roles** — must stay visually distinct (different modules): **Queue role** (`BullModule`, `Queue.add()`, `@Processor` `Worker` — job semantics/retries/backoff) vs **Cache role** (plain `ioredis` in `printify-service` only, simple `GET`/`SET EX`, no job semantics).

**Postgres (Supabase)** — owned solely by orchestration-service: `credentials` (envelope-encrypted), `job_status`.

**MongoDB** — owned by printify-service: `raw_products` collection, single collection with a `platform` discriminator field.

**Happy path**: `POST /imports {printifyProductId, shopId}` on api-gateway → orchestration-service creates `job_status(PENDING)`, decrypts credential, enqueues `printify-import` → printify-service cache-checks/fetches/normalizes/stores raw doc → enqueues `shopify-import` + `job-events(NORMALIZED)` → shopify-service maps + calls Shopify GraphQL → enqueues `job-events(COMPLETED|FAILED)` → orchestration-service updates `job_status` → frontend polls for status.

## Intermediate Product Contract (shared package `packages/product-contract`)

```ts
export interface Product {
  sourcePlatform: 'printify' | 'printway' | 'shineon'; // extensible; only printify implemented now
  sourceProductId: string;
  title: string;
  description: string;
  vendor?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  status: 'draft' | 'active';
}
export interface ProductImage {
  url: string;
  position: number;
  altText?: string;
}
export interface ProductVariant {
  sku: string;
  title: string; // e.g. "Black / L"
  price: number; // major units, e.g. 19.99
  currency: string; // ISO 4217, e.g. "USD"
  options: Record<string, string>; // { color: 'Black', size: 'L' }
  inventoryQuantity?: number;
}
```

Mirrored 1:1 as a class-validator DTO. Every adapter validates against this — printify-service before enqueueing, shopify-service on consume before mapping to Shopify's GraphQL input.

## Repo Layout (npm workspaces)

```
Hopper/
├── package.json                 (workspaces: ["services/*", "packages/*", "apps/*"])
├── tsconfig.base.json
├── docker-compose.yml
├── .github/workflows/ci.yml
├── apps/{shell,catalog-mfe,job-status-mfe}/
├── packages/product-contract/
└── services/{api-gateway,orchestration-service,printify-service,shopify-service}/
```

npm workspaces chosen over Nx/Turborepo: mostly independent apps, one thin shared package — no heavy shared build graph needed at this scale.

## Credential Encryption (orchestration-service only)

Envelope encryption (KEK/DEK pattern used by AWS KMS/Vault): per-secret AES-256-GCM data key (DEK), wrapped by a master key (KEK) from `MASTER_KEY` env var. Store `{ciphertext, iv, authTag, wrappedDek, keyVersion}` per credential row. Only orchestration-service ever decrypts; decrypted secret attaches to a BullMQ job payload only for that job's lifetime, never persisted/logged. `removeOnComplete`/`removeOnFail` on queues carrying secrets. Production upgrade path (not built now): AWS KMS / Secrets Manager.

## Phases

| #   | Phase                                                                                              | Status  |
| --- | -------------------------------------------------------------------------------------------------- | ------- |
| 1   | [Workspace scaffolding](./phase-01-start.md)                                       | Completed |
| 2   | [Shared Product contract package](./phase-02-product-contract-package.md)                          | Completed |
| 3   | [printify-service](./phase-03-printify-service.md)                                                 | Completed |
| 4   | [orchestration-service](./phase-04-orchestration-service.md)                                       | Pending |
| 5   | [shopify-service](./phase-05-shopify-service.md)                                                   | Pending |
| 6   | [api-gateway](./phase-06-api-gateway.md)                                                           | Pending |
| 7   | [docker-compose (backend)](./phase-07-docker-compose-backend.md)                                   | Pending |
| 8   | [GitHub Actions CI (backend)](./phase-08-github-actions-ci-backend.md)                             | Pending |
| 9   | [Jest test suites (backend)](./phase-09-jest-test-suites-backend.md)                               | Pending |
| 10  | [Frontend workspace scaffolding (Module Federation)](./phase-10-frontend-workspace-scaffolding.md) | Pending |
| 11  | [Shell app](./phase-11-shell-app.md)                                                               | Pending |
| 12  | [catalog-mfe](./phase-12-catalog-mfe.md)                                                           | Pending |
| 13  | [job-status-mfe](./phase-13-job-status-mfe.md)                                                     | Pending |
| 14  | [Frontend tests (Vitest)](./phase-14-frontend-tests.md)                                            | Pending |
| 15  | [Frontend docker-compose + CI wiring](./phase-15-frontend-docker-compose-ci.md)                    | Pending |

## Success Criteria

- [ ] `docker-compose up` brings up all 4 backend services + 3 frontend apps + redis/postgres/mongo healthy
- [ ] `POST /imports` end-to-end: PENDING → NORMALIZED → COMPLETED/FAILED, visible in job-status-mfe
- [ ] catalog-mfe lists Printify products via federation + triggers import
- [ ] `npm test --workspaces` green (Jest for services, Vitest for frontend apps)
- [ ] GitHub Actions green for every service and app
- [ ] User can explain, unprompted: BullMQ job/queue/worker/producer/consumer, envelope encryption DEK/KEK, MF shared/singleton pitfall

## Open Decisions (deferred to user, not decided here)

- BullMQ retry/backoff strategy per queue.
- Redis cache TTL (Printify product fetch cache + catalog-list cache).
- ORM for orchestration-service (Prisma assumed, not locked).
- Auth mechanism at api-gateway (JWT vs API key vs session); token storage location across shell + remotes (shell-only recommended).
- Job status delivery: polling (MVP) vs SSE/WebSocket later.
- Exact MF plugin: `@originjs/vite-plugin-federation` vs `@module-federation/vite`.
- Shared design system/UI library across the 3 frontend apps, or none.
- `printify-catalog` sync-over-async timeout UX: retry-able error vs silent fallback to polling.
- True independent-deploy MF (remote manifest/version negotiation) — out of scope for MVP.

<!-- slug: pod-to-shopify-import-system -->
