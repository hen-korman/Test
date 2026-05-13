# GroundCover → Slack Integration: Phase 1 MVP Plan

## Context
XM Cyber uses GroundCover for observability monitoring of customer tenants. When alerts fire, the team needs to route them to customer-specific Slack channels. Today this is handled via Make.com middleware — the goal is to replace it with an internal, self-serve system. Phase 1 ships the core webhook receiver, CRUD admin API, and a React admin UI with a live template editor, all wired to Slack delivery.

The repository (`/home/user/Test`) is a clean slate: only a `README.md` exists on branch `claude/groundcover-slack-integration-Rb9EQ`.

---

## Architecture

**Monorepo** using pnpm workspaces with three packages: `packages/api`, `packages/web`, `packages/shared`.

```
GroundCover  →  POST /webhooks/:slug  →  Enqueue (BullMQ/Redis)  →  ACK 200
                                                  ↓
                                           Worker (concurrency=5)
                                                  ↓
                                           Slack API  (with retry)
                                                  ↓
                                         PostgreSQL (alert_events audit log)

Admin UI  →  /api/v1/*  →  CRUD routers  →  PostgreSQL
```

**Key architectural decisions:**
- **Async Slack dispatch via BullMQ/Redis in Phase 1** (not Phase 2) — handles inbound bursts and Slack rate limits. Webhook handler enqueues the job and returns 200 immediately; a worker processes with configurable concurrency (default 5).
- **Slack rate limit handling**: Worker concurrency limits concurrent Slack calls. `@slack/web-api` `WebClient` has `retryConfig` for automatic retry on 429. BullMQ job retry (3 attempts, exponential backoff) handles persistent failures.
- **Deduplication**: Hash of `(slug + canonical JSON payload)` stored in Redis with 30s TTL. Duplicate webhooks within the window are dropped before enqueuing.
- No auth in Phase 1 (internal network only). Stub in `app.ts` marks the injection point.
- One template per alert type. Per-tenant overrides deferred to Phase 2 (FK already nullable-compatible).
- `matchField` uses dot-notation resolved with lodash `get` (e.g. `labels.customer`).
- AJV compiled schemas cached in memory per `alertTypeId`; Handlebars templates cached per `templateId`.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM + Migrations | Drizzle ORM + drizzle-kit (`postgres` driver, not `pg`) |
| Template engine | Handlebars (runs on both api and browser) |
| Payload validation | AJV v8 |
| Slack | @slack/web-api |
| Queue | **BullMQ + Redis** (wired in Phase 1 for rate-limit safety) |
| Frontend | React 18 + Vite + Tailwind CSS v3 + shadcn/ui |
| Data fetching | @tanstack/react-query v5 |
| Env validation | zod |
| Logging | pino + pino-http |

---

## Directory Structure

```
/
├── .gitignore
├── .env.example
├── docker-compose.yml
├── package.json                        # pnpm workspace root ("private": true)
├── pnpm-workspace.yaml
├── tsconfig.base.json                  # shared: strict, ES2022, moduleResolution:bundler
│
├── packages/
│   ├── shared/                         # DTO types only, no runtime deps
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── types/
│   │           ├── alert-type.ts
│   │           ├── tenant.ts
│   │           ├── message-template.ts
│   │           └── alert-event.ts
│   │
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts                # app.listen()
│   │       ├── app.ts                  # Express factory (no listen); // TODO: add auth here
│   │       ├── config/env.ts           # zod-validated env
│   │       ├── db/
│   │       │   ├── index.ts            # drizzle client singleton
│   │       │   ├── schema.ts           # ALL table definitions
│   │       │   └── migrations/
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   ├── webhook.router.ts
│   │       │   ├── alert-types.router.ts
│   │       │   ├── tenants.router.ts
│   │       │   ├── templates.router.ts
│   │       │   └── events.router.ts
│   │       ├── services/
│   │       │   ├── schema-validator.service.ts
│   │       │   ├── tenant-matcher.service.ts
│   │       │   ├── template-renderer.service.ts
│   │       │   └── slack.service.ts
│   │       ├── queue/
│   │       │   ├── queue.ts              # BullMQ Queue instance
│   │       │   └── dispatch.worker.ts    # Worker (concurrency=WORKER_CONCURRENCY)
│   │       ├── middleware/
│   │       │   ├── error-handler.ts
│   │       │   ├── request-logger.ts
│   │       │   └── validate-body.ts
│   │       └── lib/logger.ts
│   │
│   └── web/
│       ├── package.json
│       ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── index.html
│       ├── components.json             # shadcn config
│       └── src/
│           ├── main.tsx
│           ├── App.tsx                 # React Router root
│           ├── index.css
│           ├── lib/
│           │   ├── api-client.ts       # typed fetch wrapper
│           │   └── utils.ts            # shadcn cn()
│           ├── hooks/                  # use-alert-types, use-tenants, use-templates, use-events
│           ├── components/
│           │   ├── ui/                 # shadcn components (button, input, table, dialog, form, textarea, switch, badge, card, toast)
│           │   ├── layout/             # AppShell, Sidebar
│           │   └── shared/             # DataTable, ConfirmDialog, JsonEditor
│           └── pages/
│               ├── AlertTypesPage.tsx
│               ├── AlertTypeFormPage.tsx
│               ├── TemplateEditorPage.tsx
│               ├── TenantsPage.tsx
│               ├── TenantFormPage.tsx
│               └── AuditLogPage.tsx
```

