import { SquawkStatus } from '@prisma/client';
import { SquawkType } from './squawk.type';
import { SquawkService } from './squawk.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SquawkResolver {
    private readonly squawkService;
    private readonly prisma;
    constructor(squawkService: SquawkService, prisma: PrismaService);
    private requireOrg;
    squawks(user: {
        userId: string;
    }, aircraftId?: string): Promise<SquawkType[]>;
    createSquawk(user: {
        userId: string;
    }, aircraftId: string, title: string, description?: string, groundsAircraft?: boolean): Promise<SquawkType>;
    updateSquawkStatus(user: {
        userId: string;
    }, squawkId: string, status: SquawkStatus): Promise<SquawkType>;
}
