export declare class TelemetryEntry {
    aircraftId: string;
    timestamp?: Date;
    data: any;
}
export declare class BatchTelemetryInput {
    entries: TelemetryEntry[];
}
