// ==========================================================================
// evaluateTelemetryViolations — Unit Tests
// ==========================================================================
// Tests the pure function that checks sensor data against configurable
// thresholds and returns an array of violations. This function is the
// core of the predictive maintenance engine's decision logic.
// ==========================================================================

import {
  DEFAULT_THRESHOLDS,
  evaluateTelemetryViolations,
} from './thresholds.config';

describe('evaluateTelemetryViolations', () => {
  // ---- Null / invalid data handling ----

  it('returns empty array for null data', () => {
    expect(evaluateTelemetryViolations(null)).toEqual([]);
  });

  it('returns empty array for undefined data', () => {
    expect(evaluateTelemetryViolations(undefined)).toEqual([]);
  });

  it('returns empty array for non-object data (string)', () => {
    expect(evaluateTelemetryViolations('bad data')).toEqual([]);
  });

  it('returns empty array for non-object data (number)', () => {
    expect(evaluateTelemetryViolations(42)).toEqual([]);
  });

  it('returns empty array for empty object', () => {
    expect(evaluateTelemetryViolations({})).toEqual([]);
  });

  // ---- Cylinder head temperature ----

  it('detects cylinder head temp above max threshold', () => {
    const result = evaluateTelemetryViolations({
      cylinderHeadTemperature: DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 10,
    });
    expect(result).toEqual([
      {
        parameter: 'cylinderHeadTemperature',
        value: DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 10,
        threshold: DEFAULT_THRESHOLDS.cylinderHeadTemp.max,
      },
    ]);
  });

  it('does not flag cylinder head temp at exactly the max', () => {
    const result = evaluateTelemetryViolations({
      cylinderHeadTemperature: DEFAULT_THRESHOLDS.cylinderHeadTemp.max,
    });
    expect(result).toEqual([]);
  });

  it('does not flag cylinder head temp below max', () => {
    const result = evaluateTelemetryViolations({
      cylinderHeadTemperature: DEFAULT_THRESHOLDS.cylinderHeadTemp.max - 50,
    });
    expect(result).toEqual([]);
  });

  // ---- Oil pressure ----

  it('detects oil pressure below min threshold', () => {
    const result = evaluateTelemetryViolations({
      oilPressure: DEFAULT_THRESHOLDS.oilPressure.min - 5,
    });
    expect(result).toEqual([
      {
        parameter: 'oilPressure',
        value: DEFAULT_THRESHOLDS.oilPressure.min - 5,
        threshold: DEFAULT_THRESHOLDS.oilPressure.min,
      },
    ]);
  });

  it('does not flag oil pressure at exactly the min', () => {
    const result = evaluateTelemetryViolations({
      oilPressure: DEFAULT_THRESHOLDS.oilPressure.min,
    });
    expect(result).toEqual([]);
  });

  it('does not flag oil pressure above min', () => {
    const result = evaluateTelemetryViolations({
      oilPressure: DEFAULT_THRESHOLDS.oilPressure.min + 20,
    });
    expect(result).toEqual([]);
  });

  // ---- Oil temperature ----

  it('detects oil temperature above max threshold', () => {
    const result = evaluateTelemetryViolations({
      oilTemperature: DEFAULT_THRESHOLDS.oilTemperature.max + 1,
    });
    expect(result).toEqual([
      {
        parameter: 'oilTemperature',
        value: DEFAULT_THRESHOLDS.oilTemperature.max + 1,
        threshold: DEFAULT_THRESHOLDS.oilTemperature.max,
      },
    ]);
  });

  it('does not flag oil temperature at exactly max', () => {
    expect(
      evaluateTelemetryViolations({
        oilTemperature: DEFAULT_THRESHOLDS.oilTemperature.max,
      }),
    ).toEqual([]);
  });

  // ---- EGT spread ----

  it('detects EGT spread above max threshold', () => {
    const result = evaluateTelemetryViolations({
      egtSpread: DEFAULT_THRESHOLDS.egtSpread.max + 1,
    });
    expect(result).toEqual([
      {
        parameter: 'egtSpread',
        value: DEFAULT_THRESHOLDS.egtSpread.max + 1,
        threshold: DEFAULT_THRESHOLDS.egtSpread.max,
      },
    ]);
  });

  it('does not flag EGT spread at exactly max', () => {
    expect(
      evaluateTelemetryViolations({
        egtSpread: DEFAULT_THRESHOLDS.egtSpread.max,
      }),
    ).toEqual([]);
  });

  // ---- Fuel flow (dual-bounded: min and max) ----

  it('detects fuel flow below minimum', () => {
    const result = evaluateTelemetryViolations({
      fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.min - 0.5,
    });
    expect(result).toEqual([
      {
        parameter: 'fuelFlow',
        value: DEFAULT_THRESHOLDS.fuelFlow.min - 0.5,
        threshold: DEFAULT_THRESHOLDS.fuelFlow.min,
      },
    ]);
  });

  it('detects fuel flow above maximum', () => {
    const result = evaluateTelemetryViolations({
      fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.max + 1,
    });
    expect(result).toEqual([
      {
        parameter: 'fuelFlow',
        value: DEFAULT_THRESHOLDS.fuelFlow.max + 1,
        threshold: DEFAULT_THRESHOLDS.fuelFlow.max,
      },
    ]);
  });

  it('does not flag fuel flow within range', () => {
    expect(
      evaluateTelemetryViolations({
        fuelFlow:
          (DEFAULT_THRESHOLDS.fuelFlow.min + DEFAULT_THRESHOLDS.fuelFlow.max) /
          2,
      }),
    ).toEqual([]);
  });

  it('does not flag fuel flow at exactly min', () => {
    expect(
      evaluateTelemetryViolations({
        fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.min,
      }),
    ).toEqual([]);
  });

  it('does not flag fuel flow at exactly max', () => {
    expect(
      evaluateTelemetryViolations({
        fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.max,
      }),
    ).toEqual([]);
  });

  // ---- Multiple violations ----

  it('detects multiple violations in a single reading', () => {
    const result = evaluateTelemetryViolations({
      cylinderHeadTemperature: DEFAULT_THRESHOLDS.cylinderHeadTemp.max + 50,
      oilPressure: DEFAULT_THRESHOLDS.oilPressure.min - 10,
      oilTemperature: DEFAULT_THRESHOLDS.oilTemperature.max + 20,
      egtSpread: DEFAULT_THRESHOLDS.egtSpread.max + 5,
      fuelFlow: DEFAULT_THRESHOLDS.fuelFlow.min - 1,
    });
    expect(result).toHaveLength(5);
    expect(result.map((v) => v.parameter).sort()).toEqual([
      'cylinderHeadTemperature',
      'egtSpread',
      'fuelFlow',
      'oilPressure',
      'oilTemperature',
    ]);
  });

  // ---- Non-numeric sensor values ----

  it('ignores non-numeric sensor values', () => {
    const result = evaluateTelemetryViolations({
      cylinderHeadTemperature: 'hot',
      oilPressure: null,
      oilTemperature: undefined,
      egtSpread: true,
      fuelFlow: '10',
    });
    expect(result).toEqual([]);
  });

  // ---- Custom thresholds ----

  it('accepts custom threshold overrides', () => {
    const customThresholds = {
      ...DEFAULT_THRESHOLDS,
      cylinderHeadTemp: { max: 350, unit: 'F' as const },
    };
    const result = evaluateTelemetryViolations(
      { cylinderHeadTemperature: 375 },
      customThresholds,
    );
    expect(result).toEqual([
      {
        parameter: 'cylinderHeadTemperature',
        value: 375,
        threshold: 350,
      },
    ]);
  });

  // ---- Default threshold values sanity check ----

  it('has sensible default threshold values', () => {
    expect(DEFAULT_THRESHOLDS.cylinderHeadTemp.max).toBe(400);
    expect(DEFAULT_THRESHOLDS.oilPressure.min).toBe(25);
    expect(DEFAULT_THRESHOLDS.oilTemperature.max).toBe(245);
    expect(DEFAULT_THRESHOLDS.egtSpread.max).toBe(50);
    expect(DEFAULT_THRESHOLDS.fuelFlow.min).toBe(3.0);
    expect(DEFAULT_THRESHOLDS.fuelFlow.max).toBe(25.0);
  });
});
