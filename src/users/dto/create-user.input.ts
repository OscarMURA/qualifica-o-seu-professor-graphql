import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@InputType()
export class CreateUserInput {
    @Field(() => String)
    @IsEmail()
    email: string;

    @Field(() => String)
    @MinLength(6)
    password: string;

    @Field(() => String)
    @IsNotEmpty()
    fullName: string;

    @Field(() => [String], { nullable: true })
    @IsArray()
    @IsOptional()
    roles?: ValidRoles[];
}
