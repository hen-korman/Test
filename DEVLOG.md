# GroundCover → Slack Integration — Development Log

This file documents every implementation step of the system build.
It is structured for import into NotebookLM to auto-generate a technical guide.

Each entry describes: what was built, why, how it works, how it connects to the rest of the system,
and any non-obvious details a future developer should know.

---

## [Step 1] Repository Scaffolding

**Date:** 2026-05-14
**Files created/modified:**
- `.gitignore`
- `.env.example`
- `package.json` (workspace root)
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `CLAUDE.md`
- `DEVLOG.md`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/alert-type.ts`
- `packages/shared/src/types/tenant.ts`
- `packages/shared/src/types/message-template.ts`
- `packages/shared/src/types/alert-event.ts`

### What was built
The monorepo skeleton was established using pnpm workspaces with three top-level packages: `api`, `web`, and `shared`. The `shared` package contains TypeScript DTO (Data Transfer Object) types that are used by both the backend API and the frontend, preventing type drift between the two. Root-level configuration files set up TypeScript compilation settings shared across all packages.

### Why it was built this way
A pnpm workspace monorepo was chosen over separate repositories because it allows the `api` and `web` packages to share type definitions via `packages/shared` with zero duplication. TypeScript's `moduleResolution: bundler` setting (in `tsconfig.base.json`) is the modern standard compatible with both Vite (frontend) and tsx (backend dev server). A shared `tsconfig.base.json` ensures consistent strict-mode settings across the project.

### How it works
The `pnpm-workspace.yaml` file tells pnpm to treat every directory under `packages/` as a workspace member. Each package has its own `package.json` and `tsconfig.json` that extends `tsconfig.base.json`. The `packages/shared` package exports TypeScript interfaces only — it has no runtime code and no npm dependencies — making it a pure type library.

### Connections to other parts of the system
- `packages/api` and `packages/web` will both declare `"@gc-slack/shared": "workspace:*"` as a dependency to consume the shared types.
- `CLAUDE.md` is read automatically by Claude Code at the start of every session, giving it full context about the project without needing re-explanation.
- `DEVLOG.md` (this file) is appended after each step and will be imported into NotebookLM.

### Gotchas & non-obvious details
- `pnpm-lock.yaml` is gitignored intentionally — contributors run `pnpm install` fresh. The lockfile was excluded to avoid merge conflicts during rapid development. Add it back before production deployment.
- The root `package.json` has `"private": true` to prevent accidental publishing of the monorepo root.
- `tsconfig.base.json` uses `"moduleResolution": "bundler"` — this only works with Node 20+ and modern bundlers (Vite, tsx). Do not use `"node16"` or `"nodenext"` here as it breaks Vite's import resolution.

---
