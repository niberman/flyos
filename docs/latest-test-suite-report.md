# Latest Test Suite Report

Date prepared: 2026-04-02
Workspace: `/Users/noah/flyos`

## Validation scope

This report reflects a fresh verification pass after updating test coverage, fixing schema/bootstrap issues, and aligning DTO validation with the live GraphQL contract.

## Commands executed

```bash
npm test -- --runInBand
docker compose up -d postgres
npm run test:e2e -- --runInBand
```

## Final results

### Unit suite

Status: PASS

- Test suites: 21 passed, 21 total
- Tests: 180 passed, 180 total
- Snapshots: 0 total

### E2E suite

Status: PASS

- Test suites: 2 passed, 2 total
- Tests: 7 passed, 7 total
- Snapshots: 0 total

## What changed during this verification pass

- Added unit coverage for booking date-range filters and booking cancellation edge cases.
- Added unit coverage for auth registration edge cases, including missing organizations and slug collision handling.
- Added DTO validation specs for booking and ingestion inputs so GraphQL `DateTime` handling and nested batch validation are locked in by tests.
- Fixed duplicate GraphQL `Base` type definitions that prevented schema generation during app bootstrap.
- Fixed DTO validation so booking timestamps validate as `Date` objects and batch ingestion inputs survive `whitelist` validation.
- Configured Prisma CLI seeding in `prisma.config.ts` so `npx prisma db seed` actually executes during e2e setup.

## Notes

- The e2e pass uses the local PostgreSQL container exposed by `docker compose`.
- Prisma now runs the seed script successfully during e2e setup.
- A `pg` deprecation warning still appears during the integration run:
  `Calling client.query() when the client is already executing a query is deprecated`
  The suites pass, but this warning should be investigated separately if you want a completely clean integration log.
