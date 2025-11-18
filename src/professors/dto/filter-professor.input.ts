import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class FilterProfessorInput {
  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  universityId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  search?: string;
}