# Latest Test Suite Report

Date prepared: 2026-04-01
Workspace: `/Users/noah/flyos`

## Scope of this report

This report is based on:

- The latest test files present in the repository
- File modification timestamps for those test files
- A fresh rerun of the available unit and e2e test commands

There were no saved Jest, coverage, JUnit, or other dedicated test-result artifacts in the repo to reconstruct an earlier historical run. Because of that, this document distinguishes between:

- what the latest testing work appears to be, based on the files added most recently
- what was verified directly by rerunning the suites on 2026-04-01

## Latest test work identified

The most recent test additions were seven service-level unit spec files created on 2026-04-01 between 14:22:59 and 14:23:35 local time:

- `src/aircraft/aircraft.service.spec.ts`
- `src/prisma/prisma.service.spec.ts`
- `src/users/users.service.spec.ts`
- `src/booking/booking.service.spec.ts`
- `src/ingestion/ingestion.service.spec.ts`
- `src/maintenance/maintenance.service.spec.ts`
- `src/auth/auth.service.spec.ts`

These files are currently untracked in git, which strongly suggests they represent the latest testing pass that was authored but not yet committed.

The repo also contains one existing e2e suite:

- `test/app.e2e-spec.ts`

## Test process used in this verification pass

The project exposes these relevant npm scripts in `package.json`:

- `npm test` -> `jest`
- `npm run test:e2e` -> `jest --config ./test/jest-e2e.json`
- `npm run test:cov` -> `jest --coverage`

For this report, the following commands were executed in `/Users/noah/flyos`:

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

`--runInBand` was used to keep the run deterministic and make the output easier to attribute to the current workspace state.

## Results summary

### Unit suite

Status: PASS

- Test suites: 7 passed, 7 total
- Tests: 36 passed, 36 total
- Snapshots: 0 total
- Runtime: 1.675 s

### E2E suite

Status: FAIL

- Test suites: 1 failed, 1 total
- Tests: 1 failed, 1 total
- Snapshots: 0 total
- Runtime: 1.739 s

## What the latest unit tests cover

### Aircraft service

5 tests covering:

- aircraft creation
- listing all aircraft
- lookup by id
- not-found handling
- airworthiness status update

### Auth service

5 tests covering:

- duplicate-registration rejection
- password hashing on registration
- JWT issuance on registration
- login rejection for missing user
- login rejection for bad password
- JWT issuance on valid login

Note: the suite contains 5 tests total because registration and login behaviors are grouped into five assertions across those scenarios.

### Booking service

7 tests covering:

- rejection when aircraft does not exist
- rejection when aircraft is grounded
- overlap/conflict rejection
- successful booking creation
- listing all bookings
- filtering bookings by user
- booking lookup by id

### Ingestion service

5 tests covering:

- maintenance log rejection for unknown aircraft
- maintenance log transaction creation
- validation of all unique aircraft ids in a batch
- telemetry rejection for unknown aircraft
- telemetry transaction creation

### Maintenance service

6 tests covering:

- no-op when no recent telemetry exists
- grounding on high cylinder head temperature
- grounding on low oil pressure
- no grounding for safe readings
- skipping null or invalid telemetry payloads
- deduplication of aircraft ids across multiple violations

### Prisma service

5 tests covering:

- missing `DATABASE_URL`
- blank `DATABASE_URL`
- successful construction with a valid URL
- connect on module init
- disconnect on module destroy

### Users service

3 tests covering:

- listing users
- user lookup by id
- not-found handling

## E2E failure analysis

The e2e failure happened during Nest application startup, before the `GET /` assertion completed.

Observed failure:

- `PrismaClientKnownRequestError`
- thrown from `src/auth/dev-user-seed.service.ts`
- failing call: `this.prisma.user.count()`

Why it failed:

- `DevUserSeedService` runs on module initialization when dev auth bypass is enabled
- during startup it queries the database to seed a development user if the users table is empty
- the e2e test boots the full `AppModule`, so it also boots this seed service
- in the current environment, that startup database access failed, which caused app initialization to fail and the e2e test to abort

Practical interpretation:

- the unit suite is currently healthy
- the e2e suite is not isolated from live database/bootstrap requirements
- the current e2e test behaves more like an environment-backed integration smoke test than a self-contained test

## Likely constraints and dependencies observed

Based on the code and runtime behavior, the latest testing process relies on:

- local Node dependencies already installed
- Jest + `ts-jest`
- Prisma client availability
- environment configuration for `DATABASE_URL`
- database reachability when booting the full application in e2e mode

## Gaps in the current testing process

- No persisted test artifacts were found for prior runs
- No coverage report was generated for this verification pass
- The e2e test does not stub or disable dev-user seeding
- The latest test files are not committed yet, so this testing work is still only present in the working tree

## Recommended next steps

- Commit the new unit spec files so the latest testing work is preserved in git history
- Add a dedicated test report artifact if historical auditability matters
- Make the e2e bootstrap independent of dev seeding, or provide a test database fixture for e2e runs
- Optionally run `npm run test:cov` if a coverage snapshot is needed for the document set
