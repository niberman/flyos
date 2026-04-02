import { PrismaService } from '../prisma/prisma.service';
import { PilotMedicalType } from './pilot-medical.type';
import { FlightReviewType } from './flight-review.type';
import { AircraftCheckoutType } from './aircraft-checkout.type';
export declare class PilotComplianceResolver {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private orgId;
    upsertPilotMedical(user: {
        userId: string;
    }, targetUserId: string, medicalClass: string, expiresAt: Date): Promise<PilotMedicalType>;
    upsertFlightReview(user: {
        userId: string;
    }, targetUserId: string, completedAt: Date, expiresAt: Date): Promise<FlightReviewType>;
    upsertAircraftCheckout(user: {
        userId: string;
    }, targetUserId: string, aircraftId: string, expiresAt: Date): Promise<AircraftCheckoutType>;
}
