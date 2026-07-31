# Codebase Summary

Scope: what's actually implemented (Phase 1-3). See `project-roadmap.md` for what's still pending.

## Repo layout

```
Hopper/
├── package.json                 (npm workspaces: services/*, packages/*, apps/*)
├── tsconfig.base.json            (shared strict TS config, no `incremental`)
├── docs/                         (this directory)
├── plans/260728-2056-pod-to-shopify-import-system/  (the implementation plan)
├── packages/
│   └── product-contract/         (shared Product DTO/interface package)
└── services/
    └── printify-service/         (Printify source adapter — only service built so far)
```

## `packages/product-contract`

Shared, workspace-linked package (`@hopper/product-contract`) defining the intermediate product shape every adapter normalizes into / maps out of.

| File | Purpose |
|---|---|
| `src/product.interface.ts` | Plain TS interfaces/enums: `Product`, `ProductImage`, `ProductVariant`, `E_SOURCE_PLATFORM`, `E_PRODUCT_STATUS` |
| `src/create-product.dto.ts` | class-validator DTO mirror: `CreateProductDto`, `ProductImageDto`, `ProductVariantDto` |
| `src/index.ts` | Barrel export — required for `main`/`types` in `package.json` to resolve |
| `src/create-product.dto.spec.ts` | Validation-rule tests (valid input, negative price, missing required field) |

## `services/printify-service`

NestJS microservice. The Printify source adapter: fetches products from the real Printify API, caches responses in Redis, stores raw JSON in MongoDB, normalizes to `CreateProductDto`, and both consumes and produces BullMQ jobs.

| File | Purpose |
|---|---|
| `src/main.ts` | Bootstraps the Nest app |
| `src/app.module.ts` | Root module — owns BullMQ/Redis and Mongoose/MongoDB connections, imports `PrintifyModule` |
| `src/app.controller.ts`, `src/app.service.ts` | Default Nest CLI health-check boilerplate, unmodified |
| `src/printify/printify.module.ts` | Wires the Printify domain: sub-modules, `raw_products` schema, all 4 BullMQ queues, processors |
| `src/printify/printify-api.module.ts` / `printify-api.service.ts` | HTTP client to the real Printify REST API (`@nestjs/axios`) |
| `src/printify/printify-cache.module.ts` / `printify-cache.service.ts` | Redis CACHE-role client (plain `ioredis`, GET/SET EX), isolated from BullMQ |
| `src/printify/printify-normalizer.service.ts` | Core business logic: raw Printify JSON → validated `CreateProductDto` |
| `src/printify/printify-raw-product.interface.ts` | Untyped Printify API response shapes |
| `src/printify/printify-import.processor.ts` | `@Processor('printify-import')` — fire-and-forget consumer, produces `shopify-import` + `job-events` |
| `src/printify/printify-catalog.processor.ts` | `@Processor('printify-catalog')` — sync-over-async consumer, returns normalized list as job return value |
| `src/raw-products/raw-product.schema.ts` | Mongoose schema for the `raw_products` collection |

## Tests

Jest, colocated `*.spec.ts` files. Run per-package: `npm test -w packages/product-contract`, `npm test -w services/printify-service`.
