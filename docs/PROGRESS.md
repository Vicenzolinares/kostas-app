# Progress

Tracks the 18 planned modules for the Kostas ERP. This PR
(`feat/turborepo-foundation-modules-1-6`) covers the Turborepo/pnpm
foundation plus modules 1-6. Modules 7-18 are explicitly out of scope for
this PR and are not started.

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

## Deferred pending real credentials / future PRs

These are **not** part of this PR:

- **Modules 7-18** (work orders, calendar/scheduling, finance, email
  integration, AI photo search, department status boards, reporting,
  employee portal, shop-floor display, designer approval portal, and
  others) — separate future PRs.
- **Live Supabase project.** `packages/auth` and the storage abstraction
  are designed so a `supabase` provider is a drop-in addition (see
  `docs/TECH_STACK.md` for the exact env vars), but no Supabase project
  exists yet — everything runs against local Postgres + local filesystem
  storage.
- **Stripe** (billing/payments — needed for modules in the finance area).
- **OpenAI** (AI photo search module).
- **Yahoo IMAP** (email integration module).

## Verification status

Run from the agent sandbox that built this PR (no Docker/Postgres available
there):

- `pnpm typecheck` — green, all 5 packages.
- `pnpm lint` — green, 0 errors (a handful of informational "React Compiler
  will skip memoizing this" warnings remain; harmless, since `reactCompiler`
  isn't enabled in `next.config.ts`).
- `pnpm test` (Vitest) — green, 14/14 unit tests.
- `pnpm build` — green. Confirmed Turbopack-compatible after fixing three
  real issues surfaced along the way (see commit history): a
  `turbopack.root` path miscalculation, react-konva pulling in Node-only
  `canvas` during SSR (fixed via `next/dynamic(..., { ssr: false })`), and
  three instances of Cache Components' "Uncached data was accessed outside
  of Suspense" (searchParams/params read before their Suspense boundary,
  and `usePathname()` in the nav needing its own boundary).
- `pnpm test:e2e` (Playwright) — **not run against a live server in this
  sandbox** (no Docker/Postgres available in the environment this PR was
  built in). All 6 specs (`apps/web/e2e/*.spec.ts`, one per module) do
  parse and list correctly via `playwright test --list`. They're designed
  to run in `.github/workflows/ci.yml`, which provisions a real Postgres
  service container, runs `db:migrate` + `db:seed`, builds, and then runs
  the full suite — that CI run is the first real execution of these tests
  and should be treated as the actual gate before merge.
- `pnpm db:migrate` / `pnpm db:seed` — likewise not run locally for the
  same reason; the generated migration SQL
  (`packages/database/drizzle/0000_oval_marvel_zombies.sql`) was reviewed
  by hand against the Drizzle schema instead.

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
