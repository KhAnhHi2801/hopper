---
title: "Phase 13: Job status mfe"
status: todo
---

# Phase 13: Job status mfe

## Overview

Remote MFE for monitoring import job status — consumes `GET /imports` (list) and polls individual jobs.

## Requirements

- [ ] List view via `GET /imports`
- [ ] Per-job polling (simple interval fetch; SSE/websocket explicitly out of scope for MVP)
- [ ] Status badges mapped to the `job_status` enum (PENDING/NORMALIZED/COMPLETED/FAILED)

## Implementation Steps

1. Build the list view calling `GET /imports`.
2. Add a detail view (or inline expansion) that polls `GET /imports/:id` at a fixed interval while status is non-terminal.
3. Map status values to visual badges; stop polling once COMPLETED/FAILED.

## Todo

- [ ] List view working
- [ ] Polling starts/stops correctly based on status
- [ ] Status badges correct for all 4 states

## Success Criteria

Triggering an import from catalog-mfe and switching to job-status-mfe shows the job progressing through PENDING → NORMALIZED → COMPLETED/FAILED without manual refresh, and polling stops once terminal.
