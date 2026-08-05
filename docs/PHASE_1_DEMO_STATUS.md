# Phase 1 Demo Status

Snapshot of the Kostas ERP as a **fully local demo**. Everything runs on
your machine against a real Postgres database with real Drizzle schema and
real Server Actions — nothing here is a static mockup, and **no paid
account or external credential is required to run any of it**.

The three credential-dependent modules (Finance/Stripe, Emails/Yahoo, AI
Photo Search/OpenAI) run in a clearly-labelled **demo mode** instead of
being inert. See "What is mocked" below for exactly what that does and
does not do.

---

## Quick start

```bash
docker compose -f docker/docker-compose.yml up -d   # Postgres + Redis
pnpm install
cp .env.example .env                                # defaults work as-is
pnpm db:migrate
pnpm db:seed
pnpm dev                                            # http://localhost:3000
```

Or the one-shot script, which does all of the above:

```bash
./setup.sh --run
```

### Demo login

|              |                                       |
| ------------ | ------------------------------------- |
| **URL**      | http://localhost:3000/login           |
| **Email**    | `admin@kostas.local`                  |
| **Password** | `password123`                         |
| **Role**     | admin (full access to all 18 modules) |

The seed also creates seven other staff accounts — manager, sales, two
designers and three shop-floor users — all with the same password, so
role-specific views can be demoed. See the users table in
`packages/database/src/scripts/seed.ts`.

### Kiosk login (Employee Portal)

The shop-floor tablet has its own sign-in at
**http://localhost:3000/employee-login** — pick a name off the grid, then
enter a 4-digit PIN. All three shop-floor accounts (Maria, Tom, Andre) use
PIN **`1234`**. Office accounts have no PIN and never appear on the grid;
they sign in with email at `/login` as before.

### Reset and reseed the database

`pnpm db:seed` is **destructive and idempotent**: it truncates every demo
table first, then re-inserts the full dataset. Run it any time the data
gets messy during a walkthrough — no need to drop the database.

```bash
pnpm db:seed          # reset + reseed in one step
```

For a genuinely clean slate (schema included):

```bash
docker compose -f docker/docker-compose.yml down -v   # deletes the volume
docker compose -f docker/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
```

Seeded photo swatches are written to `apps/web/.local-storage/` (gitignored).

---

## What the seed contains

The dataset is deliberately **connected**, not a scattering of rows — a
project has measurements, fabrics, work orders, invoices, payments, emails,
photos and calendar events that all reference each other, so each module
shows something coherent.

| Data                 | Count | Notes                                                                  |
| -------------------- | ----- | ---------------------------------------------------------------------- |
| Users                | 8     | admin, manager, sales, 2 designers, 3 shop floor                       |
| Projects             | 10    | across every status: lead → completed, plus cancelled                  |
| Fabrics              | 10    | real mills, colours, warehouse locations, reserved yardage             |
| Items                | 12    | 3 at/below reorder threshold (low-stock demo)                          |
| Hardware             | 10    | with barcodes; 4 at/below reorder threshold                            |
| Hardware scan events | 7     | scan in/out/adjustment audit trail                                     |
| Work orders          | 10    | draft, pending approval, approved, in production, completed, cancelled |
| Production stages    | 14    | queued / in progress / blocked / done across 6 departments             |
| Client measurements  | 6     | with Konva canvas dimension data                                       |
| Calendar events      | 12    | past and upcoming, incl. one recurring (RRULE)                         |
| Invoices             | 10    | paid, sent, partially paid, overdue, draft, void                       |
| Invoice line items   | 17    | itemised labour + fabric                                               |
| Transactions         | 9     | succeeded, pending, failed, refund, adjustment                         |
| Emails               | 14    | unread, sent, attachments, all project-linked                          |
| Photo references     | 10    | real generated PNG swatches on disk                                    |
| Photo searches       | 3     | matched, confirmed, and no-match states                                |
| Design submissions   | 6     | across the full XState approval workflow                               |
| Employee actions     | 13    | closed shifts yesterday + an open one today, notes, photo upload       |

---

## What works fully locally

All 18 modules. No credentials needed for any of it.

