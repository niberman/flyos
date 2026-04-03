// ==========================================================================
// Default telemetry alert thresholds (piston GA)
// ==========================================================================
// Central configuration for predictive maintenance. Per-aircraft-type
// overrides can be layered on top of these defaults in the future.
// ==========================================================================

export const DEFAULT_THRESHOLDS = {
  cylinderHeadTemp: { max: 400, unit: 'F' },
  oilPressure: { min: 25, unit: 'PSI' },
  oilTemperature: { max: 245, unit: 'F' },
  egtSpread: { max: 50, unit: 'F' },
  fuelFlow: { min: 3.0, max: 25.0, unit: 'GPH' },
} as const;

export type TelemetryThresholdViolation = {
  parameter: string;
  value: number;
  threshold: number;
};

/** Shape of threshold config (numeric bounds; allows custom overrides in tests). */
export type TelemetryThresholdsConfig = {
  cylinderHeadTemp: { max: number; unit: 'F' };
  oilPressure: { min: number; unit: 'PSI' };
  oilTemperature: { max: number; unit: 'F' };
  egtSpread: { max: number; unit: 'F' };
  fuelFlow: { min: number; max: number; unit: 'GPH' };
};

export function evaluateTelemetryViolations(
  sensorData: unknown,
  thresholds: TelemetryThresholdsConfig = DEFAULT_THRESHOLDS,
): TelemetryThresholdViolation[] {
  if (sensorData === null || typeof sensorData !== 'object') {
    return [];
  }
  const d = sensorData as Record<string, unknown>;
  const out: TelemetryThresholdViolation[] = [];

  const cht = d.cylinderHeadTemperature;
  if (typeof cht === 'number' && cht > thresholds.cylinderHeadTemp.max) {
    out.push({
      parameter: 'cylinderHeadTemperature',
      value: cht,
      threshold: thresholds.cylinderHeadTemp.max,
    });
  }

  const op = d.oilPressure;
  if (typeof op === 'number' && op < thresholds.oilPressure.min) {
    out.push({
      parameter: 'oilPressure',
      value: op,
      threshold: thresholds.oilPressure.min,
    });
  }

  const ot = d.oilTemperature;
  if (typeof ot === 'number' && ot > thresholds.oilTemperature.max) {
    out.push({
      parameter: 'oilTemperature',
      value: ot,
      threshold: thresholds.oilTemperature.max,
    });
  }

  const egt = d.egtSpread;
  if (typeof egt === 'number' && egt > thresholds.egtSpread.max) {
    out.push({
      parameter: 'egtSpread',
      value: egt,
      threshold: thresholds.egtSpread.max,
    });
  }

  const ff = d.fuelFlow;
  if (typeof ff === 'number') {
    if (ff < thresholds.fuelFlow.min) {
      out.push({
        parameter: 'fuelFlow',
        value: ff,
        threshold: thresholds.fuelFlow.min,
      });
    } else if (ff > thresholds.fuelFlow.max) {
      out.push({
        parameter: 'fuelFlow',
        value: ff,
        threshold: thresholds.fuelFlow.max,
      });
    }
  }

  return out;
}
