---
title: "Phase 1: Workspace scaffolding"
status: completed
---

# Phase 1: Workspace scaffolding

## Overview

Set up the npm workspaces monorepo skeleton that every other phase builds on: root `package.json` with workspaces, `tsconfig.base.json`, and the 4 NestJS service shells (empty `nest new` apps, no business logic yet).

## Requirements

- [x] Root `package.json` with `"workspaces": ["services/*", "packages/*", "apps/*"]`
- [x] `tsconfig.base.json` at root; each service `extends` it
- [x] 4 NestJS apps scaffolded via `nest new` under `services/`
- [x] Shared ESLint/Prettier config at root

## Concepts to understand before doing this phase

- npm workspaces: single `npm install` at root, symlinked `node_modules` so local packages reference each other via `"workspace:*"` instead of publishing to a registry — this is what lets `apps/shell` and the MFE remotes share exactly one copy of React later.

## Implementation Steps

1. Create root `package.json` (`"private": true`, `workspaces` field).
2. `nest new services/api-gateway`, `nest new services/orchestration-service`, `nest new services/printify-service`, `nest new services/shopify-service` (choose npm as package manager).
3. Create `tsconfig.base.json`, wire each service's `tsconfig.json` to `extends` it.
4. `npm install` from root only; verify workspace symlinks and that `npm run start:dev -w services/api-gateway` (or equivalent) works.

## Todo

- [x] Root package.json + workspaces field
- [x] tsconfig.base.json + per-service extends
- [x] 4 services scaffolded
- [x] Root install verified, one service runs via -w flag

## Success Criteria

`npm install` at root succeeds with one shared `node_modules`; each of the 4 services starts individually via a root-level workspace command.

## Resolution Notes

- ESLint: shared `eslint.config.base.mjs` at root (`export const baseConfig`), all 4 services' `eslint.config.mjs` import it via `../../eslint.config.base.mjs` + spread `...baseConfig`, each keeping its own `tsconfigRootDir`. User's own fix used `fileURLToPath(new URL('.', import.meta.url))` instead of `import.meta.dirname` for `__dirname` — a more backward-compatible Node API, sidesteps the editor's stale-TS-engine squiggle entirely. Verified: `npm run lint` clean (0 errors) on all 4 services.
- Prettier: `.prettierrc` hoisted to root, removed from all 4 services (Prettier auto-discovers upward). Verified via filesystem check.
- `baseUrl` removed from all 4 services' `tsconfig.json` (YAGNI — unused, no path-alias imports exist yet). Verified via grep — clean on all 4.
- Cosmetic-only, non-blocking: a `Property 'dirname' does not exist on type 'ImportMeta'` red squiggle appeared transiently in the editor before the `fileURLToPath` fix — root cause was VS Code's bundled TypeScript vs the workspace's `5.9.3`; moot now since the code no longer uses `import.meta.dirname`.
