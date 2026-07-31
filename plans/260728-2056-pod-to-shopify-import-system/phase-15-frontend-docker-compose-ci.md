---
title: "Phase 15: Frontend docker compose ci"
status: todo
---

# Phase 15: Frontend docker compose ci

## Overview

Wire the 3 frontend apps into docker-compose (build + serve static, not `vite dev` in containers) and extend GitHub Actions CI to cover them.

## Requirements

- [ ] docker-compose services for `shell`, `catalog-mfe`, `job-status-mfe` — build static assets, serve via nginx/`serve`
- [ ] Remote URLs as build/runtime env vars, not hardcoded localhost (compose networking differs from local dev)
- [ ] GitHub Actions matrix extended with the 3 frontend apps: lint, `vitest run --coverage`, `vite build`
- [ ] Optional: smoke job that composes-up shell+remotes and curls each `remoteEntry.js`

## Architecture

```yaml
shell:          { build: ./apps/shell,          ports: ["3000:80"], depends_on: [catalog-mfe, job-status-mfe, api-gateway] }
catalog-mfe:    { build: ./apps/catalog-mfe,    ports: ["5001:80"] }
job-status-mfe: { build: ./apps/job-status-mfe, ports: ["5002:80"] }
```
Each Dockerfile: multi-stage `npm run build` → copy `dist/` into nginx/`serve` image.

## Related Code Files

- Modify: `docker-compose.yml` (from Phase 7)
- Modify: `.github/workflows/ci.yml` (from Phase 8)
- Create: `apps/*/Dockerfile`

## Implementation Steps

1. Write Dockerfiles for the 3 apps (multi-stage build → static serve).
2. Add the 3 services to `docker-compose.yml`, wire `VITE_CATALOG_MFE_URL`/`VITE_JOB_STATUS_MFE_URL` as build/runtime env vars.
3. Extend the CI matrix with the 3 app names, using `vitest run --coverage` and `vite build` as the test/build steps.
4. (Optional) add a smoke-test CI job that boots the compose stack and curls each `remoteEntry.js`.

## Todo

- [ ] All 3 frontend apps buildable via Docker
- [ ] `docker-compose up` (full stack: 4 backend + 3 frontend + 3 datastores) works end-to-end
- [ ] CI matrix green for all 7 apps/services total

## Success Criteria

A clean `docker-compose up` brings up the entire system (7 apps/services + redis/postgres/mongo); a full happy-path import is achievable purely by clicking through the shell UI; CI is green across all apps and services.
