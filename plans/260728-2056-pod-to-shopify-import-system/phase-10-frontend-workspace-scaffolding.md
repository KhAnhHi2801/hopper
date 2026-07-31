---
title: "Phase 10: Frontend workspace scaffolding"
status: todo
---

# Phase 10: Frontend workspace scaffolding

## Overview

Scaffold the 3 Vite + React + TypeScript apps (`shell`, `catalog-mfe`, `job-status-mfe`) with Module Federation wired, and prove the host can load a placeholder remote component before writing any real feature code.

## Requirements

- [ ] `apps/*` added to root npm workspaces
- [ ] 3 Vite+React+TS apps scaffolded
- [ ] Module Federation configured in all three (`@originjs/vite-plugin-federation` or `@module-federation/vite` — pick one, pin version)
- [ ] Shell successfully lazy-loads a placeholder "Hello from catalog-mfe" component end-to-end

## Concepts to understand before doing this phase

- Module Federation host/remote model: a **remote** exposes named modules via a generated `remoteEntry.js`; a **host** declares remote URLs and can `import()` those exposed modules at runtime as if they were local.
- The **shared** config's `singleton: true` requirement — without it, host and remote can each bundle their own copy of React, causing "Invalid hook call" errors. This is the #1 mistake people make with Vite MF.

## Architecture

```ts
// shell/vite.config.ts (host)
federation({
  name: 'shell',
  remotes: {
    catalog_mfe: 'http://localhost:5001/assets/remoteEntry.js',
    job_status_mfe: 'http://localhost:5002/assets/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
  },
})
// catalog-mfe/vite.config.ts (remote) — job-status-mfe mirrors this
federation({
  name: 'catalog_mfe',
  filename: 'remoteEntry.js',
  exposes: { './CatalogApp': './src/CatalogApp.tsx' },
  shared: { react: { singleton: true, requiredVersion: '^18.3.0' }, 'react-dom': { singleton: true, requiredVersion: '^18.3.0' } },
})
```
Pin identical React major.minor across all 3 apps, hoisted via npm workspaces so there's physically one `node_modules/react`. Only host↔remote sharing, never remote-to-remote.

Note: Vite MF dev-mode (`vite dev`) support has historically been rougher than Webpack MF's; if it proves unstable, fall back to `vite preview` (built) even during local dev for the apps you're not actively iterating on.

## Related Code Files

- Create: `apps/shell/vite.config.ts`
- Create: `apps/catalog-mfe/vite.config.ts`
- Create: `apps/job-status-mfe/vite.config.ts`

## Implementation Steps

1. Add `"apps/*"` to root workspaces.
2. `npm create vite@latest` for each of the 3 apps (react-ts template).
3. Install and configure the chosen MF plugin in all three (pin the exact version, document the choice in Open Decisions resolution).
4. Expose a trivial `CatalogApp` component from `catalog-mfe`, import it lazily from `shell`, confirm it renders.
5. Repeat for `job-status-mfe`.

## Todo

- [ ] All 3 apps scaffolded and running individually
- [ ] MF plugin chosen, pinned, configured with explicit `singleton: true`
- [ ] Shell renders both placeholder remote components

## Success Criteria

Running all 3 apps (dev or preview) and opening `shell` shows both placeholder remote components rendered without React duplicate-instance errors.
