import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class CreateCommentInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    content: string;

    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @Field(() => ID)
    @IsUUID()
    @IsNotEmpty()
    professorId: string;
}
