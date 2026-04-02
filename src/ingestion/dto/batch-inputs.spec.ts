import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BatchMaintenanceInput } from './batch-maintenance.input';
import { BatchTelemetryInput } from './batch-telemetry.input';

const AIRCRAFT_ID = '33333333-3333-4333-8333-333333333333';

describe('BatchTelemetryInput validation', () => {
  it('accepts nested telemetry entries under whitelist validation', async () => {
    const input = plainToInstance(BatchTelemetryInput, {
      entries: [
        {
          aircraftId: AIRCRAFT_ID,
          timestamp: '2026-06-01T10:00:00.000Z',
          data: { oilPressure: 45, cylinderHeadTemperature: 380 },
        },
      ],
    });

    const errors = await validate(input, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(input.entries[0].timestamp).toBeInstanceOf(Date);
  });
});

describe('BatchMaintenanceInput validation', () => {
  it('accepts nested maintenance entries under whitelist validation', async () => {
    const input = plainToInstance(BatchMaintenanceInput, {
      entries: [
        {
          aircraftId: AIRCRAFT_ID,
          timestamp: '2026-06-01T10:00:00.000Z',
          data: { note: 'oil change' },
        },
      ],
    });

    const errors = await validate(input, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(input.entries[0].timestamp).toBeInstanceOf(Date);
  });
});
