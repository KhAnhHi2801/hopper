---
title: "Phase 12: Catalog mfe"
status: todo
---

# Phase 12: Catalog mfe

## Overview

Remote MFE for browsing Printify products and triggering an import — the frontend consumer of the `GET /catalog/printify` and `POST /imports` endpoints built in Phase 4/6.

## Requirements

- [ ] Product list UI backed by `GET /catalog/printify` (paginated)
- [ ] Selection UI
- [ ] "Import" action calling `POST /imports`
- [ ] Pending/optimistic state after triggering import
- [ ] Error state for the BullMQ sync-over-async timeout degraded path (from Phase 4)

## Implementation Steps

1. Build the list component, calling `GET /catalog/printify?page=&limit=`.
2. Add pagination controls.
3. Add selection state + "Import" button calling `POST /imports`.
4. Handle the 3 response shapes from the backend: immediate list, timeout-degraded response (202 + poll id), and hard error — each needs its own UI state.

## Todo

- [ ] List + pagination working
- [ ] Import trigger working
- [ ] All 3 backend response shapes handled distinctly in the UI

## Success Criteria

Selecting a Printify product and clicking Import results in a visible pending state and, shortly after, a job id the user can hand off to job-status-mfe.