---

## Database Schema (`packages/api/src/db/schema.ts`)

```typescript
export const alertTypes = pgTable('alert_types', {
  id:            uuid('id').primaryKey().defaultRandom(),
  name:          text('name').notNull(),
  slug:          text('slug').notNull().unique(),
  payloadSchema: jsonb('payload_schema').notNull().$type<Record<string, unknown>>(),
  createdBy:     text('created_by').notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  matchField:     text('match_field').notNull(),   // dot-notation path e.g. "labels.customer"
  matchValue:     text('match_value').notNull(),
  slackChannelId: text('slack_channel_id').notNull(),
  active:         boolean('active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const messageTemplates = pgTable('message_templates', {
  id:           uuid('id').primaryKey().defaultRandom(),
  alertTypeId:  uuid('alert_type_id').notNull().references(() => alertTypes.id, { onDelete: 'cascade' }),
  templateBody: text('template_body').notNull(),
  blocksJson:   jsonb('blocks_json').$type<unknown[]>(),  // Slack Block Kit, optional
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const slackStatusEnum = pgEnum('slack_status', ['pending', 'delivered', 'failed', 'no_tenant']);

export const alertEvents = pgTable('alert_events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  alertTypeId: uuid('alert_type_id').references(() => alertTypes.id, { onDelete: 'set null' }),
  tenantId:    uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  rawPayload:  jsonb('raw_payload').notNull().$type<Record<string, unknown>>(),
  renderedMsg: text('rendered_msg'),
  slackStatus: slackStatusEnum('slack_status').notNull().default('pending'),
  error:       text('error'),
  receivedAt:  timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
});
```

---

## API Routes

```
Webhook (public):
  POST   /webhooks/:slug

Alert Types:
  GET    /api/v1/alert-types
  GET    /api/v1/alert-types/:id
  POST   /api/v1/alert-types
  PUT    /api/v1/alert-types/:id
  DELETE /api/v1/alert-types/:id

Message Templates (per alert type):
  GET    /api/v1/alert-types/:id/template
  PUT    /api/v1/alert-types/:id/template      (upsert)

Tenants:
  GET    /api/v1/tenants
  GET    /api/v1/tenants/:id
  POST   /api/v1/tenants
  PUT    /api/v1/tenants/:id
  DELETE /api/v1/tenants/:id

Audit Log:
  GET    /api/v1/events    (?alertTypeId=&tenantId=&status=&limit=&offset=)
  GET    /api/v1/events/:id

Health:
  GET    /health
```

---

## Webhook Dispatch Flow

### Webhook handler (`packages/api/src/routes/webhook.router.ts`)
```
1. Look up AlertType by slug → 404 if not found
2. Compute dedup key: SHA-256(slug + stable JSON.stringify(payload))
   → check Redis: if key exists, return 200 { ok: true, duplicate: true }
   → else SET key with 30s EX
3. Validate payload against payloadSchema via AJV → return 400 on failure (no event logged yet)
4. Insert alert_event row with slackStatus='pending'
5. Enqueue BullMQ job { eventId, alertTypeId, payload }
6. Return 200 { ok: true }
```

### Worker (`packages/api/src/worker.ts`) — separate process, concurrency=5
```
1. Dequeue job { eventId, alertTypeId, payload }
2. Load active tenants → match via lodash get(payload, matchField) === matchValue
   → if no match: update event slackStatus='no_tenant', done
3. Load MessageTemplate for alertTypeId
4. Render Handlebars template with payload as context
5. Call slack.service.postMessage({ channel, text, blocks? })
   → WebClient has retryConfig: { retries: 3 } for 429 / transient errors
6. Update alert_event: slackStatus='delivered', deliveredAt=now()

On job failure after all BullMQ retries (3 attempts, exponential backoff):
  → Update alert_event: slackStatus='failed', error=lastError.message
```

**Concurrency config** (env var `WORKER_CONCURRENCY`, default `5`): limits simultaneous Slack API calls across the worker process, preventing rate limit 429s even during alert bursts.

---

## Docker Compose

- `postgres:16-alpine` — persistent volume, healthcheck
- `redis:7-alpine` — used for BullMQ job queue and dedup key TTLs
- `api` — multi-stage Dockerfile (builder + runtime), depends on postgres health
- `web` — multi-stage Dockerfile (Vite build + nginx), proxies `/api` and `/webhooks` to `api:3847`

