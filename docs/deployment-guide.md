# Deployment Guide

Scope: local dev setup as it exists today (Phase 1-3). `docker-compose` (all services + infra in one command) is Phase 7 — not built yet. For now, infra runs as ad-hoc `docker run` containers.

## Prerequisites

- Node.js, npm (workspaces-aware — repo root `package.json` declares `services/*`, `packages/*`, `apps/*`)
- Docker (for local Redis + MongoDB containers)

## Local infrastructure

```bash
docker run -d --name hopper-redis -p 6379:6379 redis:7
docker run -d --name hopper-mongo -p 27017:27017 mongo:7
```

These are ad-hoc, not managed by a compose file yet — restart manually (`docker start hopper-redis hopper-mongo`) after a machine reboot.

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
