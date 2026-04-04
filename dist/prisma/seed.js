"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '..', '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the seed script.');
}
const adapter = new adapter_pg_1.PrismaPg(DATABASE_URL);
const prisma = new client_1.PrismaClient({ adapter });
const RIBBON_TZ = 'America/Denver';
function getZonedYMD(timeZone, instant) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = fmt.formatToParts(instant);
    const n = (t) => Number(parts.find((p) => p.type === t).value);
    return { y: n('year'), m: n('month'), d: n('day') };
}
function pad2(n) {
    return String(n).padStart(2, '0');
}
function zonedWallToUtc(year, month, day, hour, minute, timeZone) {
    const target = `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
    const fmt = new Intl.DateTimeFormat('sv-SE', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    let lo = Date.UTC(year, month - 1, day - 1, 12, 0, 0);
    let hi = Date.UTC(year, month - 1, day + 1, 12, 0, 0);
    for (let i = 0; i < 56; i++) {
        const mid = Math.floor((lo + hi) / 2);
        const got = fmt.format(new Date(mid));
        if (got === target) {
            return new Date(mid);
        }
        if (got < target) {
            lo = mid + 1;
        }
        else {
            hi = mid - 1;
        }
    }
    throw new Error(`zonedWallToUtc: could not resolve ${target} in ${timeZone} (DST gap?)`);
}
function denverTodaySlot(hourStart, minuteStart, hourEnd, minuteEnd) {
    const { y, m, d } = getZonedYMD(RIBBON_TZ, new Date());
    return {
        start: zonedWallToUtc(y, m, d, hourStart, minuteStart, RIBBON_TZ),
        end: zonedWallToUtc(y, m, d, hourEnd, minuteEnd, RIBBON_TZ),
    };
}
const RIBBON_DEMO_BOOKING_IDS = [
    'f0000001-0000-4000-8000-000000000001',
    'f0000002-0000-4000-8000-000000000002',
    'f0000003-0000-4000-8000-000000000003',
    'f0000004-0000-4000-8000-000000000004',
    'f0000005-0000-4000-8000-000000000005',
];
async function main() {
    console.log('Seeding FlyOS database...');
    const org = await prisma.organization.upsert({
        where: { slug: 'centennial-flight-academy' },
        update: {},
        create: {
            name: 'Centennial Flight Academy',
            slug: 'centennial-flight-academy',
        },
    });
    console.log(`Organization: ${org.name} (${org.id})`);
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
    const passwordHash = await bcrypt.hash('flyosdev', 10);
    const dispatcher = await prisma.user.upsert({
        where: { email: 'dispatcher@flyos.local' },
        update: {},
        create: {
            email: 'dispatcher@flyos.local',
            passwordHash,
            role: client_1.Role.DISPATCHER,
            organizationId: org.id,
        },
    });
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
            role: client_1.Role.INSTRUCTOR,
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
            role: client_1.Role.STUDENT,
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
                airworthinessStatus: client_1.AirworthinessStatus.FLIGHT_READY,
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
                    kind: client_1.SchedulableResourceKind.AIRCRAFT,
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
            kind: client_1.SchedulableResourceKind.SIMULATOR,
            name: 'Frasca Simulator 1',
        },
    });
    if (!simExisting) {
        await prisma.schedulableResource.create({
            data: {
                organizationId: org.id,
                baseId: kapaBase.id,
                kind: client_1.SchedulableResourceKind.SIMULATOR,
                name: 'Frasca Simulator 1',
            },
        });
    }
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
    await prisma.booking.deleteMany({
        where: { id: { in: [...RIBBON_DEMO_BOOKING_IDS] } },
    });
    const ribbonAircraft = await prisma.aircraft.findMany({
        where: {
            organizationId: org.id,
            tailNumber: { in: ['N172SP', 'N182RG', 'N44BE'] },
        },
        include: { schedulableResource: true },
    });
    const resourceByTail = Object.fromEntries(ribbonAircraft.map((a) => [a.tailNumber, a.schedulableResource]));
    const r172 = resourceByTail['N172SP'];
    const r182 = resourceByTail['N182RG'];
    const r44 = resourceByTail['N44BE'];
    if (r172 && r182 && r44) {
        const b1 = denverTodaySlot(8, 0, 9, 30);
        const b2 = denverTodaySlot(14, 0, 16, 0);
        const b3 = denverTodaySlot(10, 0, 11, 30);
        const b4 = denverTodaySlot(17, 0, 18, 0);
        const b5 = denverTodaySlot(12, 0, 13, 0);
        await prisma.booking.create({
            data: {
                id: RIBBON_DEMO_BOOKING_IDS[0],
                userId: student.id,
                baseId: kapaBase.id,
                schedulableResourceId: r172.id,
                startTime: b1.start,
                endTime: b1.end,
                status: client_1.BookingStatus.SCHEDULED,
                participants: {
                    create: [
                        {
                            userId: student.id,
                            role: client_1.BookingParticipantRole.RENTER,
                            organizationId: org.id,
                        },
                    ],
                },
            },
        });
        await prisma.booking.create({
            data: {
                id: RIBBON_DEMO_BOOKING_IDS[1],
                userId: student.id,
                baseId: kapaBase.id,
                schedulableResourceId: r172.id,
                startTime: b2.start,
                endTime: b2.end,
                status: client_1.BookingStatus.DISPATCHED,
                dispatchedAt: b2.start,
                participants: {
                    create: [
                        {
                            userId: student.id,
                            role: client_1.BookingParticipantRole.RENTER,
                            organizationId: org.id,
                        },
                        {
                            userId: instructor.id,
                            role: client_1.BookingParticipantRole.INSTRUCTOR,
                            organizationId: org.id,
                        },
                    ],
                },
            },
        });
        await prisma.booking.create({
            data: {
                id: RIBBON_DEMO_BOOKING_IDS[2],
                userId: student.id,
                baseId: kapaBase.id,
                schedulableResourceId: r182.id,
                startTime: b3.start,
                endTime: b3.end,
                status: client_1.BookingStatus.IN_PROGRESS,
                dispatchedAt: b3.start,
                participants: {
                    create: [
                        {
                            userId: student.id,
                            role: client_1.BookingParticipantRole.RENTER,
                            organizationId: org.id,
                        },
                    ],
                },
            },
        });
        await prisma.booking.create({
            data: {
                id: RIBBON_DEMO_BOOKING_IDS[3],
                userId: student.id,
                baseId: kapaBase.id,
                schedulableResourceId: r182.id,
                startTime: b4.start,
                endTime: b4.end,
                status: client_1.BookingStatus.COMPLETED,
                dispatchedAt: b4.start,
                completedAt: b4.end,
                participants: {
                    create: [
                        {
                            userId: student.id,
                            role: client_1.BookingParticipantRole.RENTER,
                            organizationId: org.id,
                        },
                    ],
                },
            },
        });
        await prisma.booking.create({
            data: {
                id: RIBBON_DEMO_BOOKING_IDS[4],
                userId: student.id,
                baseId: kapaBase.id,
                schedulableResourceId: r44.id,
                startTime: b5.start,
                endTime: b5.end,
                status: client_1.BookingStatus.SCHEDULED,
                participants: {
                    create: [
                        {
                            userId: student.id,
                            role: client_1.BookingParticipantRole.RENTER,
                            organizationId: org.id,
                        },
                    ],
                },
            },
        });
        console.log(`Ribbon demo: 5 bookings on ${RIBBON_TZ} “today” at KAPA (N172SP ×2, N182RG ×2, N44BE ×1 cross-base).`);
    }
    else {
        console.warn('Ribbon demo skipped: missing schedulable resources for N172SP / N182RG / N44BE.');
    }
    console.log('Seed complete.');
}
main()
    .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map