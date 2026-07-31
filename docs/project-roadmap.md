# Project Roadmap

Mirrors the phase table in `plans/260728-2056-pod-to-shopify-import-system/plan.md` — that file is the source of truth for phase detail; this is a status summary.

| # | Phase | Status |
|---|---|---|
| 1 | Workspace scaffolding | Completed |
| 2 | Shared Product contract package | Completed |
| 3 | printify-service | Completed |
| 4 | orchestration-service | Pending |
| 5 | shopify-service | Pending |
| 6 | api-gateway | Pending |
| 7 | docker-compose (backend) | Pending |
| 8 | GitHub Actions CI (backend) | Pending |
| 9 | Jest test suites (backend) | Pending |
| 10 | Frontend workspace scaffolding (Module Federation) | Pending |
| 11 | Shell app | Pending |
| 12 | catalog-mfe | Pending |
| 13 | job-status-mfe | Pending |
| 14 | Frontend tests (Vitest) | Pending |
| 15 | Frontend docker-compose + CI wiring | Pending |

## Next up: Phase 4 — orchestration-service

Postgres access (Prisma assumed, not locked), `credentials` table + envelope-encrypted `CredentialsService` (KEK/DEK pattern), `job_status` table + `JobStatusService`, `ImportOrchestratorService` decision logic, REST controller for api-gateway, `@Processor('job-events')` consumer.
