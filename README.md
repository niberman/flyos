# FlyOS - Flight School Management System

A backend system for managing flight school operations: aircraft fleet tracking, flight booking with conflict detection, batch data ingestion, and predictive maintenance. Built with NestJS, GraphQL (Apollo), Prisma ORM, and PostgreSQL.

## Architecture

FlyOS follows the **Model-View-Controller (MVC)** pattern:

- **Model** - Prisma schema (`prisma/schema.prisma`) + `PrismaService` for typed database access
- **View** - GraphQL schema (auto-generated at `src/schema.gql`) defining the API contract
- **Controller** - GraphQL resolvers handle requests, services contain business logic, guards enforce auth

```
Client Request
  → Apollo Server (GraphQL)
    → JwtAuthGuard (verify token)
      → RolesGuard (check RBAC)
        → Resolver (controller)
          → Service (business logic)
            → PrismaService (model)
              → PostgreSQL
```

## Data Model

```
┌──────────┐     ┌───────────┐     ┌────────────┐
│   User   │────<│  Booking  │>────│  Aircraft   │
│          │     │           │     │             │
│ id       │     │ id        │     │ id          │
│ email    │     │ startTime │     │ tailNumber  │
│ password │     │ endTime   │     │ make/model  │
│ role     │     │ userId    │     │ airworthiness│
└──────────┘     │ aircraftId│     └──────┬──────┘
                 └───────────┘            │
                              ┌───────────┴───────────┐
                              │                       │
                      ┌───────┴────────┐    ┌─────────┴───────┐
                      │MaintenanceLog  │    │   Telemetry     │
                      │                │    │                 │
                      │ id             │    │ id              │
                      │ timestamp      │    │ timestamp       │
                      │ data (JSONB)   │    │ data (JSONB)    │
                      │ aircraftId     │    │ aircraftId      │
                      └────────────────┘    └─────────────────┘
```

### Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `Role` | `STUDENT`, `INSTRUCTOR`, `DISPATCHER` | User access level |
| `AirworthinessStatus` | `FLIGHT_READY`, `GROUNDED` | Aircraft flight clearance |

## Modules

### Auth (`src/auth/`)

JWT-based authentication with role-based access control.

- **Register** - Creates user with bcrypt-hashed password, returns JWT
- **Login** - Validates credentials, returns JWT
- **JwtStrategy** - Passport strategy that extracts and verifies Bearer tokens
- **JwtAuthGuard** - Protects resolvers; in dev mode, falls back to impersonating a real DB user
- **RolesGuard** - Reads `@Roles()` decorator metadata and checks against `req.user.role`
- **DevUserSeedService** - Seeds a DISPATCHER user on startup if the DB is empty (dev only)

**Dev auth bypass** is enabled when `NODE_ENV != production`, `FLYOS_STRICT_AUTH != true`, and `FLYOS_DEV_MODE != false`. When active, requests without a valid JWT are automatically impersonated as a database user.

### Aircraft (`src/aircraft/`)

Fleet management with CRUD operations and airworthiness tracking.

| Operation | Access | Description |
|-----------|--------|-------------|
| `aircraft` query | Any authenticated user | List all aircraft |
| `createAircraft` mutation | DISPATCHER | Add aircraft to fleet |
| `updateAircraftStatus` mutation | INSTRUCTOR, DISPATCHER | Manually change airworthiness status |

### Booking (`src/booking/`)

Flight scheduling with two safety invariants:

1. **Airworthiness check** - Cannot book a GROUNDED aircraft
2. **Overlap prevention** - Cannot double-book an aircraft for overlapping time blocks

Overlap detection uses the interval formula: `existingStart < requestedEnd AND existingEnd > requestedStart`.

| Operation | Access | Description |
|-----------|--------|-------------|
| `createBooking` mutation | Any authenticated user | Book an aircraft (userId from JWT) |
| `bookings` query | INSTRUCTOR, DISPATCHER | List all bookings |
| `myBookings` query | Any authenticated user | List own bookings |

### Ingestion (`src/ingestion/`)

Batch upload endpoints for maintenance logs and telemetry data. Both mutations:

