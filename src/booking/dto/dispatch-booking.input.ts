import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class DispatchBookingInput {
  @Field(() => ID)
  @IsUUID()
  bookingId: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  hobbsOut?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  tachOut?: number;
}
