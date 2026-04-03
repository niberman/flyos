// ==========================================================================
// Alert — GraphQL type for threshold violation history
// ==========================================================================

import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType('Alert', {
  description:
    'A telemetry threshold violation for an aircraft, for operator visibility.',
})
export class Alert {
  @Field(() => ID, { description: 'Aircraft that recorded the violation.' })
  aircraftId: string;

  @Field(() => String, { description: 'Tail number of the aircraft.' })
  aircraftTailNumber: string;

  @Field(() => String, {
    description: 'Sensor parameter that violated a threshold.',
  })
  parameter: string;

  @Field(() => Float, { description: 'Recorded sensor value.' })
  value: number;

  @Field(() => Float, {
    description:
      'Threshold limit that was exceeded (min or max as applicable).',
  })
  threshold: number;

  @Field(() => Date, { description: 'Telemetry record timestamp.' })
  timestamp: Date;
}