1. Validate that all referenced aircraft IDs exist
2. Create records atomically in a Prisma transaction (all-or-nothing)

| Operation | Access | Description |
|-----------|--------|-------------|
| `ingestMaintenanceLogs` mutation | INSTRUCTOR, DISPATCHER | Batch upload maintenance records |
| `ingestTelemetry` mutation | INSTRUCTOR, DISPATCHER | Batch upload sensor data |

### Maintenance (`src/maintenance/`)

Predictive maintenance engine running as a cron job every 5 minutes.

**Algorithm:**
1. Query telemetry records from the last 5 minutes
2. Check each record's JSONB `data` field against safety thresholds:
   - Cylinder head temperature > **400 F** → ground aircraft
   - Oil pressure < **30 PSI** → ground aircraft
3. Batch-update all violating aircraft to `GROUNDED` status

### Users (`src/users/`)

| Operation | Access | Description |
|-----------|--------|-------------|
| `me` query | Any authenticated user | Get own profile |
| `users` query | INSTRUCTOR, DISPATCHER | List all users |

### Prisma (`src/prisma/`)

Global database module. `PrismaService` extends `PrismaClient` using the `@prisma/adapter-pg` driver adapter with `DATABASE_URL` from environment. Connects on module init, disconnects on destroy.

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Set to `production` to disable dev auth bypass |
| `FLYOS_STRICT_AUTH` | No | Set to `true` to force JWT auth in non-prod |
| `FLYOS_DEV_MODE` | No | Set to `false` to disable dev auth bypass |
| `FLYOS_DEV_USER_ID` | No | UUID of user to impersonate in dev mode |
| `FLYOS_DEV_USER_ROLE` | No | Role override for dev impersonation |
| `FLYOS_DEV_SEED_EMAIL` | No | Email for auto-seeded dev user (default: `dev@flyos.local`) |
| `FLYOS_DEV_SEED_PASSWORD` | No | Password for auto-seeded dev user (default: `flyosdev`) |

### Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start in development mode (watch)
npm run start:dev

# Start in production
npm run start:prod
```

### GraphQL Playground

With the server running, open `http://localhost:3000/graphql` in a browser to access the Apollo Sandbox / GraphQL Playground.

## API Examples

### Register a user

```graphql
mutation {
  register(input: {
    email: "pilot@flyos.com"
    password: "secure123"
    role: STUDENT
  }) {
    access_token
  }
}
```

### Login

```graphql
mutation {
  login(input: {
    email: "pilot@flyos.com"
    password: "secure123"
  }) {
    access_token
  }
}
```

### Create an aircraft (DISPATCHER only)

```graphql
mutation {
  createAircraft(input: {
    tailNumber: "N12345"
    make: "Cessna"
    model: "172 Skyhawk"
  }) {
    id
    tailNumber
    airworthinessStatus
  }
}
```

### Book a flight

```graphql
mutation {
  createBooking(input: {
    aircraftId: "<aircraft-uuid>"
    startTime: "2026-06-01T10:00:00Z"
    endTime: "2026-06-01T12:00:00Z"
  }) {
    id
    startTime
    endTime
    aircraft { tailNumber }
  }
}
```

### Ingest telemetry data (INSTRUCTOR/DISPATCHER)

