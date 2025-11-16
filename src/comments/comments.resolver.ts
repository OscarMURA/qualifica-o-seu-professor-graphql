import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user/current-user.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { User } from 'src/users/entities/user.entity';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { FilterCommentInput } from './dto/filter-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment } from './entities/comment.entity';
import { PaginatedComments, ProfessorRating } from './types/comment-response.type';

@Resolver(() => Comment)
export class CommentsResolver {
    constructor(private readonly commentsService: CommentsService) {}

    @Mutation(() => Comment)
    @Auth(ValidRoles.student, ValidRoles.admin)
    createComment(
        @Args('createCommentInput') createCommentInput: CreateCommentInput,
        @CurrentUser() user: User,
    ): Promise<Comment> {
        return this.commentsService.create(createCommentInput, user);
    }

    @Query(() => PaginatedComments, { name: 'comments' })
    findAll(
        @Args('filterInput', { nullable: true }) filterInput?: FilterCommentInput,
    ): Promise<PaginatedComments> {
        return this.commentsService.findAll(filterInput);
    }

    @Query(() => Comment, { name: 'comment' })
    findOne(@Args('id', { type: () => ID }) id: string): Promise<Comment> {
        return this.commentsService.findOne(id);
    }

    @Mutation(() => Comment)
    @Auth(ValidRoles.student, ValidRoles.admin)
    updateComment(
        @Args('id', { type: () => ID }) id: string,
        @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
        @CurrentUser() user: User,
    ): Promise<Comment> {
        return this.commentsService.update(id, updateCommentInput, user);
    }

    @Mutation(() => Comment)
    @Auth(ValidRoles.student, ValidRoles.admin)
    removeComment(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() user: User,
    ): Promise<Comment> {
        return this.commentsService.remove(id, user);
    }

    @Query(() => ProfessorRating, { name: 'professorRating' })
    getProfessorRating(
        @Args('professorId', { type: () => ID }) professorId: string,
    ): Promise<ProfessorRating> {
        return this.commentsService.getProfessorRating(professorId);
    }
}
