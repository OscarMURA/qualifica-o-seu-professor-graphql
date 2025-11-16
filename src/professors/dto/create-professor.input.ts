import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateProfessorInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    name: string;

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    department: string;

    @Field(() => ID)
    @IsUUID()
    @IsNotEmpty()
    universityId: string;
}
