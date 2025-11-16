import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SeedAdmin {
    @Field(() => String)
    id: string;

    @Field(() => String)
    email: string;
}

@ObjectType()
export class SeedResponse {
    @Field(() => String)
    message: string;

    @Field(() => SeedAdmin, { nullable: true })
    admin: SeedAdmin | null;

    @Field(() => Int)
    universities: number;

    @Field(() => Int)
    professors: number;

    @Field(() => Int)
    students: number;

    @Field(() => Int)
    comments: number;
}

@ObjectType()
export class UnseedResponse {
    @Field(() => String)
    message: string;
}
