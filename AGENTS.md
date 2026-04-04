# FlyOS — agent context

Use this file first for **what the repo is**, **where the real source lives**, and **how to validate changes**. For architectural narrative and API examples, see [README.md](./README.md). For the broader local test workflow, see [docs/testing-workflow.md](./docs/testing-workflow.md). For ribbon-specific backend linkage, see [docs/ribbon-backend-map.md](./docs/ribbon-backend-map.md).

---

## What this project is

**FlyOS** is a multi-tenant flight-school operations system with:

- a **NestJS + GraphQL backend**
- a **static scheduler / time-ribbon UI** served from **`public/`**

Current domain surface in code:

- organizations + bases
- users + JWT auth + RBAC
- aircraft + schedulable resources
- booking lifecycle + participants + GraphQL subscription updates
- maintenance / telemetry ingestion + predictive grounding
- squawks with airworthiness side effects
- pilot compliance rows used during booking eligibility checks

Stack:

- **NestJS 11**
- **Apollo GraphQL, code-first**
- **Prisma 7** with **`@prisma/adapter-pg`**
- **PostgreSQL**
- **JWT + Passport**
- **AsyncLocalStorage-backed tenant context**
- **plain HTML/CSS/JS frontend** in `public/`

This repo also contains generated output under **`dist/`**. Do **not** treat `dist/` as source of truth; edit `src/`, `public/`, `prisma/`, and docs instead.

---

## Request path (mental model)

```text
GET / or /scheduler
  → Express static shell (public/scheduler.html)
  → scheduler.js
  → POST /graphql
  → JwtAuthGuard
  → RolesGuard
  → Resolver
  → Service
  → PrismaService
  → PostgreSQL

@Cron(EVERY_5_MINUTES)
  → MaintenanceService
  → PrismaService
  → PostgreSQL
```

- **`src/main.ts`** binds `GET /` and `GET /scheduler` to the static ribbon shell before Nest routing.
- **GraphQL is code-first**. Types/resolvers in `src/**` emit the merged schema to **`src/schema.gql`**.
- **`bookingUpdated`** is a GraphQL subscription used for org-scoped booking lifecycle updates.

---

## Source layout (where to look)

| Area | Path | Responsibility |
|------|------|----------------|
| Entry / wiring | `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts` | Bootstrap, Express adapter, static ribbon shell, GraphQL, schedule |
| Static ribbon UI | `public/` | `scheduler.html`, `scheduler.css`, `scheduler.js` |
| Database + tenancy | `prisma/schema.prisma`, `prisma/seed.ts`, `prisma.config.ts`, `src/prisma/` | Prisma client bootstrap, tenant ALS/context, query rewriting, seed |
| Auth | `src/auth/` | register/login, JWT strategy, guards, dev auth bypass, dev user seed |
| Organization / bases | `src/base/`, `src/organization/` | Base CRUD, org-facing GraphQL types |
| Users | `src/users/` | `me`, `users` |
| Aircraft / fleet | `src/aircraft/` | Fleet CRUD, base-aware queries, airworthiness |
| Booking | `src/booking/` | Schedulable resources, participants, dispatch/complete/cancel lifecycle, subscriptions |
| Pilot compliance | `src/pilot-compliance/` | Medical / flight review / checkout rows and booking eligibility checks |
| Ingestion | `src/ingestion/` | Batch maintenance + telemetry ingestion |
| Maintenance | `src/maintenance/` | Threshold evaluation, cron grounding, alert history |
| Squawks | `src/squawk/` | Relational squawks and aircraft grounding reconciliation |
| Unit tests | `src/**/*.spec.ts` | Service/resolver/guard/helper tests |
| E2E / frontend smoke | `test/` | Root HTML smoke, jsdom scheduler tests, DB-backed GraphQL integration |

---

## Domain rules agents often touch

- **Multi-tenancy is central.**
  Most queries are tenant-scoped by the Prisma extension in `src/prisma/tenant.middleware.ts`.
  Directly scoped models get `organizationId` filters injected.
  `Booking` and `UserBase` are scoped through `base.organizationId`.
  `User.findUnique` auth lookups intentionally bypass tenant injection.

- **Organizations and bases are first-class.**
  Users belong to an organization and are associated to bases through `UserBase`.
  Aircraft have a required `homeBaseId`.
  Bookings happen at a specific `baseId`.

- **Aircraft are also schedulable resources.**
  Creating an aircraft auto-creates a matching `SchedulableResource`.
  `SchedulableResourceKind` also includes `SIMULATOR` and `CLASSROOM`, although the ribbon currently uses aircraft rows plus a seeded simulator resource.

- **`aircraftByBase` is not just home-base filtering.**
  It returns aircraft whose `homeBaseId` matches the base **or** aircraft that have a non-cancelled booking at that base.

- **Bookings target a schedulable resource, not the old `bookings.aircraft_id` design.**
  `CreateBookingInput` requires **exactly one** of:
  - `aircraftId`
  - `schedulableResourceId`

