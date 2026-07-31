---
title: "Phase 8: Github actions ci backend"
status: todo
---

# Phase 8: Github actions ci backend

## Overview

CI for the 4 backend services: lint + test + build on every push/PR to main.

## Requirements

- [ ] Matrix job per service (`api-gateway`, `orchestration-service`, `printify-service`, `shopify-service`)
- [ ] Root `npm ci` to hydrate all workspaces before per-service steps
- [ ] `lint`, `test`, `build` steps per service
- [ ] npm cache configured

## Related Code Files

- Create: `.github/workflows/ci.yml`

## Implementation Steps

1. Write the workflow trigger (`on: push`, `on: pull_request` to `main`).
2. Set up a `strategy.matrix` over the 4 service names.
3. Steps: checkout → setup-node with npm cache → `npm ci` at root → `npm run lint -w services/<name>` → `npm test -w services/<name>` → `npm run build -w services/<name>`.

## Todo

- [ ] Workflow triggers correctly on push/PR
- [ ] All 4 services lint/test/build in the matrix
- [ ] npm cache reduces CI time on repeat runs

## Success Criteria

A push to a branch shows 4 green matrix jobs (one per service), each running lint, test, and build.
