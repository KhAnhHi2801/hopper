---
title: "Phase 9: Jest test suites backend"
status: todo
---

# Phase 9: Jest test suites backend

## Overview

Consolidation pass: make sure the core business logic across all 4 services is actually covered by Jest, not just scaffolded. Not chasing 100% coverage — chasing test cases that prove the business logic is understood.

## Requirements

- [ ] `product-contract` DTO validation (from Phase 2)
- [ ] printify-service normalizer: valid fixture → correct `ProductDto`; malformed fixture → validation failure
- [ ] orchestration-service `ImportOrchestratorService` decision logic + `CredentialsService` encrypt/decrypt round-trip
- [ ] shopify-service mapper: `ProductDto` → GraphQL input shape assertions
- [ ] No e2e/controller test chasing for this MVP — unit tests on business logic only

## Implementation Steps

1. Audit each service for the core business-logic class named above; confirm each has a `.spec.ts`.
2. Add missing edge cases: malformed Printify fixture, credential decrypt with wrong key (should fail loudly, not silently), Shopify mapper with missing optional fields.
3. Run `npm test --workspaces` from root and confirm everything passes together (catches workspace resolution issues that per-service test runs might hide).

## Todo

- [ ] All 4 services have a business-logic spec file
- [ ] At least one negative/edge test per business-logic unit
- [ ] `npm test --workspaces` green from root

## Success Criteria

`npm test --workspaces` passes; each core business-logic class (normalizer, orchestrator, credentials, mapper) has both a happy-path and at least one failure-path test.
