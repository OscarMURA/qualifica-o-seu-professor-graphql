import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Comment } from '../entities/comment.entity';

@ObjectType()
export class PaginatedComments {
  @Field(() => [Comment])
  data: Comment[];

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class ProfessorRating {
  @Field(() => Number)
  averageRating: number;

  @Field(() => Int)
  totalComments: number;
}