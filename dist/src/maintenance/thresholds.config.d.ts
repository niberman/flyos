export declare const DEFAULT_THRESHOLDS: {
    readonly cylinderHeadTemp: {
        readonly max: 400;
        readonly unit: "F";
    };
    readonly oilPressure: {
        readonly min: 25;
        readonly unit: "PSI";
    };
    readonly oilTemperature: {
        readonly max: 245;
        readonly unit: "F";
    };
    readonly egtSpread: {
        readonly max: 50;
        readonly unit: "F";
    };
    readonly fuelFlow: {
        readonly min: 3;
        readonly max: 25;
        readonly unit: "GPH";
    };
};
export type TelemetryThresholdViolation = {
    parameter: string;
    value: number;
    threshold: number;
};
export type TelemetryThresholdsConfig = {
    cylinderHeadTemp: {
        max: number;
        unit: 'F';
    };
    oilPressure: {
        min: number;
        unit: 'PSI';
    };
    oilTemperature: {
        max: number;
        unit: 'F';
    };
    egtSpread: {
        max: number;
        unit: 'F';
    };
    fuelFlow: {
        min: number;
        max: number;
        unit: 'GPH';
    };
};
export declare function evaluateTelemetryViolations(sensorData: unknown, thresholds?: TelemetryThresholdsConfig): TelemetryThresholdViolation[];
