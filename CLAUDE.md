# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

Read and follow, in this order: `./.claude/rules/primary-workflow.md` (delivery sequence), `./.claude/rules/development-rules.md` (must-follow when editing code/tests/config), `./.claude/rules/orchestration-protocol.md` (when spawning subagents), `./.claude/rules/documentation-management.md` (when touching `docs/` or `plans/`). Other rules live in `./.claude/rules/*`.

Before planning or implementing, read `./README.md` first for project context.

Skills: match the task against the installed-skills catalog before acting. Only modify skills under `~/.claude/skills` if the user explicitly asks — otherwise edit the project-local copy in this repo.

Reports: sacrifice grammar for concision; list unresolved questions at the end.

## Teaching Mode (this is a learning project)

Hopper exists to practice production patterns, not to ship fast. When asked to implement something here:
- Explain the concept and show at most a short illustrative snippet, then stop and let the user write the actual code.
- Do not argue YAGNI or trim scope to "simplify" — deliberately practicing full patterns is the point.
- Do not introduce new tooling (monorepo runners, extra frameworks, build systems) unless asked.
- After the user writes it, review for bugs and explain the why in plain language.

This mode applies unless the user explicitly asks for something to be built for them directly.

## Git

**DO NOT** use `chore` and `docs` in commit messages of file changes in `.claude` directory.

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When a tool call is blocked by the privacy-block hook, the output contains a JSON marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`. **You MUST use the `AskUserQuestion` tool** to get proper user approval.

**Required Flow:**

1. Parse the JSON from the hook output
2. Use `AskUserQuestion` with the question data from the JSON
3. Based on user's selection:
   - **"Yes, approve access"** → Use `bash cat "filepath"` to read the file (bash is auto-approved)
   - **"No, skip this file"** → Continue without accessing the file

**Example AskUserQuestion call:**
```json
{
  "questions": [{
    "question": "I need to read \".env\" which may contain sensitive data. Do you approve?",
    "header": "File Access",
    "options": [
      { "label": "Yes, approve access", "description": "Allow reading .env this time" },
      { "label": "No, skip this file", "description": "Continue without accessing this file" }
    ],
    "multiSelect": false
  }]
}
```

**IMPORTANT:** Always ask the user via `AskUserQuestion` first. Never try to work around the privacy block without explicit user approval.

## Python Scripts (Skills)

When running Python scripts from `.claude/skills/`, use the venv Python interpreter:
- **Linux/macOS:** `.claude/skills/.venv/bin/python3 scripts/xxx.py`
- **Windows:** `.claude\skills\.venv\Scripts\python.exe scripts\xxx.py`

This ensures packages installed by `install.sh` (google-genai, pypdf, etc.) are available.

When a skill script fails, report the failure first. Only fix and rerun it if the current task explicitly authorizes changing skill code.

## Modularization

- If a code file exceeds 200 lines, consider modularizing it
- Check existing modules before creating new
- Analyze logical separation boundaries (functions, classes, concerns)
- Use kebab-case naming with long descriptive names, it's fine if the file name is long because this ensures file names are self-documenting for LLM tools (Grep, Glob, Search)
- Write descriptive code comments
- After modularization, continue with main task
- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.

## Documentation Management

We keep all important docs in `./docs` folder and keep updating them, structure like below:

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

---

## Project Context

**Hopper** is a personal upskilling project: Printify → Shopify product import pipeline. Not a commercial product. Goal is practicing production fullstack/backend patterns (NestJS, BullMQ, Redis dual-role, MongoDB, workspace monorepo).

**Current status:** Phase 3 of 15 complete. Only `printify-service` and `packages/product-contract` are implemented. Everything else (`orchestration-service`, `shopify-service`, `api-gateway`, frontend MFEs) is scaffolded but empty.

Full docs in `docs/` — read `docs/system-architecture.md` for data flow diagrams and `docs/codebase-summary.md` for file-by-file purpose.

## Commands

### Root (all workspaces)
```bash
npm install                                    # install all workspace deps
```

### Per-service (replace `services/printify-service` as needed)
```bash
npm run start:dev -w services/printify-service  # dev watch mode
npm run build -w services/printify-service      # compile
npm run lint -w services/printify-service       # ESLint + Prettier fix
npm test -w services/printify-service           # Jest unit tests
npm run test:cov -w services/printify-service   # coverage
npm run test:e2e -w services/printify-service   # e2e (jest-e2e.json)
```

### Shared package (must build before services can resolve it)
```bash
npm run build -w packages/product-contract      # generates dist/ for consumers
```

### Local infrastructure
```bash
docker run -d --name hopper-redis -p 6379:6379 redis:7
docker run -d --name hopper-mongo -p 27017:27017 mongo:7
```

## Architecture Overview

### Data flow (what's built)
```
[BullMQ: printify-import] ──▶ PrintifyImportProcessor
                                  ├── PrintifyApiService (HTTP → Printify API, via ioredis cache)
                                  ├── PrintifyNormalizerService (raw → CreateProductDto)
                                  ├── raw_products (MongoDB)
                                  ├── [BullMQ: shopify-import]  ← no consumer yet
                                  └── [BullMQ: job-events]      ← no consumer yet

[BullMQ: printify-catalog] ──▶ PrintifyCatalogProcessor
                                  └── returns normalized list as job return value (sync-over-async)
```

### Redis: two roles, never mixed

| Role | Module | Mechanism |
|---|---|---|
| **Queue** | BullMQ (`@nestjs/bullmq`) | `BullModule.forRootAsync`, `@InjectQueue`, `@Processor`/`WorkerHost` |
| **Cache** | `PrintifyCacheService` (plain `ioredis`) | `GET`/`SET EX`, no job semantics |

A `@Processor` class must never hold a raw `ioredis` client; a cache-role module must never import `BullModule`.

### NestJS module wiring rule

`imports` = other `@Module` classes (for DI/providers). `providers` = classes this module instantiates directly. A `@Processor` not reachable from `AppModule`'s import tree **never starts** — this is a silent failure. Always trace the `AppModule → PrintifyModule → ...` chain when adding processors.

### Shared package contract

`packages/product-contract` (`@hopper/product-contract`) exports `CreateProductDto` (class-validator) and `Product` interfaces/enums. Every adapter normalizes into this shape. When editing, rebuild before consuming services pick up changes.

### `unknown` vs `any` at API boundaries

External API responses are typed `unknown` at the HTTP boundary, then explicitly cast (`as IPrintifyRawProduct`) only in the normalizer. Cast correctness is verified by tests, not the compiler.

### `tsconfig.base.json` — no `incremental`

`incremental: true` was removed: Nest CLI's `deleteOutDir: true` wipes `dist/` on every restart, but tsc's `.tsbuildinfo` assumes output is current — causes silent `Cannot find module dist/main`. Don't re-add `incremental` unless there's a non-Nest `tsc -b` use case.

### New workspace package gotcha

After creating a new workspace package's `package.json`, run plain `npm install` at the root first before any `-w` workspace commands, or npm won't recognize the new workspace.
