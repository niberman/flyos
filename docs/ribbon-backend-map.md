# Ribbon Backend Map

## Live Ribbon Linkage

The time ribbon at [`public/scheduler.html`](/Users/noah/flyos/public/scheduler.html) and [`public/scheduler.js`](/Users/noah/flyos/public/scheduler.js) is a read-focused shell.

It currently consumes:

| Ribbon control / surface | Backend route | GraphQL operation | Primary models |
|---|---|---|---|
| Board shell | `GET /`, `GET /scheduler` | n/a | n/a |
| Base selector | `POST /graphql` | `bases` | `Base`, `UserBase` |
| Aircraft rows | `POST /graphql` | `aircraftByBase` | `Aircraft`, `SchedulableResource`, `Base` |
| Booking ribbons | `POST /graphql` | `bookingsByBase` | `Booking`, `BookingParticipant`, `Aircraft` |
| Alert shortcut | `POST /graphql` | `alertHistory` | `Telemetry`, `Aircraft` |
| Users/Auth shortcut | `POST /graphql` | `me`, `users`, `login`, `register` | `User`, `Organization` |

## Backend Domain Map

| Ribbon module | GraphQL surface | Prisma models |
|---|---|---|
| `Board` | `bases`, `aircraftByBase`, `bookingsByBase` | `Base`, `Aircraft`, `Booking`, `BookingParticipant` |
| `Fleet` | `aircraft`, `aircraftByBase`, `createAircraft`, `updateAircraftStatus` | `Aircraft`, `SchedulableResource`, `Base` |
| `Bookings` | `createBooking`, `bookings`, `myBookings`, `bookingsByBase`, `bookingsByAircraft`, `dispatchBooking`, `completeBooking`, `cancelBooking` | `Booking`, `BookingParticipant`, `SchedulableResource` |
| `Maintenance` | `alertHistory`, `squawks`, `ingestTelemetry`, `ingestMaintenanceLogs`, `createSquawk`, `updateSquawkStatus`, `updateAircraftStatus` | `Telemetry`, `MaintenanceLog`, `Squawk`, `Aircraft` |
| `Compliance` | `upsertPilotMedical`, `upsertFlightReview`, `upsertAircraftCheckout` | `PilotMedical`, `FlightReviewRecord`, `AircraftCheckout` |
| `Users And Auth` | `me`, `users`, `login`, `register` | `User`, `Organization`, `UserBase` |
| `Bases` | `bases`, `createBase` | `Base`, `UserBase`, `SchedulableResource` |

## Current UI Contract

- The ribbon is now explicit about which backend module is selected through the backend-linkage panel.
- The search field is local-only; it filters already-loaded rows and does not hit the backend.
- The floating action button now reloads the board instead of implying unwired booking creation.
- Tabs and sidebar labels now match actual backend domains instead of generic placeholders like weather or messages.
