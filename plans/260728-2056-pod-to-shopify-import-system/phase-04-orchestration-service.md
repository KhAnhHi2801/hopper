---
title: "Phase 4: Orchestration service"
status: todo
---

# Phase 4: Orchestration service

## Overview

The coordination brain: owns the only Postgres access in the system (`credentials`, `job_status`), decides what to enqueue, and is the sole holder/decryptor of secrets. Also hosts the sync-over-async catalog-listing endpoint.

## Requirements

- [ ] Postgres connection (Prisma recommended, not locked — open decision)
- [ ] `credentials` table + `CredentialsService` (envelope encryption)
- [ ] `job_status` table + `JobStatusService`
- [ ] `ImportOrchestratorService` — decision logic: resolve credential → enqueue `printify-import`
- [ ] REST controller consumed by api-gateway (`POST /imports`, `GET /imports/:id`, `GET /imports`, `GET /catalog/printify`)
- [ ] `@Processor('job-events')` — updates job status from adapter-reported events
- [ ] `printify-catalog` producer using `waitUntilFinished` (sync-over-async) with a hard timeout and a defined degraded path

## Architecture

**Envelope encryption** (KEK/DEK pattern used by AWS KMS/Vault): per-secret AES-256-GCM data key (DEK), DEK wrapped by a master key (KEK) from `MASTER_KEY` env. Store `{ciphertext, iv, authTag, wrappedDek, keyVersion}` per row. Only this service ever decrypts. Decrypted secret attaches to a job payload only for that job's lifetime — never persisted, never logged (mask in any logging interceptor). Set `removeOnComplete`/`removeOnFail` on queues carrying secrets.

**`job-events` consumer**: printify-service and shopify-service report `NORMALIZED`/`COMPLETED`/`FAILED` via this queue — this is why adapters never get direct Postgres write access; it keeps "services talk only via BullMQ" strictly true.

**Sync-over-async for catalog**:
```ts
const job = await catalogQueue.add('list', { page, limit });
const queueEvents = new QueueEvents('printify-catalog');
const result = await job.waitUntilFinished(queueEvents, 5000); // hard timeout
```
On timeout: define the degraded path now (recommended: return `202 Accepted` + poll-able job id, rather than a bare 5xx) — don't leave this implicit.

## Related Code Files

- Create: `services/orchestration-service/src/credentials/credentials.service.ts`
- Create: `services/orchestration-service/src/job-status/job-status.service.ts`
- Create: `services/orchestration-service/src/imports/import-orchestrator.service.ts`
- Create: `services/orchestration-service/src/jobs/job-events.processor.ts`
- Create: `services/orchestration-service/src/catalog/printify-catalog.controller.ts`

## Implementation Steps

1. Set up Postgres ORM, migrations for `credentials` and `job_status` tables (include `keyVersion` column now even though rotation isn't implemented).
2. Build `CredentialsService`: `encrypt()`/`decrypt()` round-trip, unit-tested without needing a real KMS.
3. Build `JobStatusService`: create/update job status rows.
4. Build `ImportOrchestratorService`: given `{printifyProductId, shopId}`, decrypt credential, create `job_status(PENDING)`, enqueue `printify-import` with `{jobId, printifyProductId, credential}`.
5. Build `@Processor('job-events')`: map incoming event → `job_status` update.
6. Build the catalog controller + `printify-catalog` producer with `waitUntilFinished` + timeout + degraded path.
7. Expose the REST controller api-gateway will proxy to.

## Todo

- [ ] Credentials encrypt/decrypt round-trip unit-tested
- [ ] ImportOrchestratorService decision logic unit-tested
- [ ] job-events consumer updates job_status correctly for all 3 event types
- [ ] Catalog sync-over-async timeout path implemented and tested (force a timeout in a test)

## Success Criteria

Triggering an import via this service's controller results in a `job_status` row progressing PENDING → NORMALIZED → COMPLETED/FAILED as `job-events` arrive; a catalog request either returns within the timeout or degrades gracefully.
