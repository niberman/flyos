import { PrismaService } from '../prisma/prisma.service';
export interface BookingComplianceContext {
    renterUserId: string;
    instructorUserId?: string | null;
    aircraftId: string | null;
    startTime: Date;
}
export declare class PilotComplianceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertEligibleForBooking(organizationId: string, ctx: BookingComplianceContext): Promise<void>;
}
