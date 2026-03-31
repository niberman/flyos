import { AircraftType } from './aircraft.type';
import { AircraftService } from './aircraft.service';
import { CreateAircraftInput } from './dto/create-aircraft.input';
import { AirworthinessStatus } from '@prisma/client';
export declare class AircraftResolver {
    private readonly aircraftService;
    constructor(aircraftService: AircraftService);
    aircraft(): Promise<AircraftType[]>;
    createAircraft(input: CreateAircraftInput): Promise<AircraftType>;
    updateAircraftStatus(id: string, status: AirworthinessStatus): Promise<AircraftType>;
}
