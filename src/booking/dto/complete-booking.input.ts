import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CompleteBookingInput {
  @Field(() => ID)
  @IsUUID()
  bookingId: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  hobbsIn?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  tachIn?: number;
}
