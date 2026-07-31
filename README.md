# Hopper

> POD → sales channel product import system (Printify → Shopify). Personal upskilling project — practicing fullstack patterns used in production systems, not a commercial product.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Status & License](#status--license)

## About

Hopper imports products from a print-on-demand platform (Printify) into a sales channel (Shopify). The scope is intentionally kept small — the goal is to practice patterns that come up in real fullstack/backend jobs, not to build a full commercial product:

- NestJS module design (DI, decorators, module boundaries)
- Async messaging with BullMQ
- Redis in two distinct roles (job queue vs. read-through cache)
- MongoDB for raw external-API data storage
- Envelope-encrypted credential storage (planned)
- GraphQL Admin API integration (planned)
- Micro-frontend architecture with Module Federation (planned)

## Tech Stack

| Layer | Tech |
|---|---|
| Backend framework | NestJS |
| Language | TypeScript |
| Queue / async messaging | BullMQ (Redis) |
| Cache | Redis (ioredis) |
| Database | MongoDB (Mongoose), PostgreSQL (planned) |
| Validation | class-validator / class-transformer |
| Testing | Jest |
| Monorepo tooling | npm workspaces |
| Frontend (planned) | React, Vite, Module Federation |

## Project Structure

```
Hopper/
├── docs/                        detailed documentation (architecture, standards, roadmap...)
├── packages/
│   └── product-contract/        shared DTO/interface used across services
└── services/
    └── printify-service/        fetches Printify data, caches, normalizes, queues via BullMQ
```

Services planned but not yet implemented (`orchestration-service`, `shopify-service`, `api-gateway`) and the frontend apps under `apps/` are tracked in the [roadmap](docs/project-roadmap.md).

## Getting Started

### Prerequisites

- Node.js + npm (workspace-aware — root `package.json` declares `services/*`, `packages/*`, `apps/*`)
- Docker (for local Redis + MongoDB)

### Installation & Run

```bash
docker run -d --name hopper-redis -p 6379:6379 redis:7
docker run -d --name hopper-mongo -p 27017:27017 mongo:7

npm install
npm run build -w packages/product-contract
npm run start:dev -w services/printify-service
```

Full setup, env vars, and known local-dev issues: [`docs/deployment-guide.md`](docs/deployment-guide.md).

## Documentation

Full documentation lives in [`docs/`](docs/):

| File | Content |
|---|---|
| [`project-overview-pdr.md`](docs/project-overview-pdr.md) | Goals, scope, MVP definition |
| [`system-architecture.md`](docs/system-architecture.md) | Architecture, queue table, Mermaid diagrams |
| [`code-standards.md`](docs/code-standards.md) | Conventions, module design rules |
| [`codebase-summary.md`](docs/codebase-summary.md) | Repo layout, file-by-file purpose |
| [`deployment-guide.md`](docs/deployment-guide.md) | Local dev setup |
| [`project-roadmap.md`](docs/project-roadmap.md) | Phase-by-phase status |
| [`design-guidelines.md`](docs/design-guidelines.md) | UI conventions (placeholder — no frontend yet) |

## Roadmap

Currently at **Phase 3 of 15**. See [`docs/project-roadmap.md`](docs/project-roadmap.md) for the full phase breakdown and what's next.

## Status & License

Work in progress, built for personal practice. Source is public for visibility/portfolio purposes only — no license is granted for reuse, and the repo is not open to external contributions.
