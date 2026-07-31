---
title: "Phase 14: Frontend tests"
status: todo
---

# Phase 14: Frontend tests

## Overview

Set up Vitest + React Testing Library for all 3 frontend apps, including the pattern for testing components that consume federated remote imports.

## Requirements

- [ ] Vitest configured per app (shares `vite.config.ts` transform pipeline — no separate bundler config)
- [ ] React Testing Library for component tests
- [ ] Federated import mocking pattern documented once, reused across apps

## Concepts to understand before doing this phase

- Why Vitest instead of Jest here: Vitest reuses Vite's exact config/transform (same path aliases, same esbuild/SWC), so there's no second bundler config to maintain — this is the idiomatic choice for a Vite project, same as Jest is idiomatic for NestJS. Two test runners in one monorepo is normal, not inconsistency.
- Federated imports (`import('catalog_mfe/CatalogApp')`) can't resolve in a unit test run outside a live federation host — they must be mocked/stubbed at the module level.

## Implementation Steps

1. Configure Vitest in each of the 3 apps.
2. Write the shell's tests: routing, error boundary behavior (force a mocked remote import to throw), loading states — with the remote import mocked.
3. Write catalog-mfe tests: list rendering, selection, import trigger, all 3 backend response states from Phase 12.
4. Write job-status-mfe tests: list rendering, polling start/stop logic, status badge mapping.

## Todo

- [ ] Vitest running in all 3 apps
- [ ] Federated import mock pattern established and reused
- [ ] Shell error boundary test forces and catches a mocked remote failure
- [ ] catalog-mfe and job-status-mfe core interactions tested

## Success Criteria

`npm test --workspaces` (or equivalent per-app Vitest run) passes for all 3 frontend apps, including at least one test proving the error boundary isolates a failing remote.
