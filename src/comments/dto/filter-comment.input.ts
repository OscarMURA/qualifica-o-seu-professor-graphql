import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@InputType()
export class FilterCommentInput {
    @Field(() => String, { nullable: true })
    @IsUUID()
    @IsOptional()
    professorId?: string;

    @Field(() => String, { nullable: true })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    search?: string;

    @Field(() => Int, { nullable: true, defaultValue: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @Field(() => Int, { nullable: true, defaultValue: 20 })
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number;
}