```graphql
mutation {
  ingestTelemetry(input: {
    entries: [
      {
        aircraftId: "<aircraft-uuid>"
        data: { oilPressure: 45, cylinderHeadTemperature: 380 }
      }
    ]
  }) {
    id
    timestamp
    data
  }
}
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

Tests mock `PrismaService` (and related collaborators) so services and GraphQL layers can be exercised without a live database.

### Test execution flow

Run the suites in this order when validating changes locally:

1. `npm test -- --runInBand`
2. `docker compose up -d postgres`
3. `npm run test:e2e -- --runInBand`

`test/app.e2e-spec.ts` is a self-contained smoke test for `GET /` and does not require PostgreSQL.

`test/e2e/flyos.e2e-spec.ts` is the full integration suite. It expects:

- `DATABASE_URL` to point at a reachable PostgreSQL instance
- Prisma migrations to be runnable
- Prisma seed data to be runnable

If PostgreSQL is not reachable, the database-backed integration suite is skipped explicitly instead of failing with a late Prisma startup error. That keeps the smoke path useful while still making the infrastructure dependency obvious.

**Services** — business logic in isolation:

- `prisma.service.spec.ts` — Connection lifecycle, `DATABASE_URL` validation
- `aircraft.service.spec.ts` — CRUD operations, status updates
- `booking.service.spec.ts` — Airworthiness checks, overlap detection, booking creation
- `ingestion.service.spec.ts` — Batch validation, transactional creation
- `maintenance.service.spec.ts` — Threshold evaluation, grounding logic
- `auth.service.spec.ts` — Registration, login, password hashing, JWT issuance
- `users.service.spec.ts` — User lookup

**Resolvers and HTTP** — delegation to services; guards are stubbed where needed so Nest does not instantiate real `JwtAuthGuard` dependencies (e.g. `UsersResolver` uses `Test.createTestingModule(...).overrideGuard(JwtAuthGuard).useValue(...)`):

- `*.resolver.spec.ts` under `auth/`, `users/`, `aircraft/`, `booking/`, `ingestion/`, and `maintenance/`
- `app.controller.spec.ts` — Root demo route

**Auth, tenancy, and maintenance config** — pure guards and helpers:

- `auth/guards/roles.guard.spec.ts` — RBAC metadata vs `req.user.role`
- `auth/dev-auth.config.spec.ts` — Dev auth bypass env rules
- `prisma/tenant.context.spec.ts` — Per-request tenant id via `AsyncLocalStorage`
- `prisma/tenant.middleware.spec.ts` — Prisma extension injects `organizationId` / base scoping (with `defineExtension` mocked for direct handler tests)
- `maintenance/thresholds.config.spec.ts` — Telemetry threshold evaluation

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module (wires everything together)
├── app.controller.ts                # Serves demo UI at GET /
├── schema.gql                       # Auto-generated GraphQL schema
├── prisma/
│   ├── prisma.module.ts             # Global database module
│   └── prisma.service.ts            # PrismaClient with pg adapter
├── auth/
│   ├── auth.module.ts               # Auth module (JWT, Passport, guards)
│   ├── auth.resolver.ts             # register/login mutations
│   ├── auth.service.ts              # Credential validation, JWT signing
│   ├── dev-auth.config.ts           # Dev bypass rules
│   ├── dev-user-seed.service.ts     # Auto-seeds dev user on empty DB
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Passport JWT extraction/verification
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Auth guard with dev bypass
│   │   └── roles.guard.ts           # RBAC guard
│   ├── decorators/
│   │   ├── roles.decorator.ts       # @Roles() metadata decorator
│   │   └── current-user.decorator.ts # @CurrentUser() param decorator
│   └── dto/
│       ├── register.input.ts
│       ├── login.input.ts
│       └── auth-response.type.ts
├── users/
│   ├── users.module.ts
│   ├── users.resolver.ts            # me, users queries
│   ├── users.service.ts             # User lookup logic
│   └── user.type.ts
├── aircraft/
│   ├── aircraft.module.ts
│   ├── aircraft.resolver.ts         # aircraft query, create/update mutations
│   ├── aircraft.service.ts          # Fleet CRUD, status updates
│   ├── aircraft.type.ts
│   └── dto/
│       └── create-aircraft.input.ts
├── booking/
│   ├── booking.module.ts
│   ├── booking.resolver.ts          # createBooking, bookings, myBookings
│   ├── booking.service.ts           # Overlap detection, airworthiness check
│   ├── booking.type.ts
│   └── dto/
│       └── create-booking.input.ts
├── ingestion/
│   ├── ingestion.module.ts
│   ├── ingestion.resolver.ts        # Batch upload mutations
│   ├── ingestion.service.ts         # Validation + transactional creation
│   ├── maintenance-log.type.ts
│   ├── telemetry.type.ts
│   └── dto/
│       ├── batch-maintenance.input.ts
│       └── batch-telemetry.input.ts
└── maintenance/
    ├── maintenance.module.ts
    └── maintenance.service.ts        # Predictive maintenance cron job
prisma/
└── schema.prisma                     # Database schema definition
```
