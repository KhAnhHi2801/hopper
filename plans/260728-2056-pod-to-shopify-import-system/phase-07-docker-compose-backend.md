---
title: "Phase 7: Docker compose backend"
status: todo
---

# Phase 7: Docker compose backend

## Overview

Bring up all 4 backend services + Redis + Postgres + MongoDB locally via one `docker-compose up`.

## Requirements

- [ ] Dockerfile per service (multi-stage: install workspace deps at root, build, run)
- [ ] `redis:7`, `postgres:16` (local dev; Supabase connection string via env for non-local), `mongo:7`
- [ ] Healthchecks on all containers
- [ ] `.env.example` documenting every required env var, no real secrets committed

## Related Code Files

- Create: `docker-compose.yml`
- Create: `services/*/Dockerfile`
- Create: `.env.example`

## Implementation Steps

1. Write a Dockerfile per service — multi-stage build accounting for the npm workspaces root install (can't just `npm install` inside the service folder alone; need root context).
2. Write `docker-compose.yml` with all 4 services + redis/postgres/mongo, correct `depends_on` + healthchecks.
3. Write `.env.example` listing `MASTER_KEY`, `PRINTIFY_API_KEY`, `SHOPIFY_*`, `REDIS_URL`, `DATABASE_URL`, `MONGO_URL` as placeholders.

## Todo

- [ ] All 4 service Dockerfiles build successfully
- [ ] `docker-compose up` brings everything up healthy
- [ ] `.env.example` complete, no real secrets

## Success Criteria

`docker-compose up` from a clean checkout (with a real `.env` filled in) brings up all 4 services + 3 datastores healthy, and a manual `POST /imports` through api-gateway completes end-to-end.
