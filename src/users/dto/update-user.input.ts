import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
    @Field(() => String, { nullable: true })
    @IsEmail()
    @IsOptional()
    email?: string;

    @Field(() => String, { nullable: true })
    @MinLength(6)
    @IsOptional()
    password?: string;

    @Field(() => String, { nullable: true })
    @IsNotEmpty()
    @IsOptional()
    fullName?: string;

    @Field(() => [String], { nullable: true })
    @IsArray()
    @IsOptional()
    roles?: ValidRoles[];
}
