# FlyOS — agent context

Use this file as the first stop for **what the repo is**, **how it is organized**, and **how to validate changes**. For narrative architecture and API examples, see [README.md](./README.md). For the exact local test order and failure interpretation, see [docs/testing-workflow.md](./docs/testing-workflow.md).

---

## What this project is

**FlyOS** is a flight-school management **backend**: fleet (aircraft), booking, batch ingestion (maintenance logs + telemetry), and a **cron-driven predictive maintenance** job that can ground aircraft from telemetry thresholds. Stack: **NestJS**, **GraphQL (Apollo, code-first)**, **Prisma** with **`@prisma/adapter-pg`**, **PostgreSQL**, **JWT + Passport**, **RBAC**.

---

## Request path (mental model)

```
HTTP → Apollo (GraphQL) → JwtAuthGuard → RolesGuard → Resolver → Service → PrismaService → PostgreSQL
```

- **GraphQL** is **code-first**: types/resolvers live in `src/**`; the merged schema is emitted to **`src/schema.gql`** (regenerate by running the app or your usual workflow—do not treat hand-edits as the source of truth).
- **`GET /`** is a small demo shell via `AppController` (covered by `test/app.e2e-spec.ts`).

---

## Source layout (where to look)

| Area | Path | Responsibility |
|------|------|----------------|
| Entry / wiring | `src/main.ts`, `src/app.module.ts` | Bootstrap, GraphQL module, Schedule, global Prisma |
| Database | `prisma/schema.prisma`, `src/prisma/` | Schema, `PrismaService`, tenant context + Prisma extension/middleware |
| Auth | `src/auth/` | register/login, JWT strategy, guards, dev auth bypass, dev user seed |
| Users | `src/users/` | `me`, `users` |
| Aircraft | `src/aircraft/` | Fleet CRUD, airworthiness |
| Booking | `src/booking/` | Bookings, overlap + airworthiness rules |
| Ingestion | `src/ingestion/` | Batch maintenance + telemetry (transactional) |
| Maintenance | `src/maintenance/` | `@Cron` job, threshold evaluation, grounding |
| E2E / smoke | `test/` | Jest e2e config + specs |

---

## Domain rules agents often touch

- **Roles**: `STUDENT`, `INSTRUCTOR`, `DISPATCHER` (see Prisma `Role` enum and `@Roles()` usage).
- **Booking**: cannot book **GROUNDED** aircraft; **overlap** if `existingStart < requestedEnd && existingEnd > requestedStart`.
- **Ingestion**: batches validate aircraft IDs exist; writes are **atomic** (transaction).
- **Maintenance cron** (every 5 minutes): sample thresholds include cylinder head temp **> 400 F** and oil pressure **< 30 PSI** → set airworthiness to **GROUNDED** (see `src/maintenance/` and config/tests).
- **Multi-tenancy**: tenant scoping is implemented in **`src/prisma/`** (e.g. `TenantMiddleware`, `AsyncLocalStorage` / tenant context, Prisma extension injecting organization/base scope). Changing queries without respecting tenancy can leak or break data isolation.

---

## Auth and environment (short list)

- **Production**: real JWT required; configure `DATABASE_URL`, `JWT_SECRET`, etc.
- **Dev auth bypass**: when `NODE_ENV !== 'production'`, `FLYOS_STRICT_AUTH !== 'true'`, and `FLYOS_DEV_MODE !== 'false'`, unauthenticated GraphQL may be treated as an impersonated DB user (see `src/auth/dev-auth.config.ts` and guards).
- **`DevUserSeedService`**: can seed a dispatcher user when the DB is empty (dev-oriented); startup and e2e behavior depend on DB reachability.
- **Full variable table**: [README.md](./README.md#environment-variables).

Local PostgreSQL via Docker: **`docker compose up -d postgres`** (service name **`postgres`**, see `docker-compose.yml`).

---

## Prisma and migrations

- After **model changes**: update **`prisma/schema.prisma`**, run migrations appropriately for your workflow (`prisma migrate dev` / `deploy`), then **`npx prisma generate`**.
- App uses **Prisma 7** with the **pg adapter**; connection expectations are documented in README and `PrismaService`.

---

## Testing (what to run, in what order)

Preferred validation order (from `docs/testing-workflow.md`):

1. **`npm install`**
2. **Unit**: `npm test -- --runInBand` — fast gate (services, resolvers, guards, tenant helpers, maintenance thresholds).
3. **Postgres for integration**: `docker compose up -d postgres` and a valid **`DATABASE_URL`**
4. **E2E**: `npm run test:e2e -- --runInBand`
   - **`test/app.e2e-spec.ts`**: smoke for `GET /`, no DB.
   - **`test/e2e/flyos.e2e-spec.ts`**: full GraphQL integration (migrations, seed, auth, fleet, booking, ingestion, maintenance, multi-base). If PostgreSQL is unavailable, this suite is **skipped** with an explicit prerequisite message (not a late Prisma crash).
5. **Optional coverage**: `npm run test:cov -- --runInBand`

**Failure triage**: unit → logic/contracts; `app.e2e-spec` → root route/demo; `flyos.e2e-spec` → integration, migrations/seed, or DB setup.

**Conventions**: unit tests are `*.spec.ts` under `src/` (Jest `rootDir: src` per `package.json`); e2e uses `test/jest-e2e.json`. Resolvers often **override `JwtAuthGuard`** in tests; Prisma is **mocked** in unit tests unless the test is explicitly integration-style.

---

## Commands reference

| Task | Command |
|------|---------|
| Dev server (watch) | `npm run start:dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Unit tests | `npm test` / `npm test -- --runInBand` |
| E2E tests | `npm run test:e2e -- --runInBand` |
| Prisma seed | `npm run prisma:seed` |

GraphQL playground/Sandbox: with server up, typically **`http://localhost:3000/graphql`** (see README).

---

## Editing guidelines for agents

- Prefer **small, targeted diffs**; match existing Nest patterns (module/resolver/service/DTO layout).
- Any GraphQL contract change: update **code-first** types/inputs/resolvers; ensure **`src/schema.gql`** is regenerated in the PR workflow if the team commits it.
- Any persistence change: **Prisma schema + migrations + client generate**; respect **tenant scoping** in `src/prisma/`.
- Validate with **unit tests first**, then **e2e** when touching integration paths, DB, or auth startup.

---

## Related docs in this repo

| Doc | Use when |
|-----|----------|
| [README.md](./README.md) | Architecture narrative, env table, module/API tables, project tree |
| [docs/testing-workflow.md](./docs/testing-workflow.md) | Exact test sequence and failure interpretation |
| [prisma/schema.prisma](./prisma/schema.prisma) | Tables, relations, enums |
| [GEMINI.md](./GEMINI.md) | Legacy/snapshot project note (may be dated; prefer this file + README for process) |
