# Progress

Tracks the 18 planned modules for the Kostas ERP. The Turborepo/pnpm
foundation plus modules 1-6 are already merged to `master`. This PR
(`feat/modules-13-18`) adds modules 13-18. Modules 7-12 are a separate,
concurrent PR (`feat/modules-7-12`).

## Foundation

| Piece                                                               | Status |
| ------------------------------------------------------------------- | ------ |
| Turborepo + pnpm workspaces                                         | Done   |
| `packages/config` (shared tsconfig/eslint)                          | Done   |
| `packages/database` (Drizzle schema, local Postgres)                | Done   |
| `packages/auth` (`AuthProvider` interface + local provider)         | Done   |
| `packages/shared` (Zod schemas, `StorageProvider` + local provider) | Done   |
| `packages/ui` (shadcn/ui-pattern components on Tailwind v4)         | Done   |
| `docker/docker-compose.yml` (Postgres 17 + Redis)                   | Done   |
| GitHub Actions CI (lint/typecheck/test/build + Playwright)          | Done   |
| Husky + lint-staged + commitlint                                    | Done   |
| Vitest unit test setup                                              | Done   |
| Playwright e2e setup + one smoke test per module                    | Done   |

## Modules 1-6 (this PR)

| #   | Module              | Status  | Notes                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dashboard           | Working | GridStack widget layout (drag/resize, persisted per user in `dashboard_layouts`), KPI cards, one Recharts widget (projects by status). Only 2 widgets wired up as a proof of the pattern — more widgets (revenue, upcoming deadlines, etc.) are straightforward additions once modules 7+ (finance, calendar) exist to source that data from. |
| 2   | Projects            | Working | Full CRUD via Server Actions + Zod, TanStack Table with Zustand filter state, RHF+Zod create/edit dialog, detail page, status timeline.                                                                                                                                                                                                       |
| 3   | Client Measurements | Working | Konva canvas (drop/drag point markers with grid snapping, connect points into labeled dimension lines, export to PNG), RHF+Zod metadata form, React Dropzone photo upload via the local `StorageProvider`.                                                                                                                                    |
| 4   | Items & Inventory   | Working | TanStack Table with dnd-kit drag-to-reorder (persists `sortOrder` + bin location), React Flow warehouse map (bins as nodes, grouped by `binLocation`, sized by unit count). The warehouse map is a simple auto-generated grid layout, not a drag-to-place shelf editor — a fuller layout editor is a reasonable follow-up.                    |
| 5   | Fabric Inventory    | Working | AG Grid Community, inline-editable stock quantity, text/number column filters. Enterprise features (pivot, tree-data, range-selection) intentionally not used — see `docs/TECH_STACK.md`.                                                                                                                                                     |
| 6   | Project Fabrics     | Working | AG Grid Community linking fabrics to projects, inline status dropdown per row, plus a separate visual pipeline (draft → ordered → received → cut → installed) below the grid.                                                                                                                                                                 |

All six modules are backed by real Drizzle/Postgres tables and Zod-validated
Server Actions — none are static mockups. Each has at least one Playwright
smoke test under `apps/web/e2e/` confirming the page renders and a core
interaction (mostly "create X, see it in the table/grid") works end to end
against a real seeded database.

## Modules 13-18 (this PR)

| #   | Module                 | Status  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Department Status      | Working | New `packages/realtime` (`RealtimeProvider` interface, `PollingRealtimeProvider` on TanStack Query `refetchInterval`, `useRealtimeQuery` hook — designed to swap for a Supabase-Realtime-backed provider later without touching call sites) backs a live dashboard over new `departments`/`production_stages` tables: Recharts utilization chart + per-department stage cards.                                                                                                                                                                                                                                                                              |
| 14  | Reports                | Working | Recharts + TanStack Table + `xlsx` (CSV/XLSX export) + `@react-pdf/renderer` (PDF export). Real aggregation queries against the existing schema (project pipeline, production throughput, fabric usage, inventory levels); revenue/labor-cost reports are clearly-labeled mocked pending a Finance/Payroll module.                                                                                                                                                                                                                                                                                                                                          |
| 15  | Employee Portal        | Working | Rebuilt to the mockup deck (p17): kiosk PIN sign-in at `/employee-login` (name grid -> 4-digit PIN, bcrypt `users.pin_hash`, migration 0003), persistent EN/ES/EN+ES toggle, and a dashboard of stat cards, a running timer, task checklists, today's summary, activity, work orders, an hours-by-task donut and an employee overview. Hours are derived by pairing the append-only clock log (`lib/clock-sessions.ts`, 6 unit tests) rather than stored. Still a mobile-first PWA with the Zustand + IndexedDB offline queue and camera capture; the deck's dedicated mobile screens (bottom tab bar) are not built — the dashboard is responsive instead. |
| 16  | Digital Shop Board     | Working | Reuses module 13's `RealtimeProvider`/`useRealtimeQuery`. `react-window` virtualizes the stage list; Fullscreen API for kiosk mode. Rendered outside the `(app)` route group (no sidebar chrome), still auth-gated.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 17  | Universal Project View | Working | One section-definition list rendered two ways by CSS breakpoint (not JS device detection): Framer Motion accordion desktop, SwiperJS card slider mobile. Reads the existing `projects` table + relations — no new schema.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 18  | Designer Portal        | Working | Explicit XState machine for Draft → Submitted → Designer Review → (Approved \| Changes Requested) → Production → Completed; server actions re-validate every transition against the machine before persisting. RHF for submissions, TipTap (ProseMirror JSON) for comments, reuses the existing `StorageProvider` for file uploads.                                                                                                                                                                                                                                                                                                                         |

