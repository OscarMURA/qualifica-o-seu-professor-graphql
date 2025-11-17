import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProfessorInput } from './create-professor.input';

@InputType()
export class UpdateProfessorInput extends PartialType(CreateProfessorInput) {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  department?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  universityId?: string;
}