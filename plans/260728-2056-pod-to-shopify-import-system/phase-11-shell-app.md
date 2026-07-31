---
title: "Phase 11: Shell app"
status: todo
---

# Phase 11: Shell app

## Overview

Build out the host app: routing, lazy-loaded remotes, per-remote error isolation, and loading states.

## Requirements

- [ ] `react-router-dom` routing between catalog and job-status views
- [ ] `React.lazy(() => import('catalog_mfe/CatalogApp'))` (and job-status equivalent)
- [ ] Per-remote error boundaries — one remote crashing must not blank the whole shell
- [ ] Loading/skeleton states while remote chunks fetch

## Implementation Steps

1. Set up routes: `/catalog` → catalog-mfe, `/jobs` → job-status-mfe.
2. Wrap each lazy-loaded remote in its own `<ErrorBoundary>` + `<Suspense fallback={...}>`.
3. Basic nav/layout shell (this is the one place where a shared design system decision matters — see Open Decisions).
4. Verify: killing/breaking one remote's build doesn't prevent the other remote's route from working.

## Todo

- [ ] Routing wired
- [ ] Both remotes lazy-loaded with Suspense
- [ ] Error boundary isolation verified (break one remote on purpose, confirm the other still works)

## Success Criteria

Navigating between `/catalog` and `/jobs` loads the correct remote; deliberately breaking `catalog-mfe`'s build still leaves `/jobs` fully functional.
