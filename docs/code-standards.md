# Code Standards

Conventions actually established through Phase 1-3. Updated as new patterns emerge in later phases — this is observed practice, not aspirational.

## File naming

Kebab-case for all TypeScript files: `printify-cache.service.ts`, `create-product.dto.ts`, `raw-product.schema.ts`. Nest suffix conventions kept (`.service.ts`, `.module.ts`, `.processor.ts`, `.schema.ts`, `.spec.ts`).

## NestJS module shape

- `providers`: classes this module owns and instantiates directly (`@Injectable()`/`@Processor()`), not wrapped in their own `@Module`.
- `imports`: other `@Module`-decorated classes — either to use their exported providers, or simply to get them registered in Nest's DI tree so they bootstrap at all. This matters for background workers: a `@Processor` class not reachable from `AppModule`'s import tree never starts, even though nothing calls it directly.
- `exports`: which of a module's own providers other importing modules may inject.
- `controllers`: HTTP-only — omitted entirely from queue-only modules (e.g. `PrintifyModule`).

Example: `PrintifyApiModule` and `PrintifyCacheModule` each own one service and export it; `PrintifyModule` imports both purely to make their providers available to its own processors, not to re-export them further.

## Redis: two roles, never mixed

Redis is used two distinct ways in this codebase, and the two must stay in separate modules:

- **Queue role** — `@nestjs/bullmq`'s own internally-managed connection (`BullModule`, `@InjectQueue`, `@Processor`/`WorkerHost`). Has job semantics: retries, backoff, job status.
- **Cache role** — a plain `ioredis` client instantiated manually (`PrintifyCacheService`), simple `GET`/`SET EX`, no job semantics.

Rule: no `@Processor` class holds a raw `ioredis` client, and no cache-role module imports `BullModule`.

## DTO validation

Class-validator decorators (`@IsString`, `@IsNumber`, `@ValidateNested({ each: true })` + `@Type(() => ...)` for nested arrays) on DTOs mirroring the `Product`/`ProductImage`/`ProductVariant` interfaces in `@hopper/product-contract`. Adapters validate their normalized output via `class-validator`'s `validate()` before enqueueing/consuming, throwing on validation failure rather than silently passing bad data downstream.

## `unknown` vs `any`

External API responses (e.g. Printify's) are typed `unknown` at the HTTP boundary, then cast (`as IPrintifyRawProduct`) only at the point of use in the normalizer. This forces an explicit cast instead of silently allowing property access — but a wrong cast shape still compiles cleanly (TS can't verify a cast from `unknown`), so cast correctness is a runtime concern verified by tests, not the compiler.

## TypeScript build config

`tsconfig.base.json` does **not** set `incremental: true`. It was tried and removed: Nest CLI's `deleteOutDir: true` (its `nest-cli.json` default) wipes `dist/` on every `start:dev` restart, but tsc's `.tsbuildinfo` cache doesn't know that — it assumes output is still up to date and skips re-emitting, causing a silent `Cannot find module dist/main` error. `incremental` only pays off across separate `tsc` process invocations (CI, `tsc -b`), which nothing in this repo does yet — YAGNI, don't re-add it without that use case.

## Shared package barrel exports

Every workspace package meant to be imported elsewhere (`@hopper/product-contract`) needs a `src/index.ts` re-exporting its public surface (`export * from './x'`) AND a `build` script in its `package.json`. Without both, `package.json`'s `main`/`types` fields point at a `dist/` that never gets generated, and consumers get `Cannot find module`.
