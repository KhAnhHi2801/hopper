# Deployment Guide

Scope: local dev setup as it exists today (Phase 1-3). `docker-compose` (all services + infra in one command) is Phase 7 — not built yet. For now, infra runs as ad-hoc `docker run` containers. `printify-service` has a standalone `Dockerfile` (see "Docker image (printify-service)" below); it isn't wired into a compose file yet.

## Prerequisites

- Node.js, npm (workspaces-aware — repo root `package.json` declares `services/*`, `packages/*`, `apps/*`)
- Docker (for local Redis + MongoDB containers)

## Local infrastructure

```bash
docker run -d --name hopper-redis -p 6379:6379 redis:7
docker run -d --name hopper-mongo -p 27017:27017 mongo:7
```

These are ad-hoc, not managed by a compose file yet — restart manually (`docker start hopper-redis hopper-mongo`) after a machine reboot.

## Docker image (printify-service)

`services/printify-service/Dockerfile` — multi-stage build (`builder` compiles, `runner` ships only `node_modules` + compiled `dist/`). Build context must be the **repo root**, not the service folder — `printify-service` imports `@hopper/product-contract` via npm workspace, so the build needs to see `packages/product-contract` too:

```bash
docker build -f services/printify-service/Dockerfile -t khanhhi/hopper-printify-service .
```

**COPY order is layer-cache-driven, not arbitrary.** `package.json`/`package-lock.json` (root, `product-contract`, `printify-service`) are copied and `npm ci` runs _before_ any source code is copied. If source were copied first (or via a blanket `COPY . .`), any code change — even in an unrelated file — would invalidate the `npm ci` layer and force a full reinstall on every build. Splitting it keeps `npm ci` cached across ordinary code edits.

**Runner stage must copy `product-contract`'s `package.json`, not just its `dist/`.** Node resolves `require('@hopper/product-contract')` by reading that package's `package.json` (`"main": "dist/index.js"`) — copying only `dist/` leaves the module unresolvable at runtime (`Cannot find module '@hopper/product-contract'`) even though the build succeeds.

Running the image standalone (`docker run --rm -p 3000:3000 ...`) will log Mongo/Redis connection errors — expected until `docker-compose.yml` (Phase 7) provides `MONGO_URL`/`REDIS_URL` pointing at service names on a shared network, not `localhost`.

## Environment variables

`services/printify-service/.env` (gitignored):

```
REDIS_URL=redis://localhost:6379
MONGO_URL=mongodb://localhost:27017/printify
PRINTIFY_CACHE_TTL_SECONDS=3600
```

## Common commands

```bash
# install a workspace's dependencies (run plain `npm install` once after adding a new workspace package, before -w flags work)
npm install -w services/printify-service <package>

# build the shared contract package (required before consuming services can import it)
npm run build -w packages/product-contract

# run tests for one workspace
npm test -w services/printify-service

# start printify-service in watch mode (requires Redis + MongoDB running)
npm run start:dev -w services/printify-service

# typecheck without emitting
npx tsc -p services/printify-service/tsconfig.json --noEmit
```

## Known local-dev gotchas

- If `start:dev` throws `Cannot find module dist/main` after restarting, it's the Nest CLI `deleteOutDir` / tsc `.tsbuildinfo` conflict — see `code-standards.md`. Delete `dist/` and any `.tsbuildinfo` and restart; this shouldn't recur now that `incremental` is removed from `tsconfig.base.json`.
- `[ioredis] Unhandled error event: ECONNREFUSED` on boot means the Redis container isn't running — start it and restart the service.

## CI/CD (GitHub Actions)

Workflows live in `.github/workflows/`:

| Workflow                 | Trigger                                         | Purpose                                                       |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------- |
| `unit_tests.yml`         | PR opened against `main` or `development`       | `npm ci` → `npm run build` → `npm test` across all workspaces |
| `claude-code-review.yml` | PR opened/synchronized/reopened                 | Automated Claude code review posted on the PR                 |
| `claude.yml`             | Issue/PR comment or review containing `@claude` | Runs Claude Code against the triggering comment/issue         |

### `unit_tests.yml` build order

`npm run build` (root) runs `npm run build --workspaces --if-present`, which walks workspaces in the order listed in root `package.json`'s `workspaces` array: `packages/*` before `services/*` before `apps/*`. This order is load-bearing — `printify-service` imports `@hopper/product-contract`, which only exists after `packages/product-contract`'s `tsc` build runs. If `services/*` is ever moved ahead of `packages/*` in that array, CI (and any fresh clone) will fail with `Cannot find module '@hopper/product-contract'`.

`orchestration-service`'s `build` script is `prisma generate && nest build` — the generated Prisma client (`src/generated/prisma/`) is gitignored, so a fresh CI checkout has no client until `prisma generate` runs. Don't drop the `prisma generate` step from that build script or CI breaks with `Cannot find module '../generated/prisma/client'`.

### Claude workflows

`claude-code-review.yml` and `claude.yml` both need the `CLAUDE_CODE_OAUTH_TOKEN` repo secret set. `claude.yml` only fires when a comment/issue body contains `@claude` — it does not run on every PR.
