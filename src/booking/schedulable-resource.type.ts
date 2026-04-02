import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { SchedulableResourceKind } from '@prisma/client';
import { AircraftType } from '../aircraft/aircraft.type';

registerEnumType(SchedulableResourceKind, {
  name: 'SchedulableResourceKind',
  description: 'Kind of schedulable resource.',
});

@ObjectType('SchedulableResource')
export class SchedulableResourceType {
  @Field(() => ID)
  id: string;

  @Field(() => SchedulableResourceKind)
  kind: SchedulableResourceKind;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => ID)
  baseId: string;

  @Field(() => AircraftType, { nullable: true })
  aircraft?: AircraftType | null;
}
