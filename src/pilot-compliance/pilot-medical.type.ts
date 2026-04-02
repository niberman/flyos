import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('PilotMedical')
export class PilotMedicalType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String, { name: 'medicalClass' })
  medicalClass: string;

  @Field(() => Date)
  expiresAt: Date;
}
