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
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the seed script.');
}
const adapter = new adapter_pg_1.PrismaPg(DATABASE_URL);
const prisma = new client_1.PrismaClient({ adapter });
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
        console.log(`Aircraft: ${aircraft.tailNumber} (${ac.make} ${ac.model})`);
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