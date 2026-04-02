/**
 * FlyOS end-to-end integration tests: multi-tenant GraphQL API across auth,
 * fleet, booking, ingestion, maintenance, and multi-base behavior.
 *
 * Requires PostgreSQL and DATABASE_URL. Disables dev JWT bypass so guards
 * enforce real tokens (see FLYOS_STRICT_AUTH).
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { AirworthinessStatus, PrismaClient } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';
import { MaintenanceService } from '../../src/maintenance/maintenance.service';

const repoRoot = path.join(__dirname, '../..');

type DatabasePrerequisite =
  | { ok: true; url: string }
  | { ok: false; reason: string };

function resolveDatabaseUrl(): string | null {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  const match = envFile.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  if (!match) {
    // Fall back to the repository's local docker-compose defaults so the
    // integration suite can run in a clean checkout after `docker compose up`.
    return 'postgresql://flyos:flyos_secret@localhost:5432/flyos?schema=public';
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function resolveDatabasePrerequisite(): DatabasePrerequisite {
  const url = resolveDatabaseUrl();
  if (!url) {
    return {
      ok: false,
      reason:
        'DATABASE_URL is not set. Add it to the environment or .env before running the database-backed e2e suite.',
    };
  }

  let host = 'localhost';
  let port = 5432;

  try {
    const parsed = new URL(url);
    host = parsed.hostname || host;
    port = Number(parsed.port || port);
  } catch {
    return {
      ok: false,
      reason:
        'DATABASE_URL is present but could not be parsed as a PostgreSQL connection string.',
    };
  }

  try {
    // Probe the TCP endpoint up front so the suite reports a clean skip when
    // Postgres is simply not running, instead of failing deep inside Prisma.
    execFileSync(
      process.execPath,
      [
        '-e',
        [
          'const net = require("node:net");',
          'const host = process.argv[1];',
          'const port = Number(process.argv[2]);',
          'const socket = net.createConnection({ host, port });',
          'socket.setTimeout(1000);',
          'socket.once("connect", () => { socket.end(); process.exit(0); });',
          'socket.once("timeout", () => { socket.destroy(); process.exit(2); });',
          'socket.once("error", () => process.exit(3));',
        ].join(' '),
        host,
        String(port),
      ],
      { stdio: 'ignore', timeout: 2000 },
    );
  } catch {
    return {
      ok: false,
      reason: `PostgreSQL is not reachable at ${host}:${port}. Start it with "docker compose up -d postgres".`,
    };
  }

  process.env.DATABASE_URL = url;
  return { ok: true, url };
}

const databasePrerequisite = resolveDatabasePrerequisite();
const describeDatabaseE2E = databasePrerequisite.ok ? describe : describe.skip;

if (!databasePrerequisite.ok) {
  // eslint-disable-next-line no-console
  console.warn(
    `[test:e2e] Skipping FlyOS API integration suite: ${databasePrerequisite.reason}`,
  );
}

function decodeJwtPayload(token: string): {
  sub: string;
  role: string;
  organizationId?: string;
} {
  const part = token.split('.')[1];
  const json = Buffer.from(
    part.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString('utf8');
  return JSON.parse(json) as {
    sub: string;
    role: string;
    organizationId?: string;
  };
}

function tomorrowIsoUtc(hour: number, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Pilot medical, BFR, and per-aircraft checkouts required by BookingService. */
async function seedPilotComplianceForUser(
  prisma: PrismaClient,
  userId: string,
  organizationId: string,
  aircraftIds: string[],
) {
  const future = new Date('2035-12-31T23:59:59.000Z');
  await prisma.pilotMedical.deleteMany({ where: { userId, organizationId } });
  await prisma.pilotMedical.create({
    data: { userId, organizationId, class: '2', expiresAt: future },
  });
  await prisma.flightReviewRecord.deleteMany({
    where: { userId, organizationId },
  });
  await prisma.flightReviewRecord.create({
    data: {
      userId,
      organizationId,
      completedAt: new Date('2024-06-01T00:00:00.000Z'),
      expiresAt: future,
    },
  });
  for (const aircraftId of aircraftIds) {
    await prisma.aircraftCheckout.deleteMany({
      where: { userId, aircraftId, organizationId },
    });
    await prisma.aircraftCheckout.create({
      data: { userId, aircraftId, organizationId, expiresAt: future },
    });
  }
}

