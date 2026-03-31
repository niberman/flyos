export declare class MaintenanceLogEntry {
    aircraftId: string;
    timestamp?: Date;
    data: any;
}
export declare class BatchMaintenanceInput {
    entries: MaintenanceLogEntry[];
}