- **Booking overlap uses active lifecycle states only.**
  Overlap blocks bookings when an existing booking is in:
  - `SCHEDULED`
  - `DISPATCHED`
  - `IN_PROGRESS`

  Interval rule:

  ```text
  existing.startTime < requested.endTime
  AND
  existing.endTime > requested.startTime
  ```

- **Additional participants are restricted.**
  Extra participants must be `INSTRUCTOR` only.
  At most one instructor may be attached.
  The instructor cannot be the same user as the renter.

- **Booking completion is lifecycle-sensitive.**
  - `dispatchBooking` requires `INSTRUCTOR` or `DISPATCHER`
  - `completeBooking` requires the renter, an instructor, or a dispatcher
  - aircraft bookings require `hobbsIn` and `tachIn` on completion
  - `hobbsIn >= hobbsOut` and `tachIn >= tachOut`
  - completing an aircraft booking updates the aircraft Hobbs/Tach totals
  - `cancelBooking` is a **soft cancel** (`status = CANCELLED`, `cancelledAt` set)

- **Grounding rules now come from more than one subsystem.**
  Booking refuses grounded aircraft.
  Maintenance cron can ground aircraft from telemetry thresholds.
  Squawks can also ground aircraft.

- **Predictive maintenance thresholds currently enforced in code/tests are:**
  - cylinder head temperature `> 400 F`
  - oil pressure `< 25 PSI`
  - oil temperature `> 245 F`
  - EGT spread `> 50 F`
  - fuel flow `< 3.0 GPH` or `> 25.0 GPH`

- **Squawk side effects matter.**
  Creating an `OPEN` squawk with `groundsAircraft=true` immediately grounds the aircraft.
  Clearing the last open grounding squawk returns the aircraft to `FLIGHT_READY` until telemetry grounds it again.

- **Pilot compliance is part of booking creation.**
  `BookingService` calls `PilotComplianceService.assertEligibleForBooking(...)`.
  The renter must have:
  - a valid pilot medical
  - a valid flight review
  - a valid aircraft checkout when booking an aircraft-backed resource

  If the renter is a `STUDENT` and an instructor is attached, the instructor must also have a valid medical.

- **The scheduler board is timezone-aware and currently fixed to `America/Denver`.**
  The ribbon uses a local-day window in Mountain Time, then widens GraphQL queries by ±24 hours and clips bookings client-side.

- **The search box in the ribbon is local-only.**
  It filters already-loaded rows and does not hit the backend.

---

## Auth and environment

- **Production**: real JWT required. Configure at least `DATABASE_URL` and `JWT_SECRET`.
- **Dev auth bypass** is enabled only when:
  - `NODE_ENV !== 'production'`
  - `FLYOS_STRICT_AUTH !== 'true'`
  - `FLYOS_DEV_MODE !== 'false'`

- In dev bypass mode, `JwtAuthGuard` can impersonate:
  - the user from `FLYOS_DEV_USER_ID`
  - otherwise the first DB user
  - otherwise a user seeded by `DevUserSeedService`

- `FLYOS_DEV_USER_ROLE` can override the impersonated role.
- `DevUserSeedService` can create:
  - org slug `dev-org`
  - base `KDEV`
  - dispatcher `dev@flyos.local`

