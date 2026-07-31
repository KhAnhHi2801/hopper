# System Architecture

## Full planned architecture

Green = built (Phase 1-3). Gray = planned, not implemented yet.

```mermaid
flowchart TD
    shell["shell (host)"] -.lazy-loads.-> catalogMfe["catalog-mfe"]
    shell -.lazy-loads.-> jobStatusMfe["job-status-mfe"]
    shell -->|HTTP| gateway["api-gateway<br/>(only sync entry)"]
    gateway -->|HTTP| orch["orchestration-service<br/>(decides what to enqueue)"]
    orch -->|read/write| postgres[("Postgres<br/>credentials, job_status")]
    orch -->|enqueue printify-import| redisQ{{"BullMQ / Redis"}}
    redisQ -->|consume| printify["printify-service<br/>fetch Printify API, Redis CACHE,<br/>store raw → MongoDB, normalize"]
    printify -->|read/write| mongo[("MongoDB<br/>raw_products")]
    printify -->|produce shopify-import| shopify["shopify-service<br/>map ProductDto → GraphQL,<br/>call Shopify Admin API"]
    printify -->|produce job-events| orch

    classDef built fill:#2e7d32,stroke:#1b5e20,color:#fff;
    classDef planned fill:#9e9e9e,stroke:#616161,color:#fff;
    class printify,mongo,redisQ built;
    class shell,catalogMfe,jobStatusMfe,gateway,orch,postgres,shopify planned;
```


## What's built (Phase 1-3)

Only `printify-service` and `packages/product-contract` exist. `printify-service` is both a BullMQ consumer and producer:

- **Consumes**: `printify-import` (fire-and-forget import of one product), `printify-catalog` (sync-over-async catalog page fetch — returns the result as the job's return value instead of a separate reply queue).
- **Produces**: `shopify-import` (hands off a normalized `ProductDto` — no consumer exists yet, this queue just accumulates until shopify-service is built), `job-events` (status updates — same, no consumer yet until orchestration-service is built).

### Redis's two roles

Both live in `services/printify-service` today, in separate modules:

- **Queue role**: `@nestjs/bullmq`'s managed connection — `BullModule.forRootAsync` (connection) + `BullModule.registerQueue(...)` (which queues this service touches) + `@Processor` classes (consumers) + `@InjectQueue().add()` (producers).
- **Cache role**: plain `ioredis` client in `PrintifyCacheService` — simple `GET`/`SET EX` in front of the real Printify API call, TTL from env. No job semantics.

### MongoDB

Owned by `printify-service`: single `raw_products` collection with a `platform` discriminator field (not one collection per source platform) — stores the raw Printify JSON response before normalization, for debugging/replay.

### `printify-service` module map

What actually imports/depends on what inside the one service that's built. Solid arrow = `imports` (DI wiring); dashed arrow = calls a method on an injected class at runtime.

```mermaid
flowchart TD
    subgraph AppModule
        direction TB
        Config["ConfigModule<br/>(.env)"]
        BullRoot["BullModule.forRootAsync<br/>(Redis connection)"]
        MongoRoot["MongooseModule.forRootAsync<br/>(MongoDB connection)"]
    end

    AppModule -->|imports| PrintifyModule

    subgraph PrintifyModule
        direction TB
        ApiMod["PrintifyApiModule"] --> ApiSvc["PrintifyApiService<br/>(HTTP → real Printify API)"]
        CacheMod["PrintifyCacheModule"] --> CacheSvc["PrintifyCacheService<br/>(ioredis GET/SET, cache role)"]
        Normalizer["PrintifyNormalizerService<br/>(raw JSON → CreateProductDto)"]
        ImportProc["PrintifyImportProcessor<br/>@Processor('printify-import')"]
        CatalogProc["PrintifyCatalogProcessor<br/>@Processor('printify-catalog')"]
        RawSchema[("raw_products<br/>Mongoose schema")]
    end

    ImportProc -.uses.-> ApiSvc
    ImportProc -.uses.-> CacheSvc
    ImportProc -.uses.-> Normalizer
    ImportProc -.writes.-> RawSchema
    ImportProc -->|produce| ShopifyQ{{"shopify-import queue"}}
    ImportProc -->|produce| EventsQ{{"job-events queue"}}

    CatalogProc -.uses.-> ApiSvc
    CatalogProc -.uses.-> CacheSvc
    CatalogProc -.uses.-> Normalizer
    CatalogProc -->|returns list via<br/>waitUntilFinished| CatalogCaller["future caller<br/>(orchestration-service, Phase 4)"]

    classDef built fill:#2e7d32,stroke:#1b5e20,color:#fff;
    classDef planned fill:#9e9e9e,stroke:#616161,color:#fff;
    class ApiMod,ApiSvc,CacheMod,CacheSvc,Normalizer,ImportProc,CatalogProc,RawSchema,ShopifyQ,EventsQ built;
    class CatalogCaller planned;
```

Reading it: `AppModule` only imports `PrintifyModule` to get its processors registered in Nest's DI tree — nothing calls `PrintifyModule`'s providers directly. Both processors depend on the same 3 services (`ApiService`, `CacheService`, `Normalizer`) but never touch each other; they're two independent entry points triggered only by jobs landing on their respective queues.

### Normalization

`PrintifyNormalizerService` converts raw Printify JSON into `CreateProductDto` (from `@hopper/product-contract`), validating the result before it's used. Known traps handled here: Printify prices are integer cents (÷100 → major-unit decimal), Printify's own `images[].position` is a shot-angle string unrelated to the contract's index-based `position` number, and Printify's `visible: boolean` maps onto the contract's `status` enum.

## Not yet built (Phase 4-15)

- **Postgres** (`credentials` envelope-encrypted, `job_status`) — owned by orchestration-service, not implemented.
- **orchestration-service** — decision logic, credential decryption, `job-events` consumer.
- **shopify-service** — GraphQL Admin API client, `shopify-import` consumer.
- **api-gateway** — the only planned synchronous HTTP entry point.
- **Frontend MFEs** — `shell`, `catalog-mfe`, `job-status-mfe`.
- **docker-compose**, **CI**.

Full detail and the queue table (producer/consumer per queue) is in `plans/260728-2056-pod-to-shopify-import-system/plan.md`.
