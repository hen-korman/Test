# GroundCover → Slack Integration

Monorepo (pnpm workspaces): packages/api, packages/web, packages/shared.

## Architecture
Webhook receiver (POST /webhooks/:slug) validates payloads via AJV, enqueues a BullMQ job,
and returns 200 immediately. A worker (concurrency=WORKER_CONCURRENCY) matches the tenant via
dot-notation field lookup, renders a Handlebars template, and posts to Slack.
Admin UI (React) manages alert types, message templates, tenants, and audit log.

## Ports
- API (Express): 3847
- Web (nginx / Vite dev): 8420
- PostgreSQL host port: 5434 (container: 5432)
- Redis host port: 6381 (container: 6379)

## Key commands
- `pnpm install` — install all workspace deps
- `pnpm --filter api db:generate` — generate Drizzle migration
- `pnpm --filter api db:migrate` — apply migrations
- `pnpm --filter api dev` — run API with tsx watch on :3847
- `pnpm --filter api worker` — run BullMQ worker process
- `pnpm --filter web dev` — run Vite dev server on :8420
- `docker compose up` — full stack (postgres, redis, api, web)

## Stack
- Backend: Express + TypeScript + Drizzle ORM (postgres driver) + AJV + Handlebars + @slack/web-api
- Queue: BullMQ + Redis — worker concurrency limits Slack rate exposure; dedup via Redis TTL (30s)
- Frontend: React 18 + Vite + Tailwind CSS v3 + shadcn/ui + @tanstack/react-query v5
- DB: PostgreSQL 16 with jsonb columns for payload schemas and Block Kit JSON

## Conventions
- Routes: packages/api/src/routes/, services: packages/api/src/services/, queue: packages/api/src/queue/
- All DB timestamps use withTimezone: true
- matchField is a dot-notation path resolved with lodash get() (e.g. "labels.customer")
- Handlebars templates and AJV compiled schemas are cached in-memory (invalidated on PUT)
- No auth in Phase 1 — injection point marked with // TODO: add auth in app.ts
- Webhook endpoint at /webhooks/:slug (not under /api/v1) — short URL for GroundCover config

## Development Log
All build progress is documented in DEVLOG.md (repo root).
Each step appends a structured entry — feed this file to NotebookLM to generate a technical guide.
After every implementation step, append an entry using this format:

```
## [Step N] <Title>
**Date:** <date>
**Files created/modified:** <list>

### What was built
### Why it was built this way
### How it works
### Connections to other parts of the system
### Gotchas & non-obvious details
```
