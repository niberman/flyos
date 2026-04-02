import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  AirworthinessStatus,
  SchedulableResourceKind,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const adapter = new PrismaPg(DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding FlyOS database...');

  // --- Organization ---
  const org = await prisma.organization.upsert({
    where: { slug: 'centennial-flight-academy' },
    update: {},
    create: {
      name: 'Centennial Flight Academy',
      slug: 'centennial-flight-academy',
    },
  });
  console.log(`Organization: ${org.name} (${org.id})`);

  // --- Bases ---
  const kapaBase = await prisma.base.upsert({
    where: {
      organizationId_icaoCode: {
        organizationId: org.id,
        icaoCode: 'KAPA',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Main Base',
      icaoCode: 'KAPA',
      timezone: 'America/Denver',
    },
  });
  console.log(`Base: ${kapaBase.name} (${kapaBase.icaoCode})`);

  const kbjcBase = await prisma.base.upsert({
    where: {
      organizationId_icaoCode: {
        organizationId: org.id,
        icaoCode: 'KBJC',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Boulder Base',
      icaoCode: 'KBJC',
      timezone: 'America/Denver',
    },
  });
  console.log(`Base: ${kbjcBase.name} (${kbjcBase.icaoCode})`);

  // --- Users ---
  const passwordHash = await bcrypt.hash('flyosdev', 10);

  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@flyos.local' },
    update: {},
    create: {
      email: 'dispatcher@flyos.local',
      passwordHash,
      role: Role.DISPATCHER,
      organizationId: org.id,
    },
  });
  // Assign dispatcher to both bases
  for (const base of [kapaBase, kbjcBase]) {
    await prisma.userBase.upsert({
      where: {
        userId_baseId: { userId: dispatcher.id, baseId: base.id },
      },
      update: {},
      create: { userId: dispatcher.id, baseId: base.id },
    });
  }
  console.log(`User: ${dispatcher.email} (${dispatcher.role})`);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@flyos.local' },
    update: {},
    create: {
      email: 'instructor@flyos.local',
      passwordHash,
      role: Role.INSTRUCTOR,
      organizationId: org.id,
    },
  });
  await prisma.userBase.upsert({
    where: {
      userId_baseId: { userId: instructor.id, baseId: kapaBase.id },
    },
    update: {},
    create: { userId: instructor.id, baseId: kapaBase.id },
  });
  console.log(`User: ${instructor.email} (${instructor.role})`);

  const student = await prisma.user.upsert({
    where: { email: 'student@flyos.local' },
    update: {},
    create: {
      email: 'student@flyos.local',
      passwordHash,
      role: Role.STUDENT,
      organizationId: org.id,
    },
  });
  await prisma.userBase.upsert({
    where: {
      userId_baseId: { userId: student.id, baseId: kapaBase.id },
    },
    update: {},
    create: { userId: student.id, baseId: kapaBase.id },
  });
  console.log(`User: ${student.email} (${student.role})`);

  // --- Aircraft ---
  const aircraftData = [
    {
      tailNumber: 'N172SP',
      make: 'Cessna',
      model: '172S',
      homeBaseId: kapaBase.id,
    },
    {
      tailNumber: 'N182RG',
      make: 'Cessna',
      model: '182RG',
      homeBaseId: kapaBase.id,
    },
    {
      tailNumber: 'N44BE',
      make: 'Piper',
      model: 'PA-44 Seminole',
      homeBaseId: kbjcBase.id,
    },
  ];

  const futureQual = new Date('2035-12-31T23:59:59.000Z');

  for (const ac of aircraftData) {
    const aircraft = await prisma.aircraft.upsert({
      where: {
        organizationId_tailNumber: {
          organizationId: org.id,
          tailNumber: ac.tailNumber,
        },
      },
      update: {},
      create: {
        tailNumber: ac.tailNumber,
        make: ac.make,
        model: ac.model,
        organizationId: org.id,
        homeBaseId: ac.homeBaseId,
        airworthinessStatus: AirworthinessStatus.FLIGHT_READY,
      },
    });
    const hasResource = await prisma.schedulableResource.findUnique({
      where: { aircraftId: aircraft.id },
    });
    if (!hasResource) {
      await prisma.schedulableResource.create({
        data: {
          organizationId: org.id,
          baseId: ac.homeBaseId,
          kind: SchedulableResourceKind.AIRCRAFT,
          name: aircraft.tailNumber,
          aircraftId: aircraft.id,
        },
      });
    }
    console.log(`Aircraft: ${aircraft.tailNumber} (${ac.make} ${ac.model})`);
  }

  const simExisting = await prisma.schedulableResource.findFirst({
    where: {
      organizationId: org.id,
      kind: SchedulableResourceKind.SIMULATOR,
      name: 'Frasca Simulator 1',
    },
  });
  if (!simExisting) {
    await prisma.schedulableResource.create({
      data: {
        organizationId: org.id,
        baseId: kapaBase.id,
        kind: SchedulableResourceKind.SIMULATOR,
        name: 'Frasca Simulator 1',
      },
    });
  }

  // Qualifications for seeded users (dispatcher + instructor + student)
  const qualUsers = [dispatcher, instructor, student];
  for (const u of qualUsers) {
    await prisma.pilotMedical.deleteMany({
      where: { userId: u.id, organizationId: org.id },
    });
    await prisma.pilotMedical.create({
      data: {
        userId: u.id,
        organizationId: org.id,
        class: '2',
        expiresAt: futureQual,
      },
    });
    await prisma.flightReviewRecord.deleteMany({
      where: { userId: u.id, organizationId: org.id },
    });
    await prisma.flightReviewRecord.create({
      data: {
        userId: u.id,
        organizationId: org.id,
        completedAt: new Date('2024-06-01T00:00:00.000Z'),
        expiresAt: futureQual,
      },
    });
  }

  const fleet = await prisma.aircraft.findMany({
    where: { organizationId: org.id },
  });
  for (const u of qualUsers) {
    for (const ac of fleet) {
      await prisma.aircraftCheckout.deleteMany({
        where: {
          userId: u.id,
          aircraftId: ac.id,
          organizationId: org.id,
        },
      });
      await prisma.aircraftCheckout.create({
        data: {
          userId: u.id,
          aircraftId: ac.id,
          organizationId: org.id,
          expiresAt: futureQual,
        },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