| #   | Module                 | Notes                                                                    |
| --- | ---------------------- | ------------------------------------------------------------------------ |
| 1   | Dashboard              | GridStack widget layout, KPI cards, Recharts widget                      |
| 2   | Projects               | Full CRUD, TanStack Table, detail pages, status timeline                 |
| 3   | Client Measurements    | Konva canvas sketches, photo upload via local storage                    |
| 4   | Items & Inventory      | TanStack Table, dnd-kit reordering, React Flow warehouse map             |
| 5   | Fabric Inventory       | AG Grid Community, inline-editable stock                                 |
| 6   | Project Fabrics        | AG Grid Community, visual status pipeline                                |
| 7   | Hardware Inventory     | Barcode (zxing) + QR (html5-qrcode) scanning, scan audit log             |
| 8   | Work Orders            | 6-step wizard, PDF generation, browser print                             |
| 9   | Calendar               | FullCalendar (free plugins), drag-drop, recurring events                 |
| 10  | Finance                | Invoices, transactions, revenue charts, reports — **plus demo payments** |
| 11  | Emails                 | Inbox, compose, reply, forward — **demo mode, saved locally**            |
| 12  | AI Photo Search        | Upload, Sharp optimization, storage — **demo matching**                  |
| 13  | Department Status      | Live board via `packages/realtime` (polling)                             |
| 14  | Reports                | Real aggregations incl. revenue; labour-cost still labelled mock         |
| 15  | Employee Portal        | PIN kiosk login, bilingual EN/ES, live timer, offline queue, camera      |
| 16  | Digital Shop Board     | Kiosk/fullscreen mode, reuses the realtime layer                         |
| 17  | Universal Project View | Responsive accordion / card slider                                       |
| 18  | Designer Portal        | XState approval workflow, TipTap comments                                |

---

## What is mocked (and exactly how)

Demo mode is derived from each provider's own `isConfigured` flag — there
is **no separate toggle**. Supply real credentials and the module switches
to the real provider automatically; remove them and it returns to demo
mode. That means the app can never claim "demo" while talking to a live
service, or vice versa. See `apps/web/lib/demo-mode.ts`.

Demo mode never fabricates a real-world artifact. Nothing below sends a
message, charges a card, or calls a model.

### Finance — demo payments

- **Real Stripe collection stays disabled.** The "Pay with Stripe" button
  is present but inert without `STRIPE_SECRET_KEY`.
- A separate **"Record demo payment"** action simulates a successful
  payment locally: it writes a transaction and advances the invoice to
  `partially_paid` / `paid`.
- No Stripe object is created. `stripe_payment_intent_id` and
  `stripe_charge_id` stay **null**, and every demo row's description is
  prefixed **`[Demo payment]`** so it can be told apart from real revenue.
- The action refuses to run once Stripe _is_ configured, so demo rows can
  never be written against a live account.
- It also refuses to overpay: a demo payment is capped at the outstanding
  balance, and rejected on void or already-paid invoices.

### Emails — demo mailbox

- Header shows **"Demo Mode — Yahoo not connected"** with the last sync
  timestamp.
- Compose, **reply** and **forward** all work. Replies prefill the
  recipient, `Re:`/`Fwd:` subject and a quoted original, and thread via
  `In-Reply-To`.
- Sent messages are **saved to the local mailbox only**. No SMTP
  connection is opened; the transport is skipped entirely and the message
  gets a `@demo.kostas.local` Message-ID.
- The IMAP/SMTP provider path is untouched and takes over when the
  `EMAIL_*` vars are set.

### AI Photo Search — local colour matching

- Upload, Sharp optimization and local storage work exactly as in
  production.
- Matching falls back to a **colour-similarity heuristic** over the seeded
  reference photos (weighted RGB distance — see
  `apps/web/lib/demo-photo-match.ts`). This is a real computation, not a
  random score: uploading a green swatch genuinely surfaces the emerald
  mohair first.
- It is labelled as such in the UI. It is **colour similarity, not
  semantic understanding** — shape, texture and material matching arrive
  with real embeddings.
- **No embedding is written** in demo mode. A fabricated vector would
  poison the pgvector index for real searches later.
- The no-match and manual-tagging paths are both exercised by the seed.

### Realtime (Department Status, Shop Board)