**Port assignments (unique to avoid conflicts):**
| Service | Container port | Host port |
|---|---|---|
| api (Express) | 3847 | 3847 |
| web (nginx/Vite dev) | 8420 | 8420 |
| postgres | 5432 | 5434 |
| redis | 6379 | 6381 |

---

## Environment Variables

```bash
DATABASE_URL=postgres://app:secret@postgres:5432/groundcover_slack
REDIS_URL=redis://redis:6379
SLACK_BOT_TOKEN=xoxb-...          # chat:write scope required
PORT=3847
WORKER_CONCURRENCY=5              # max simultaneous Slack API calls
NODE_ENV=development

# Web (Vite build-time)
VITE_API_BASE_URL=http://localhost:3847
```

---

## Frontend Pages Summary

| Page | Purpose |
|---|---|
| `AlertTypesPage` | List alert types with Edit/Delete/Template buttons |
| `AlertTypeFormPage` | Create/edit form; paste sample payload → auto-infer JSON Schema |
| `TemplateEditorPage` | Side-by-side Handlebars editor + live preview; sample payload at top |
| `TenantsPage` | List tenants, inline active toggle (Switch) |
| `TenantFormPage` | Create/edit tenant: name, matchField, matchValue, slackChannelId |
| `AuditLogPage` | Read-only table with filter bar; click row to expand raw payload |

Schema inference: `generate-schema` npm package runs in browser (no server round-trip).
Handlebars preview: import `handlebars` in web bundle, compile on every keystroke, render against sample payload JSON.

---

## CLAUDE.md (Project Memory File)

A `CLAUDE.md` will be created at the repo root so every Claude Code session starts with full project context. Contents:

```markdown
# GroundCover → Slack Integration

Monorepo (pnpm workspaces): packages/api, packages/web, packages/shared.

## Architecture
Webhook receiver (POST /webhooks/:slug) validates payloads, matches tenants via
dot-notation field lookup, renders Handlebars templates, posts to Slack.
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
- `pnpm --filter web dev` — run Vite dev server on :8420
- `docker compose up` — full stack (postgres, redis, api, web)

## Stack
- Backend: Express + TypeScript + Drizzle ORM (postgres driver) + AJV + Handlebars + @slack/web-api
- Frontend: React 18 + Vite + Tailwind CSS v3 + shadcn/ui + @tanstack/react-query v5
- DB: PostgreSQL 16 with jsonb columns for payload schemas and Block Kit JSON
- Queue: BullMQ + Redis (Phase 1) — worker concurrency limits Slack rate exposure; dedup via Redis TTL

## Conventions
- Routes live in packages/api/src/routes/, services in packages/api/src/services/
- All timestamps use withTimezone: true
- matchField is a dot-notation path resolved with lodash get()
- Handlebars templates and AJV compiled schemas are cached in-memory (invalidated on PUT)
- No auth in Phase 1 — injection point marked with // TODO: add auth in app.ts
- Webhook endpoint is at root /webhooks/:slug (not under /api/v1) — short URL for GroundCover config
```

---

## Implementation Order

1. **Repo scaffolding** — `.gitignore`, pnpm workspace, `tsconfig.base.json`, `packages/shared` types, root `package.json`
2. **DB layer** — `packages/api` dependencies, `schema.ts`, `drizzle.config.ts`, `db/index.ts`, run `db:generate`
3. **API core** — `env.ts`, `logger.ts`, middleware, `app.ts`, `index.ts`, verify `GET /health`
4. **CRUD routes** — alert-types, tenants, templates, events routers (in that order)
5. **Webhook pipeline** — schema-validator, tenant-matcher, template-renderer, slack services, webhook router; test end-to-end with `curl`
6. **Frontend scaffolding** — Vite + React, Tailwind v3, shadcn init, `api-client.ts`, `App.tsx`, `AppShell`
7. **Frontend pages** — AlertTypes → TemplateEditor → Tenants → AuditLog
8. **Docker** — `docker-compose.yml`, api Dockerfile, web Dockerfile + nginx.conf
9. **Polish** — README quickstart, `scripts/seed.ts` for local dev demo data

---

## Verification

- `curl -X POST http://localhost:3000/webhooks/test-alert -H 'Content-Type: application/json' -d '{"labels":{"customer":"acme"}}'` → 200 with Slack message delivered
- `GET /api/v1/events` returns the audit log entry with `slackStatus='delivered'`
- Admin UI at `http://localhost:5173` — create alert type, paste sample payload, build template, add tenant, fire test webhook
- `docker compose up` — full stack starts, postgres healthy, api connects, web proxies correctly

---

## Critical Files

- `packages/api/src/db/schema.ts` — foundation; implement first
- `packages/api/src/services/webhook.service.ts` — core orchestration
- `packages/api/src/app.ts` — Express factory, route mounting
- `packages/web/src/pages/TemplateEditorPage.tsx` — highest-value UI feature
- `docker-compose.yml` — service topology for local dev and deployment
