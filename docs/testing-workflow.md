# Testing Workflow

This document records the intended validation order for FlyOS so unit and e2e failures are easier to interpret.

## 1. Verify dependencies

Install Node dependencies first:

```bash
npm install
```

The database-backed e2e suite also requires PostgreSQL plus a valid `DATABASE_URL`.

## 2. Run the unit suite

Use the unit suite as the first gate because it is fast and isolated from infrastructure:

```bash
npm test -- --runInBand
```

What this validates:

- service-layer business rules
- resolver delegation
- RBAC guard behavior
- tenant-context helpers
- tenant Prisma extension rewriting
- maintenance threshold evaluation

## 3. Start PostgreSQL for integration work

The repository ships with a local Postgres service definition:

```bash
docker compose up -d postgres
```

Check container state if needed:

```bash
docker compose ps
```

## 4. Run the e2e suite

```bash
npm run test:e2e -- --runInBand
```

The e2e command contains two different layers:

- `test/app.e2e-spec.ts`
  A no-database smoke test that confirms `GET /` serves the demo HTML shell.
- `test/e2e/flyos.e2e-spec.ts`
  A Postgres-backed GraphQL integration suite that runs migrations, seeds data, and validates auth, fleet, booking, ingestion, maintenance, and multi-base behavior.

If PostgreSQL is unavailable, the database-backed suite skips itself with an explicit prerequisite reason instead of failing during Prisma bootstrap.

## 5. Optional coverage run

If a coverage snapshot is needed after the functional pass:

```bash
npm run test:cov -- --runInBand
```

## 6. Interpreting failures

- Unit failures usually indicate logic regressions or changed contracts in services, resolvers, or guards.
- `app.e2e-spec.ts` failures usually indicate a broken root route or demo HTML wiring.
- `flyos.e2e-spec.ts` failures usually indicate an integration regression, a migration/seed issue, or a missing database prerequisite.
