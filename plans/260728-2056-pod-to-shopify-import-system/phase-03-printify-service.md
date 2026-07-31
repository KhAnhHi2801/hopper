---
title: "Phase 3: Printify service"
status: completed
---

# Phase 3: Printify service

## Overview

The source adapter. Fetches products from the real Printify API, caches fetch results in Redis (cache role, distinct from BullMQ), stores raw responses in MongoDB, normalizes to the shared `ProductDto`, and is both a BullMQ consumer (`printify-import`, `printify-catalog`) and producer (`shopify-import`, `job-events`).

## Requirements

- [x] `PrintifyApiService` — HTTP client to real Printify API (`@nestjs/axios`)
- [x] `PrintifyCacheService` — plain `ioredis` GET/SET, TTL from env (open decision, don't hardcode silently)
- [x] `PrintifyNormalizerService` — raw Printify JSON → `ProductDto`, validated
- [x] Mongoose module for `raw_products` collection (`platform` discriminator field)
- [x] `@Processor('printify-import')` — consumes import jobs
- [x] `@Processor('printify-catalog')` — consumes catalog-list jobs, returns list as job return value (sync-over-async backing for `GET /catalog/printify`)
- [x] Producers: `shopify-import` queue, `job-events` queue
- [x] Every new BullMQ concept (job, queue, worker, producer, consumer) explained as inline code comments — this is the first phase touching BullMQ

## Architecture

Two Redis roles must live in visibly separate modules:
- **Queue role**: `BullModule.registerQueue(...)`, `@Processor` classes (consumer/worker side), `@InjectQueue()` + `.add()` (producer side).
- **Cache role**: `PrintifyCacheModule` wrapping a plain `ioredis` client — `GET`/`SET EX` only, no job semantics. Never mix this client into a `@Processor` class; keep it a dependency the normalizer/API service injects.

Import flow: `printify-import` job arrives → check cache (`printify:product:{id}`) → miss: call Printify API, cache write, save raw doc to Mongo → normalize → validate against `ProductDto` → produce `shopify-import` job + `job-events(NORMALIZED)` job.

Catalog flow: `printify-catalog` job arrives → check cache (`printify:catalog:page:{n}`) → miss: call Printify list API, normalize list, cache write → **return the list as the job's return value** (this is what orchestration-service's `waitUntilFinished()` receives — no separate queue needed for the reply).

## Related Code Files

- Create: `services/printify-service/src/printify/printify-api.service.ts`
- Create: `services/printify-service/src/printify/printify-cache.service.ts`
- Create: `services/printify-service/src/printify/printify-normalizer.service.ts`
- Create: `services/printify-service/src/printify/printify-import.processor.ts`
- Create: `services/printify-service/src/printify/printify-catalog.processor.ts`
- Create: `services/printify-service/src/raw-products/raw-product.schema.ts` (Mongoose)

## Implementation Steps

1. Wire `@nestjs/bullmq`'s `BullModule.forRootAsync` (Redis connection from env) and register the queues this service touches.
2. Wire Mongoose connection + `raw_products` schema.
3. Build `PrintifyApiService` (start with a couple of hardcoded/test API calls before wiring real credentials — credentials arrive via job payload from orchestration-service in Phase 4, don't invent local credential storage here).
4. Build `PrintifyCacheService` as its own module, separate from BullMQ wiring.
5. Build `PrintifyNormalizerService` — this is the core unit-tested business logic (raw fixture → `ProductDto`).
6. Build `@Processor('printify-import')`: consume → cache-check → fetch/normalize → save raw → produce `shopify-import` + `job-events`.
7. Build `@Processor('printify-catalog')`: consume → cache-check → fetch/normalize list → return value.

## Todo

- [x] BullMQ module wired, 2 consumers registered
- [x] Cache service isolated in its own module
- [x] Normalizer unit-tested with fixtures (valid + malformed raw input)
- [ ] Mongo raw_products write confirmed (deferred — no manual smoke test run; will be exercised naturally once orchestration-service enqueues real jobs in Phase 4)
- [x] Inline comments explain job/queue/worker/producer/consumer at first appearance

## Success Criteria

Manually enqueueing a `printify-import` job (e.g. via a script or Bull Board) results in a normalized `ProductDto` job landing on `shopify-import`, and a raw doc appearing in MongoDB.

**Status**: code complete, `tsc --noEmit` clean, app boots cleanly with Redis+Mongo running locally. Full live pipeline run (real job → Mongo write → produced jobs) not manually smoke-tested — deferred to Phase 4 when orchestration-service produces real `printify-import` jobs end-to-end.

## Resolution Notes

- Files created: `printify-api.module.ts`/`.service.ts` (HTTP client, credential passed per-call, not stored locally), `printify-cache.module.ts`/`.service.ts` (plain `ioredis`, separate from BullMQ connection), `printify-normalizer.service.ts` + `.spec.ts` (raw Printify JSON → `CreateProductDto`, 2 tests: valid + missing required field), `printify-raw-product.interface.ts` (raw Printify shape typings), `raw-products/raw-product.schema.ts` (Mongoose schema), `printify-import.processor.ts` (`@Processor('printify-import')`, consumer + producer to `shopify-import`/`job-events`), `printify-catalog.processor.ts` (`@Processor('printify-catalog')`, sync-over-async — returns `CreateProductDto[]` as job return value), `printify.module.ts` (wires all of the above + registers all 4 queues).
- Gap found from Phase 2: `@hopper/product-contract` had no `src/index.ts` barrel export and no `build` script — added both (`export * from './product.interface'; export * from './create-product.dto';` + `"build": "tsc"`), otherwise no consuming service could import it.
- `incremental: true` removed from shared `tsconfig.base.json` — it conflicted with Nest CLI's `deleteOutDir: true` (nest-cli.json default): tsc's `.tsbuildinfo` cache thought output was up-to-date after Nest CLI wiped `dist/`, so it silently skipped re-emitting `dist/main.js` on every `start:dev` restart. Root cause: `incremental` only pays off for repeated same-process `tsc` invocations (CI, `tsc -b`), not Nest's watch mode. Not re-added anywhere (YAGNI — no package in this repo is large enough to need it yet).
- Local dev dependencies: Redis and MongoDB run as ad-hoc `docker run` containers (not docker-compose yet — that's Phase 7), `.env` holds `REDIS_URL`/`MONGO_URL`/`PRINTIFY_CACHE_TTL_SECONDS`.
- Verified: `npx tsc -p services/printify-service/tsconfig.json --noEmit` clean. `npm test -w services/printify-service` passes (normalizer unit tests). `npm run start:dev -w services/printify-service` boots cleanly with all modules (`PrintifyApiModule`, `PrintifyCacheModule`, `MongooseModule`, `PrintifyModule` incl. both processors + 4 registered queues) with Redis+Mongo running locally.