All six are backed by real Drizzle/Postgres tables (`departments`,
`production_stages`, `design_submissions`, `design_comments`,
`employee_actions`) and Zod-validated Server Actions/route handlers, with
one Playwright smoke test per module under `apps/web/e2e/`.

### Turbopack + Serwist

`@serwist/next`'s `withSerwist` registers a webpack plugin and no-ops
under Turbopack, which this repo requires. `@serwist/turbopack` builds
the service worker on-demand via esbuild inside a Route Handler
(`apps/web/app/serwist/[path]/route.ts`) instead. `esbuild` has to be a
**direct** dependency of `apps/web` (not just transitive) — Next's
`serverExternalPackages` handling resolves it at request time from
`apps/web/node_modules`, which pnpm's strict isolation doesn't populate
for transitive-only deps; without it the build fails at the page-data
collection step for `/serwist/[path]` with `Cannot find package 'esbuild'`.

### Cache Components + dynamic route params

Two of this PR's `[id]` pages (`designer-portal/[id]`, `project-view/[id]`)
originally `await`ed `params` in the page's top-level component, before
entering the `<Suspense>` boundary — this fails the build under Cache
Components ("Uncached data was accessed outside of Suspense"), the same
bug class fixed three times in the modules-1-6 foundation. Fixed by
passing the `params` Promise straight into the Suspense-wrapped child and
awaiting it there instead, matching the established pattern in
`projects/[id]/page.tsx`.

### Known dependency caveat

`react-camera-pro` declares a `react@^18.3.1` peer dependency; pnpm
reports it as unmet against this repo's React 19. It's a small
hooks-based component with no version-specific API usage observed and the
build succeeds, but flagging it here in case it surfaces a runtime issue
in `employee-portal/components/camera-capture.tsx`.

## Deferred pending real credentials / future PRs

These are **not** part of this PR:

- **Modules 7-12** — separate, concurrent PR (`feat/modules-7-12`).
- **Live Supabase project.** `packages/auth` and the storage abstraction
  are designed so a `supabase` provider is a drop-in addition (see
  `docs/TECH_STACK.md` for the exact env vars), but no Supabase project
  exists yet — everything runs against local Postgres + local filesystem
  storage.
- **Stripe** (billing/payments — needed for modules in the finance area).
- **OpenAI** (AI photo search module).
- **Yahoo IMAP** (email integration module).

## Verification status

For modules 1-6 (no Docker/Postgres available in the sandbox that built
that PR):

- `pnpm typecheck` / `pnpm lint` / `pnpm test` (Vitest) — green.
- `pnpm build` — green after fixing three real Turbopack/Cache-Components
  issues (see that PR's history): a `turbopack.root` path miscalculation,
  react-konva pulling in Node-only `canvas` during SSR, and three
  instances of Cache Components' "Uncached data was accessed outside of
  Suspense".
- `pnpm test:e2e` / `pnpm db:migrate` / `pnpm db:seed` — not run locally
  (no Docker); verified in CI instead.

For modules 13-18 (this PR, same no-Docker constraint):

- `pnpm typecheck` — green, all 7 packages.
- `pnpm lint` — green, 0 errors (same informational "React Compiler will
  skip memoizing this" warnings as modules 1-6; harmless).
- `pnpm test` (Vitest) — green, 31/31 unit tests (28 in `@kostas/shared`,
  3 in `@kostas/auth`).
- `pnpm build` — green after fixing two real issues (see "Turbopack +
  Serwist" and "Cache Components + dynamic route params" above):
  `esbuild` missing as a direct dependency, and two `[id]` pages awaiting
  `params` outside their Suspense boundary.
- `pnpm test:e2e` / `pnpm db:migrate` / `pnpm db:seed` — not run locally
  for the same reason as modules 1-6; the regenerated migration SQL
  (`packages/database/drizzle/0000_past_may_parker.sql`, 13 tables) was
  reviewed by hand against the merged Drizzle schema instead. CI is the
  first real execution of these — treat it as the actual gate before
  merge.

## Running this locally

```bash
docker compose -f docker/docker-compose.yml up -d
pnpm install
cp .env.example .env   # adjust if needed; defaults match docker-compose
pnpm db:migrate
pnpm db:seed            # optional: creates admin@kostas.local / password123
pnpm dev
```

Then visit `http://localhost:3000` — you'll be redirected to `/login`.
