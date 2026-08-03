# Production Technology Stack

This document records the stack chosen for the Kostas ERP and the reasoning
behind each piece. It's the reference for "why this library" questions and
for what a future Supabase swap actually requires.

## Monorepo

- **Turborepo + pnpm workspaces.** The app is split into `apps/web` (the
  Next.js app) and `packages/*` (shared code) so that database schema,
  auth, UI components, and Zod validation are reusable across a future
  second app (e.g. a standalone shop-floor kiosk build) without copy-paste.
  `turbo.json` defines the `dev`/`build`/`lint`/`typecheck`/`test`/`test:e2e`
  pipeline with dependency-aware caching.

## Framework

- **Next.js 16 (App Router) + React 19.2.** Turbopack is the default and
  required builder in this version — there is no webpack fallback path in
  this codebase. Data fetching uses React Server Components with Server
  Actions for mutations; `cacheComponents: true` is enabled in
  `next.config.ts` (the v16 replacement for the old `revalidate` /
  `unstable_cache` model). Given this app is a per-user, database-backed
  ERP, most pages are _not_ good `'use cache'` candidates — the model is
  applied selectively (see "Caching approach" below).
- **TypeScript** throughout, strict mode, shared base config in
  `packages/config/tsconfig`.

## Styling / UI

- **Tailwind CSS v4** (CSS-first config via `@theme`, no `tailwind.config.js`).
- **shadcn/ui-pattern components** built on Radix UI primitives, published
  from `packages/ui` so both the web app and any future app share one
  design system. Not using the `shadcn` CLI's copy-into-app pattern here
  because the monorepo structure makes a shared package cleaner.

## Data layer

- **Drizzle ORM** targeting **Postgres 17** (via `docker/docker-compose.yml`
  for local dev). Chosen over Prisma for its lighter runtime, SQL-close
  query builder, and first-class relations API that maps well onto this
  domain's foreign keys (projects ↔ client_measurements ↔ project_fabrics
  ↔ fabric_inventory).
- **drizzle-kit** for schema migrations (`pnpm db:generate` / `db:migrate`).
- **TanStack Query** for client-side cache/refetch of data touched by
  interactive tables and dashboards; **TanStack Table** for the Projects
  and Items & Inventory list views (headless, so it composes with the
  shared `packages/ui` Table primitives).
- **AG Grid Community (not Enterprise)** for Fabric Inventory and Project
  Fabrics, which need large-dataset grids with sorting/filtering/inline
  edit. Enterprise needs a paid license, explicitly decided against for
  this project. Community lacks pivot/tree-data/range-selection; if a
  future requirement genuinely needs those, prefer TanStack Table +
  `@tanstack/react-virtual` over paying for Enterprise.

## Forms / validation

- **React Hook Form + Zod** (`@hookform/resolvers`) for all create/edit
  forms, sharing the same Zod schemas (`packages/shared/src/schemas`)
  that Server Actions use to validate on the server — one schema, two
  enforcement points.

## State

- **Zustand** for local/UI state that doesn't belong in the URL or the
  database (e.g. table filter state in the Projects module). Server state
  (the actual data) stays in TanStack Query / RSC props, not Zustand.

## Domain-specific libraries

- **Konva.js + react-konva** for the Client Measurements furniture-sketch
  canvas (draw/drag/resize point markers and dimension lines, export to
  PNG).
- **React Dropzone** for reference-photo upload, wired to the
  `StorageProvider` abstraction (see below).
- **dnd-kit** for drag-and-drop reordering/bin assignment in Items &
  Inventory.
- **@xyflow/react (React Flow)** for the warehouse/location visualization
  (shelves/bins as nodes).
- **GridStack.js** for the Dashboard's draggable/resizable widget layout,
  persisted per user in the `dashboard_layouts` table.
- **Recharts** for dashboard chart widgets.

## Auth

- **`packages/auth`** defines an `AuthProvider` interface (`signIn`,
  `signUp`, `signOut`, `getSession`, `requireRole`) so the app's call
  sites never talk to a concrete backend directly. The only
  implementation today is `LocalAuthProvider`: Postgres `users` table,
  `bcryptjs` password hashing, and a signed JWT (via `jose`) stored in an
  HttpOnly session cookie. RBAC is enforced both in `proxy.ts` (route-level
  redirect for unauthenticated requests) and inside Server Actions via
  `requireRole` (defense in depth — proxy matchers can silently stop
  covering a route after a refactor; see Next's own guidance on this).

### Swapping to Supabase later

The plan is for a `SupabaseAuthProvider` to implement the exact same
`AuthProvider` interface, backed by Supabase Auth instead of the local
Postgres table + JWT cookie. That change is scoped to one new file in
`packages/auth/src/providers/supabase.ts` plus swapping the instantiation
in `apps/web/lib/auth.ts` — no call-site changes elsewhere in the app.
Env vars that swap would need (all currently unused/undefined):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## File storage

- **`packages/shared`'s `StorageProvider`** interface (`upload`, `getUrl`,
  `delete`) mirrors the auth pattern. The only implementation today is
  `LocalStorageProvider`, which writes to `STORAGE_ROOT_DIR` on the local
  filesystem and serves files back through
  `apps/web/app/api/storage/[...key]/route.ts`. A future
  `SupabaseStorageProvider` implementing the same interface (backed by a
  Supabase Storage bucket) removes the need for that serving route
  entirely — files would be served directly from the bucket's public URL.
  No other code changes.

## Testing

- **Vitest** for unit tests (Zod schema validation, auth token
  sign/verify) — fast, ESM-native, shares TypeScript config with the rest
  of the monorepo.
- **Playwright** for end-to-end smoke tests, one per in-scope module,
  exercising the real app against a real (seeded) local Postgres — not
  mocked. See `apps/web/e2e/`.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): lint, typecheck, unit
  tests, a real Postgres-backed build, then a second job that migrates +
  seeds the database and runs the Playwright suite against a production
  build.
- **Husky + lint-staged + commitlint** enforce Conventional Commits and
  run ESLint/Prettier on staged files before each commit.

## Deferred / explicitly out of scope for this PR

- Live Supabase project (Auth/Storage/Realtime) — coded against the
  interfaces above, no live credentials exist yet.
- Stripe, OpenAI (AI photo search), Yahoo IMAP (email integration) —
  modules 7-18 that depend on these are separate future PRs; see
  `docs/PROGRESS.md`.
- AG Grid Enterprise (pivot/tree-data/range-selection) — explicitly
  decided against; Community + TanStack Table cover this PR's needs.
