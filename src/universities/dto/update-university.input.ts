import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { CreateUniversityInput } from './create-university.input';

@InputType()
export class UpdateUniversityInput extends PartialType(CreateUniversityInput) {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  location?: string;
}