- Full env table: [README.md](./README.md#environment-variables)

Local PostgreSQL via Docker:

```bash
docker compose up -d postgres
```

---

## Seed and demo data

`prisma/seed.ts` is important for both e2e and manual ribbon verification. It currently seeds:

- organization: `Centennial Flight Academy`
- bases: `KAPA` and `KBJC`
- users: dispatcher, instructor, student
- aircraft:
  - `N172SP`
  - `N182RG`
  - `N44BE`
- a simulator resource: `Frasca Simulator 1`
- valid pilot medicals, flight reviews, and aircraft checkouts
- five demo bookings used by the ribbon

The ribbon demo data is built in **America/Denver** wall-clock time and then converted to UTC, so avoid changing timezone logic casually.

---

## Prisma and migrations

- Prisma uses **`@prisma/adapter-pg`** rather than the older direct URL constructor pattern.
- `prisma.config.ts` wires Prisma CLI seeding to:

```bash
ts-node prisma/seed.ts
```

- After model changes:
  1. update `prisma/schema.prisma`
  2. create/apply a migration for your workflow
  3. run `npx prisma generate`
  4. update seed / tests when domain assumptions changed

- Existing SQL migrations describe the project’s evolution from:
  - original single-org backend
  - aviation scheduling domain additions
  - multi-org / multi-base architecture

Do not hand-edit old generated migrations unless you are intentionally repairing migration history.

---

## Testing (what to run, in what order)

Preferred local validation order:

1. **`npm install`**
2. **Unit suite:** `npm test -- --runInBand`
3. **Postgres for integration:** `docker compose up -d postgres`
4. **E2E suite:** `npm run test:e2e -- --runInBand`
5. **Optional coverage:** `npm run test:cov -- --runInBand`

### What `npm run test:e2e` currently covers

- **`test/app.e2e-spec.ts`**
  Root HTML/static asset smoke test.
  Uses a mocked `PrismaService`.
  No database required.

- **`test/scheduler-frontend.e2e-spec.ts`**
  jsdom coverage for `public/scheduler.html`, `public/scheduler.css`, and `public/scheduler.js`.
  Validates DOM anchors, helper functions, ribbon rendering, and collapse/filter behavior.

- **`test/e2e/flyos.e2e-spec.ts`**
  Database-backed GraphQL integration.
  Runs:
  - `npx prisma migrate deploy`
  - `npx prisma db seed`

  Covers:
  - auth and JWT org payloads
  - base creation
  - fleet creation/querying
  - booking lifecycle and cross-org isolation
  - telemetry ingestion and maintenance grounding
  - multi-base behavior

  If PostgreSQL is unreachable, this suite skips with an explicit prerequisite message instead of failing deep in Prisma startup.

### Failure triage

- **Unit failures** usually mean logic, DTO, guard, tenancy, or resolver contract regressions.
- **`app.e2e-spec.ts`** failures usually mean broken static shell wiring or asset serving.
- **`scheduler-frontend.e2e-spec.ts`** failures usually mean broken DOM anchors, timezone helpers, ribbon rendering, or CSS/JS assumptions.
- **`flyos.e2e-spec.ts`** failures usually mean integration regressions, migration/seed issues, auth startup issues, or missing Postgres.

### Test conventions

- Unit tests live under `src/**` as `*.spec.ts` with Jest `rootDir: src`.
- E2E uses `test/jest-e2e.json`.
- Resolver unit tests often stub or override guards instead of wiring real auth dependencies.
- Prisma is usually mocked in unit tests.

---

## Commands reference

| Task | Command |
|------|---------|
| Dev server (watch) | `npm run start:dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format TS tests/source | `npm run format` |
| Unit tests | `npm test -- --runInBand` |
| E2E tests | `npm run test:e2e -- --runInBand` |
| Coverage | `npm run test:cov -- --runInBand` |
| Start local Postgres | `docker compose up -d postgres` |
| Prisma generate | `npx prisma generate` |
| Prisma migrate deploy | `npx prisma migrate deploy` |
| Prisma seed | `npm run prisma:seed` or `npx prisma db seed` |

GraphQL Sandbox is typically available at:

```text
http://localhost:3000/graphql
```

---

## Editing guidelines for agents

- Prefer **small, targeted diffs** and follow the existing Nest service/resolver/module layout.
- Edit **source**, not generated artifacts:
  - edit `src/**`, `public/**`, `prisma/**`, docs
  - do not patch `dist/**`

- Any GraphQL contract change:
  - update code-first types / inputs / resolvers
  - keep `src/schema.gql` in sync if the team commits regenerated schema output

- Any persistence change:
  - update Prisma schema
  - add/apply migrations appropriately
  - run `npx prisma generate`
  - review tenant scoping implications in `src/prisma/`

- Any booking, fleet, or base change:
  - check whether `public/scheduler.js` queries or render assumptions need updates
  - check whether `prisma/seed.ts` demo data still makes sense

- If you touch **`public/`**, preserve the DOM ids/classes the tests rely on:
  - `timeline-header`
  - `resource-rows`
  - `scroll-surface`
  - `canvas-wrapper`
  - `select-base`
  - `input-date`
  - `btn-load`
  - `fab`
  - `backend-map`
  - `status-msg`

- The ribbon is plain JS, not React/Vite/etc.
  Keep changes compatible with direct browser loading and jsdom tests.

- Be careful with tenant context.
  Query changes that skip `organizationId` or `base` scoping can leak cross-org data.

- `npm run format` only covers `src/**/*.ts` and `test/**/*.ts`.
  It does **not** format `public/`, root markdown, SQL, or Prisma files.

- For validation:
  - backend/service changes: run unit tests first
  - auth / DB / seed / tenancy changes: run DB-backed e2e
  - scheduler UI changes: run `npm run test:e2e -- --runInBand` so the jsdom ribbon suite runs too

---

## Related docs in this repo

| Doc | Use when |
|-----|----------|
| [README.md](./README.md) | Architecture narrative, env variables, example operations |
| [docs/testing-workflow.md](./docs/testing-workflow.md) | Intended test order and failure interpretation |
| [docs/ribbon-backend-map.md](./docs/ribbon-backend-map.md) | How the static scheduler maps to backend models and GraphQL operations |
| [docs/latest-test-suite-report.md](./docs/latest-test-suite-report.md) | Point-in-time validation report; useful context but may lag the repo |
| [prisma/schema.prisma](./prisma/schema.prisma) | Source of truth for models, relations, enums |
| [GEMINI.md](./GEMINI.md) | Older project note; treat as legacy context if it diverges from current code |
