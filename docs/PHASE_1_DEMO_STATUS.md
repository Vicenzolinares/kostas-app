# Phase 1 Demo Status

Snapshot of the Kostas ERP after merging the Turborepo foundation and all
18 modules (PRs #5, #6, #7) to `master`. This is a **coded demo**, not a
production launch: everything runs locally against a real Postgres
database with real Drizzle schema and real Server Actions — nothing here
is a static mockup — but several integrations that need paid third-party
credentials are intentionally left disconnected (see "Credential-dependent
integrations" below).

## Module status

| #   | Module                 | Status                         | Notes                                                                                                                                                                                                                           |
| --- | ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dashboard              | Working                        | GridStack drag/resize widget layout (persisted per user), KPI cards, one Recharts widget.                                                                                                                                       |
| 2   | Projects               | Working                        | Full CRUD, TanStack Table + filters, detail page, status timeline.                                                                                                                                                              |
| 3   | Client Measurements    | Working                        | Konva canvas sketches with dimension labels, photo upload via local storage.                                                                                                                                                    |
| 4   | Items & Inventory      | Working                        | TanStack Table + dnd-kit reordering, React Flow warehouse map.                                                                                                                                                                  |
| 5   | Fabric Inventory       | Working                        | AG Grid Community, inline-editable stock.                                                                                                                                                                                       |
| 6   | Project Fabrics        | Working                        | AG Grid Community + visual status pipeline.                                                                                                                                                                                     |
| 7   | Hardware Inventory     | Working                        | Barcode (zxing) and QR (html5-qrcode) scanning, scan audit log.                                                                                                                                                                 |
| 8   | Work Orders            | Working                        | 6-step wizard, PDF generation (`@react-pdf/renderer`), browser print.                                                                                                                                                           |
| 9   | Calendar               | Working                        | FullCalendar (free plugins only), drag-drop scheduling, recurring events (RRULE).                                                                                                                                               |
| 10  | Finance                | Partial / Credential-dependent | Invoices, transactions, revenue chart all real and working. Stripe payment collection is wired but inert (button disabled, clear message) without a live `STRIPE_SECRET_KEY`.                                                   |
| 11  | Emails                 | Partial / Credential-dependent | Inbox UI, compose, and the BullMQ+Redis sync worker are all real. IMAP/SMTP sync is inert without `EMAIL_*` env vars (no Yahoo OAuth app configured).                                                                           |
| 12  | AI Photo Search        | Partial / Credential-dependent | Upload → Sharp optimization → storage pipeline works end to end. AI vision matching returns a clear "not configured" result without `OPENAI_API_KEY`; pgvector similarity search is wired and ready once real embeddings exist. |
| 13  | Department Status      | Working                        | Live dashboard via `packages/realtime` (polling now; interface is Supabase-Realtime-ready).                                                                                                                                     |
| 14  | Reports                | Partial                        | Project pipeline, production throughput, fabric usage, and inventory-level reports are real aggregations. Revenue and labor-cost reports are clearly-labeled mocked data, pending real Finance/Payroll volume.                  |
| 15  | Employee Portal        | Working                        | Mobile-first PWA (`@serwist/turbopack`), offline action queue (IndexedDB), camera capture. See known warnings below re: `react-camera-pro`.                                                                                     |
| 16  | Digital Shop Board     | Working                        | Reuses module 13's realtime layer; kiosk/fullscreen mode.                                                                                                                                                                       |
| 17  | Universal Project View | Working                        | One section list, CSS-breakpoint-driven desktop accordion / mobile card slider.                                                                                                                                                 |
| 18  | Designer Portal        | Working                        | Explicit XState approval workflow (Draft → Submitted → Review → Approved/Changes Requested → Production → Completed), TipTap comments.                                                                                          |

**Nothing is a static mockup or missing a page.** "Partial / Credential-dependent"
means the module's own UI, database schema, and business logic are all real
and demoable — only the specific third-party API call is gated behind a
credential that doesn't exist yet.

## Remaining production integrations

None of these block the Phase 1 demo — the app runs fully without them.
They're what's needed to go from "coded demo" to "live production":

| Integration                    | Used by                                   | What's needed                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe                         | Finance (10)                              | A live Stripe account; set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.                                                                                                                                                                                                        |
| Yahoo Mail OAuth               | Emails (11)                               | A registered Yahoo OAuth app; set `EMAIL_OAUTH_CLIENT_ID`/`EMAIL_OAUTH_CLIENT_SECRET`/`EMAIL_OAUTH_ACCESS_TOKEN` plus the IMAP/SMTP host vars.                                                                                                                                                                        |
| OpenAI                         | AI Photo Search (12)                      | An OpenAI API key with Vision access; set `OPENAI_API_KEY`.                                                                                                                                                                                                                                                           |
| Supabase                       | Auth, Storage, Realtime (cross-cutting)   | Optional upgrade from the current local Postgres auth + local filesystem storage + polling realtime. `packages/auth`, `packages/shared` (storage), and `packages/realtime` are all built as swappable-provider interfaces specifically so this is a drop-in addition later, not a rewrite — see `docs/TECH_STACK.md`. |
| AG Grid Enterprise             | Fabric Inventory (5), Project Fabrics (6) | Optional. Currently AG Grid **Community** (free) — pivot/tree-data/range-selection are unavailable. A paid license would unlock those if ever needed.                                                                                                                                                                 |
| FullCalendar Scheduler Premium | Calendar (9)                              | Optional. Currently free FullCalendar plugins only — no resource-timeline view.                                                                                                                                                                                                                                       |

## Known warnings

- **`react-camera-pro` peer dependency**: declares `react@^18.3.1`, this
  repo runs React 19. pnpm reports it as unmet at install time; no
  version-specific API usage has been observed and it builds/runs fine,
  but flag it first if the camera capture flow in Employee Portal (15)
  ever misbehaves.
- **React Compiler "incompatible library" lint warnings**: informational
  only, appear on components using React Hook Form's `watch()` or
  TanStack Table's `useReactTable()` (both return functions the compiler
  can't safely auto-memoize). Harmless — `reactCompiler` isn't enabled in
  `next.config.ts`, these are advisory.
- **Node.js 20 deprecation notice in CI**: GitHub Actions runners now
  force Node 20 actions onto Node 24 under the hood; informational, not a
  failure.
- One unused-variable lint warning (`_filters` in
  `apps/web/app/(modules)/reports/api/queries.ts`) — harmless, intentional
  placeholder for a not-yet-wired filter param.

## Setup steps

Nothing beyond what's already in `.env.example` — copy it to `.env` and
the defaults work as-is against the local Docker Postgres/Redis. No
external accounts are required to run the Phase 1 demo.

```bash
cp .env.example .env
```

Optionally add the credential env vars listed above if you want to
demo Stripe/Email/AI Photo Search against real services instead of their
inert local-dev fallback.

## Demo login

Seeded by `pnpm db:seed` (`packages/database/src/scripts/seed.ts`):

- **Email**: `admin@kostas.local`
- **Password**: `password123`
- **Role**: admin (full access to all 18 modules)

The seed also creates one sample project, one fabric, one inventory item,
six departments, and two production-stage records so Dashboard, Department
Status, and Reports have real data to show immediately.

## Running this locally

One-shot automated setup (checks prerequisites, starts Docker
Postgres+Redis, installs deps, migrates, seeds):

```bash
./setup.sh          # setup only
./setup.sh --run    # setup, then start the dev server
```

Or manually:

```bash
docker compose -f docker/docker-compose.yml up -d
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Then visit `http://localhost:3000` — you'll be redirected to `/login`.

## Verification status (this merge)

All three PRs (#5 foundation + modules 1-6, #6 modules 7-12, #7 modules
13-18) were merged only after their full CI suite went green on GitHub
Actions against a real Postgres service container:

- `pnpm lint` / `pnpm typecheck` / `pnpm test` (Vitest, 36 unit tests) — green.
- `pnpm build` (Next.js 16 + Turbopack, Cache Components) — green.
- `pnpm db:migrate` against a real Postgres 17 + pgvector service — green.
- `pnpm test:e2e` (Playwright, one smoke test per module) — green.