describeDatabaseE2E('FlyOS API (e2e)', () => {
  let app: INestApplication<App>;
  let maintenanceService: MaintenanceService;
  let adminPrisma: PrismaClient;

  const testOrgIds: string[] = [];

  let dispatcher1Token: string;
  let student1Token: string;
  let otherDispatcherToken: string;

  let org1Id: string;
  let kapaBaseId: string;
  let kbjcBaseIdOrg1: string;

  let aircraftTest1Id: string;
  let aircraftTest2Id: string;
  let aircraftTest3Id: string;
  let aircraftOtherId: string;

  let centennialKapaBaseId: string;

  let bookingTest2Id: string;

  function gql(
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ) {
    const req = request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables });
    if (token) {
      void req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  beforeAll(async () => {
    process.env.FLYOS_STRICT_AUTH = 'true';
    if (!process.env.JWT_SECRET?.trim()) {
      process.env.JWT_SECRET = 'e2e-test-jwt-secret';
    }

    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });
    execFileSync('npx', ['prisma', 'db', 'seed'], {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    });

    const databaseUrl = process.env.DATABASE_URL.trim();
    adminPrisma = new PrismaClient({
      adapter: new PrismaPg(databaseUrl),
    });

    const centennial = await adminPrisma.organization.findUnique({
      where: { slug: 'centennial-flight-academy' },
      include: { bases: { where: { icaoCode: 'KAPA' } } },
    });
    if (!centennial?.bases[0]) {
      throw new Error('Seed should create Centennial org with KAPA base.');
    }
    centennialKapaBaseId = centennial.bases[0].id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    maintenanceService = app.get(MaintenanceService);
  });

  afterAll(async () => {
    if (adminPrisma) {
      for (const oid of [...new Set(testOrgIds)]) {
        await adminPrisma.booking.deleteMany({
          where: { base: { organizationId: oid } },
        });
      }
      if (testOrgIds.length > 0) {
        await adminPrisma.organization.deleteMany({
          where: { id: { in: [...new Set(testOrgIds)] } },
        });
      }
      await adminPrisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('1 — auth: register org, slug, default base, UserBase; login JWT; second user joins org', async () => {
    const reg1 = await gql(
      `mutation R($i: RegisterInput!) {
        register(input: $i) { access_token organizationId }
      }`,
      {
        i: {
          email: 'e2e.dispatcher1@flyos.test',
          password: 'TestPassw0rd!',
          role: 'DISPATCHER',
          organizationName: 'Test Flight School',
        },
      },
    ).expect(200);

    expect(reg1.body.errors).toBeUndefined();
    expect(reg1.body.data.register.access_token).toBeDefined();
    expect(reg1.body.data.register.organizationId).toBeDefined();

    dispatcher1Token = reg1.body.data.register.access_token;
    org1Id = reg1.body.data.register.organizationId;
    testOrgIds.push(org1Id);

    const orgRow = await adminPrisma.organization.findUnique({
      where: { id: org1Id },
    });
    expect(orgRow?.name).toBe('Test Flight School');
    expect(orgRow?.slug).toBe('test-flight-school');

    const defaultBase = await adminPrisma.base.findFirst({
      where: { organizationId: org1Id },
      orderBy: { createdAt: 'asc' },
    });
    expect(defaultBase).toBeTruthy();

    await adminPrisma.base.update({
      where: { id: defaultBase!.id },
      data: {
        icaoCode: 'KAPA',
        name: 'KAPA',
        timezone: 'America/Denver',
      },
    });
    kapaBaseId = defaultBase!.id;

    const dispatcherUser = await adminPrisma.user.findUnique({
      where: { email: 'e2e.dispatcher1@flyos.test' },
    });
    const ub1 = await adminPrisma.userBase.findFirst({
      where: { userId: dispatcherUser!.id, baseId: kapaBaseId },
    });
    expect(ub1).toBeTruthy();

    const loginRes = await gql(
      `mutation L($i: LoginInput!) { login(input: $i) { access_token organizationId } }`,
      {
        i: {
          email: 'e2e.dispatcher1@flyos.test',
          password: 'TestPassw0rd!',
        },
      },
    ).expect(200);

    expect(loginRes.body.errors).toBeUndefined();
    const loginToken = loginRes.body.data.login.access_token;
    const payload = decodeJwtPayload(loginToken);
    expect(payload.organizationId).toBe(org1Id);

    const reg2 = await gql(
      `mutation R2($i: RegisterInput!) {
        register(input: $i) { access_token organizationId }
      }`,
      {
        i: {
          email: 'e2e.student1@flyos.test',
          password: 'TestPassw0rd!',
          role: 'STUDENT',
          organizationId: org1Id,
        },
      },
    ).expect(200);

    expect(reg2.body.errors).toBeUndefined();
    student1Token = reg2.body.data.register.access_token;
    expect(reg2.body.data.register.organizationId).toBe(org1Id);

    const studentUser = await adminPrisma.user.findUnique({
      where: { email: 'e2e.student1@flyos.test' },
    });
    expect(studentUser?.organizationId).toBe(org1Id);
    const ub2 = await adminPrisma.userBase.findFirst({
      where: { userId: studentUser!.id, baseId: kapaBaseId },
    });
    expect(ub2).toBeTruthy();
  });

  it('2 — fleet: dispatcher creates two aircraft; student cannot; queries scoped by org and base', async () => {
    const a1 = await gql(
      `mutation C($input: CreateAircraftInput!) {
        createAircraft(input: $input) {
          id tailNumber airworthinessStatus homeBaseId
        }
      }`,
      {
        input: {
          tailNumber: 'N-TEST1',
          make: 'Cessna',
          model: '172',
          homeBaseId: kapaBaseId,
        },
      },
      dispatcher1Token,
    ).expect(200);

    expect(a1.body.errors).toBeUndefined();
    aircraftTest1Id = a1.body.data.createAircraft.id;
    expect(a1.body.data.createAircraft.airworthinessStatus).toBe(
      'FLIGHT_READY',
    );

    const a2 = await gql(
      `mutation C($input: CreateAircraftInput!) {
        createAircraft(input: $input) { id tailNumber homeBaseId }
      }`,
      {
        input: {
          tailNumber: 'N-TEST2',
          make: 'Cessna',
          model: '172',
          homeBaseId: kapaBaseId,
        },
      },
      dispatcher1Token,
    ).expect(200);

    expect(a2.body.errors).toBeUndefined();
    aircraftTest2Id = a2.body.data.createAircraft.id;

    const denied = await gql(
      `mutation C($input: CreateAircraftInput!) {
        createAircraft(input: $input) { id }
      }`,
      {
        input: {
          tailNumber: 'N-NOPE',
          make: 'X',
          model: 'Y',
          homeBaseId: kapaBaseId,
        },
      },
      student1Token,
    ).expect(200);

    expect(denied.body.errors?.length).toBeGreaterThan(0);

    const all = await gql(
      `query { aircraft { id tailNumber } }`,
      undefined,
      dispatcher1Token,
    ).expect(200);

    expect(all.body.errors).toBeUndefined();
    const tails = all.body.data.aircraft.map(
      (x: { tailNumber: string }) => x.tailNumber,
    );
    expect(tails).toContain('N-TEST1');
    expect(tails).toContain('N-TEST2');

    const atKapa = await gql(
      `query Q($id: ID) { aircraft(baseId: $id) { tailNumber } }`,
      { id: kapaBaseId },
      dispatcher1Token,
    ).expect(200);

    expect(atKapa.body.errors).toBeUndefined();
    const atKapaTails = atKapa.body.data.aircraft.map(
      (x: { tailNumber: string }) => x.tailNumber,
    );
    expect(atKapaTails).toContain('N-TEST1');
    expect(atKapaTails).toContain('N-TEST2');

    const foreignBase = await gql(
      `query FB($id: ID!) { aircraftByBase(baseId: $id) { tailNumber } }`,
      { id: centennialKapaBaseId },
      dispatcher1Token,
    ).expect(200);

    expect(foreignBase.body.errors?.length).toBeGreaterThan(0);
  });

  it('3 — booking: create, overlap fails, second aircraft ok, dispatcher vs student queries, cancel', async () => {
    const studentRow = await adminPrisma.user.findUnique({
      where: { email: 'e2e.student1@flyos.test' },
    });
    expect(studentRow).toBeTruthy();
    await seedPilotComplianceForUser(
      adminPrisma,
      studentRow!.id,
      org1Id,
      [aircraftTest1Id, aircraftTest2Id],
    );

    const t0 = tomorrowIsoUtc(10, 0);
    const t1 = tomorrowIsoUtc(12, 0);
    const tOverlapStart = tomorrowIsoUtc(11, 0);
    const tOverlapEnd = tomorrowIsoUtc(13, 0);

    const b1 = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id baseId aircraftId }
      }`,
      {
        input: {
          baseId: kapaBaseId,
          aircraftId: aircraftTest1Id,
          startTime: t0,
          endTime: t1,
        },
      },
      student1Token,
    ).expect(200);

    expect(b1.body.errors).toBeUndefined();
    expect(b1.body.data.createBooking.baseId).toBe(kapaBaseId);

    const overlap = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id }
      }`,
      {
        input: {
          baseId: kapaBaseId,
          aircraftId: aircraftTest1Id,
          startTime: tOverlapStart,
          endTime: tOverlapEnd,
        },
      },
      student1Token,
    ).expect(200);

    expect(overlap.body.errors?.length).toBeGreaterThan(0);

    const b2 = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id aircraft { tailNumber } }
      }`,
      {
        input: {
          baseId: kapaBaseId,
          aircraftId: aircraftTest2Id,
          startTime: tOverlapStart,
          endTime: tOverlapEnd,
        },
      },
      student1Token,
    ).expect(200);

    expect(b2.body.errors).toBeUndefined();
    bookingTest2Id = b2.body.data.createBooking.id;

    const allBookings = await gql(
      `query { bookings { id aircraft { tailNumber } } }`,
      undefined,
      dispatcher1Token,
    ).expect(200);

    expect(allBookings.body.errors).toBeUndefined();
    const bookingTails = allBookings.body.data.bookings.map(
      (x: { aircraft: { tailNumber: string } }) => x.aircraft.tailNumber,
    );
    expect(bookingTails).toContain('N-TEST1');
    expect(bookingTails).toContain('N-TEST2');

    const mine = await gql(
      `query { myBookings { id aircraft { tailNumber } } }`,
      undefined,
      student1Token,
    ).expect(200);

    expect(mine.body.errors).toBeUndefined();
    expect(mine.body.data.myBookings.length).toBe(2);

    const byKapa = await gql(
      `query BK($id: String!) { bookingsByBase(baseId: $id) { id } }`,
      { id: kapaBaseId },
      dispatcher1Token,
    ).expect(200);

    expect(byKapa.body.errors).toBeUndefined();
    expect(byKapa.body.data.bookingsByBase.length).toBe(2);

    const cancel = await gql(
      `mutation ($id: String!) { cancelBooking(bookingId: $id) }`,
      { id: bookingTest2Id },
      student1Token,
    ).expect(200);

    expect(cancel.body.errors).toBeUndefined();
    expect(cancel.body.data.cancelBooking).toBe(true);

    const after = await gql(`query { myBookings { id } }`, undefined, student1Token).expect(
      200,
    );
    expect(after.body.data.myBookings.length).toBe(1);
  });

  it('4 — cross-org isolation: other fleet and bookings invisible; book foreign tail fails', async () => {
    const regOther = await gql(
      `mutation R($i: RegisterInput!) {
        register(input: $i) { access_token organizationId }
      }`,
      {
        i: {
          email: 'e2e.other.dispatcher@flyos.test',
          password: 'TestPassw0rd!',
          role: 'DISPATCHER',
          organizationName: 'Other Flight School',
        },
      },
    ).expect(200);

    expect(regOther.body.errors).toBeUndefined();
    otherDispatcherToken = regOther.body.data.register.access_token;
    const org2Id = regOther.body.data.register.organizationId;
    testOrgIds.push(org2Id);

    const otherBase = await adminPrisma.base.findFirst({
      where: { organizationId: org2Id },
      orderBy: { createdAt: 'asc' },
    });

    const ac = await gql(
      `mutation C($input: CreateAircraftInput!) {
        createAircraft(input: $input) { id tailNumber }
      }`,
      {
        input: {
          tailNumber: 'N-OTHER',
          make: 'Piper',
          model: 'PA-28',
          homeBaseId: otherBase!.id,
        },
      },
      otherDispatcherToken,
    ).expect(200);

    expect(ac.body.errors).toBeUndefined();
    aircraftOtherId = ac.body.data.createAircraft.id;

    const fleet = await gql(
      `query { aircraft { tailNumber } }`,
      undefined,
      student1Token,
    ).expect(200);

    expect(fleet.body.errors).toBeUndefined();
    const tails = fleet.body.data.aircraft.map(
      (x: { tailNumber: string }) => x.tailNumber,
    );
    expect(tails).not.toContain('N-OTHER');

    const bookForeign = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id }
      }`,
      {
        input: {
          baseId: kapaBaseId,
          aircraftId: aircraftOtherId,
          startTime: tomorrowIsoUtc(14, 0),
          endTime: tomorrowIsoUtc(15, 0),
        },
      },
      student1Token,
    ).expect(200);

    expect(bookForeign.body.errors?.length).toBeGreaterThan(0);

    const otherBookings = await gql(
      `query { bookings { id } }`,
      undefined,
      otherDispatcherToken,
    ).expect(200);

    expect(otherBookings.body.errors).toBeUndefined();
    expect(otherBookings.body.data.bookings.length).toBe(0);
  });

  it('5 — telemetry + maintenance: normal vs critical CHT, grounding, alerts, foreign ingest denied', async () => {
    const okTelemetry = await gql(
      `mutation T($input: BatchTelemetryInput!) {
        ingestTelemetry(input: $input) { id }
      }`,
      {
        input: {
          entries: [
            {
              aircraftId: aircraftTest1Id,
              data: { cylinderHeadTemperature: 350, oilPressure: 55 },
            },
          ],
        },
      },
      dispatcher1Token,
    ).expect(200);

    expect(okTelemetry.body.errors).toBeUndefined();

    const acOk = await adminPrisma.aircraft.findUnique({
      where: { id: aircraftTest1Id },
    });
    expect(acOk?.airworthinessStatus).toBe(AirworthinessStatus.FLIGHT_READY);

    const badTelemetry = await gql(
      `mutation T($input: BatchTelemetryInput!) {
        ingestTelemetry(input: $input) { id }
      }`,
      {
        input: {
          entries: [
            {
              aircraftId: aircraftTest1Id,
              data: { cylinderHeadTemperature: 420 },
            },
          ],
        },
      },
      dispatcher1Token,
    ).expect(200);

    expect(badTelemetry.body.errors).toBeUndefined();

    await maintenanceService.checkTelemetryThresholds();

    const grounded = await adminPrisma.aircraft.findUnique({
      where: { id: aircraftTest1Id },
    });
    expect(grounded?.airworthinessStatus).toBe(AirworthinessStatus.GROUNDED);

    const bookGrounded = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id }
      }`,
      {
        input: {
          baseId: kapaBaseId,
          aircraftId: aircraftTest1Id,
          startTime: tomorrowIsoUtc(16, 0),
          endTime: tomorrowIsoUtc(17, 0),
        },
      },
      student1Token,
    ).expect(200);

    expect(bookGrounded.body.errors?.length).toBeGreaterThan(0);

    const alerts = await gql(
      `query A($aid: ID) {
        alertHistory(aircraftId: $aid, hours: 24) {
          parameter value threshold aircraftTailNumber
        }
      }`,
      { aid: aircraftTest1Id },
      dispatcher1Token,
    ).expect(200);

    expect(alerts.body.errors).toBeUndefined();
    const cht = alerts.body.data.alertHistory.find(
      (a: { parameter: string }) => a.parameter === 'cylinderHeadTemperature',
    );
    expect(cht).toBeTruthy();
    expect(cht.value).toBe(420);

    const foreignIngest = await gql(
      `mutation T($input: BatchTelemetryInput!) {
        ingestTelemetry(input: $input) { id }
      }`,
      {
        input: {
          entries: [
            {
              aircraftId: aircraftTest1Id,
              data: { cylinderHeadTemperature: 300 },
            },
          ],
        },
      },
      otherDispatcherToken,
    ).expect(200);

    expect(foreignIngest.body.errors?.length).toBeGreaterThan(0);
  });

  it('6 — multi-base: KBJC aircraft, bookingsByBase isolation, full fleet list', async () => {
    const kbjc = await adminPrisma.base.create({
      data: {
        organizationId: org1Id,
        name: 'KBJC',
        icaoCode: 'KBJC',
        timezone: 'America/Denver',
      },
    });
    kbjcBaseIdOrg1 = kbjc.id;

    const a3 = await gql(
      `mutation C($input: CreateAircraftInput!) {
        createAircraft(input: $input) { id tailNumber homeBaseId }
      }`,
      {
        input: {
          tailNumber: 'N-TEST3',
          make: 'Cessna',
          model: '182',
          homeBaseId: kbjcBaseIdOrg1,
        },
      },
      dispatcher1Token,
    ).expect(200);

    expect(a3.body.errors).toBeUndefined();
    aircraftTest3Id = a3.body.data.createAircraft.id;

    const studentRow6 = await adminPrisma.user.findUnique({
      where: { email: 'e2e.student1@flyos.test' },
    });
    await seedPilotComplianceForUser(
      adminPrisma,
      studentRow6!.id,
      org1Id,
      [aircraftTest1Id, aircraftTest2Id, aircraftTest3Id],
    );

    const book3 = await gql(
      `mutation B($input: CreateBookingInput!) {
        createBooking(input: $input) { id baseId }
      }`,
      {
        input: {
          baseId: kbjcBaseIdOrg1,
          aircraftId: aircraftTest3Id,
          startTime: tomorrowIsoUtc(18, 0),
          endTime: tomorrowIsoUtc(19, 0),
        },
      },
      student1Token,
    ).expect(200);

    expect(book3.body.errors).toBeUndefined();
    expect(book3.body.data.createBooking.baseId).toBe(kbjcBaseIdOrg1);

    const kapaBookings = await gql(
      `query KB1($id: String!) {
        bookingsByBase(baseId: $id) { aircraft { tailNumber } }
      }`,
      { id: kapaBaseId },
      dispatcher1Token,
    ).expect(200);

    expect(kapaBookings.body.errors).toBeUndefined();
    const kapaTails = kapaBookings.body.data.bookingsByBase.map(
      (b: { aircraft: { tailNumber: string } }) => b.aircraft.tailNumber,
    );
    expect(kapaTails).not.toContain('N-TEST3');

    const kbjcBookings = await gql(
      `query KB2($id: String!) {
        bookingsByBase(baseId: $id) { aircraft { tailNumber } }
      }`,
      { id: kbjcBaseIdOrg1 },
      dispatcher1Token,
    ).expect(200);

    expect(kbjcBookings.body.errors).toBeUndefined();
    expect(
      kbjcBookings.body.data.bookingsByBase.some(
        (b: { aircraft: { tailNumber: string } }) =>
          b.aircraft.tailNumber === 'N-TEST3',
      ),
    ).toBe(true);

    const fleet = await gql(
      `query { aircraft { tailNumber } }`,
      undefined,
      dispatcher1Token,
    ).expect(200);

    expect(fleet.body.errors).toBeUndefined();
    const allTails = fleet.body.data.aircraft.map(
      (x: { tailNumber: string }) => x.tailNumber,
    );
    expect(allTails.sort()).toEqual(
      ['N-TEST1', 'N-TEST2', 'N-TEST3'].sort(),
    );
  });
});