- Both run on the **polling** provider in `packages/realtime` — TanStack
  Query `refetchInterval` against Postgres. This is fully functional
  locally and needs no external service.
- **Production will switch to Supabase Realtime** for push updates. The
  `RealtimeProvider` interface is transport-agnostic, so this is a
  provider swap, not a rewrite of either module. No hosted Supabase
  project exists yet and none is required.

### Still genuinely mocked data

- **Reports (module 14)**: the labour-cost report is the last
  clearly-labelled mock, pending payroll data no table holds yet. Every
  other report — project pipeline, production throughput, fabric usage,
  inventory levels and revenue — is a real aggregation query against the
  seeded data.
- **Revenue** now reads the finance tables directly (succeeded payments
  net of refunds, the same definition as the Finance module's chart, so
  the two can't disagree). Demo payments are real rows and do count, but
  each month reports how much of its total came from them — while Stripe
  is unconfigured that is every dollar, and the report says so.

---

## What needs credentials later

None of this is needed for a local demo. Get it only when moving past
localhost.

| Service                   | Unlocks                                       | Cost                                  | Get it when                              |
| ------------------------- | --------------------------------------------- | ------------------------------------- | ---------------------------------------- |
| Yahoo Developer OAuth app | Real inbox sync + delivery (module 11)        | Free                                  | You need real mail, not the demo mailbox |
| OpenAI API key            | True visual matching + embeddings (module 12) | ~$10–40/mo                            | You need semantic matching, not colour   |
| Stripe account            | Real card collection (module 10)              | Free to create; 2.9% + 30¢ per charge | You need to actually take money          |
| Supabase project          | Hosted auth, storage, Realtime push           | Free tier, then ~$25/mo               | Moving off local Docker                  |
| Vercel                    | Public hosting                                | Free tier, then ~$20/mo               | First hosted demo                        |
| Domain                    | A real URL                                    | ~$12/yr                               | Cosmetic; first client-facing demo       |

Placeholders for every one of these are commented in `.env.example` with a
note on what changes when they're filled in.

**AG Grid Enterprise** (pivot/tree-data/range-selection) and **FullCalendar
Scheduler Premium** (resource timeline) remain optional paid upgrades; the
free Community/standard versions are in use and fully functional.

---

## Known warnings

- **`react-camera-pro` peer dependency**: declares `react@^18.3.1`, this
  repo runs React 19. pnpm reports it unmet at install; it builds and runs
  fine, but check it first if Employee Portal camera capture misbehaves.
- **React Compiler "incompatible library" lint warnings**: informational
  only, on components using React Hook Form's `watch()` or TanStack
  Table's `useReactTable()`. `reactCompiler` isn't enabled — advisory.
- **Turbopack file watching on `/mnt/c` (WSL)**: edits to files on a
  Windows drive may not trigger a rebuild, which shows up as a change
  having "no effect" or a stale `ChunkLoadError`. Restart `pnpm dev`
  (delete `apps/web/.next` if it persists). This is an environment quirk,
  not an app bug.
- One unused-variable lint warning (`_filters` in
  `apps/web/app/(modules)/reports/api/queries.ts`) — intentional
  placeholder.

---

## Visual fidelity gaps

Functionally complete does not yet mean visually matched to the mockup
deck (`Kostas Upholstery App (4).pdf` at the repo root).

Done so far: the Shop Board's three-column colour-coded layout, the
external Designer Portal, and the app-wide brand pass — the monogram logo,
the deck's indigo `--primary` (`#4a3cae`, sampled from the deck rather than
guessed), the deck's sidebar order, and the header's search / "+ New" /
notification / user-badge chrome.

Also done: the Employee Portal — kiosk PIN login with the staff grid, the
persistent EN / ES / EN+ES toggle, and the desktop dashboard (stat row,
running timer, task checklists, today's summary, activity, work orders,
hours-by-task donut, employee overview).

Still open: the fixed information-dense dashboard layout, illustrated
measurement sketches with numbered callouts, the Employee Portal's
dedicated mobile screens (the dashboard is responsive, but the deck's
separate time-tracking / schedule / message-centre / photos screens with a
bottom tab bar aren't built), the Work Orders live letterhead preview, the
Photo Search confidence card, fabric colour swatches in the inventory
grids, and the office-side Designer Portal view.
