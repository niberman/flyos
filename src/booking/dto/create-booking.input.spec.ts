import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBookingInput } from './create-booking.input';

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

describe('CreateBookingInput validation', () => {
  it('accepts ISO timestamps after GraphQL/class-transformer convert them to Date objects', async () => {
    const input = plainToInstance(CreateBookingInput, {
      baseId: UUID_A,
      aircraftId: UUID_B,
      startTime: '2026-06-01T10:00:00.000Z',
      endTime: '2026-06-01T12:00:00.000Z',
    });

    const errors = await validate(input, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(input.startTime).toBeInstanceOf(Date);
    expect(input.endTime).toBeInstanceOf(Date);
  });
});
