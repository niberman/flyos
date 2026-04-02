import { AircraftType } from './aircraft.type';
import { BaseType } from './base.type';
import { AircraftService } from './aircraft.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';
import { AirworthinessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
export declare class AircraftResolver {
    private readonly aircraftService;
    private readonly prisma;
    private readonly tenantContext;
    constructor(aircraftService: AircraftService, prisma: PrismaService, tenantContext: TenantContext);
    private bindTenantContext;
    aircraft(user: {
        userId: string;
        role: string;
    }, baseId?: string): Promise<AircraftType[]>;
    aircraftByBase(user: {
        userId: string;
        role: string;
    }, baseId: string): Promise<AircraftType[]>;
    homeBase(aircraft: AircraftType): Promise<BaseType>;
    createAircraft(user: {
        userId: string;
        role: string;
    }, input: CreateAircraftInput): Promise<AircraftType>;
    updateAircraftStatus(user: {
        userId: string;
        role: string;
    }, id: string, status: AirworthinessStatus): Promise<AircraftType>;
}
