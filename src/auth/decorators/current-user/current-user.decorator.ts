import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';

export const getCurrentUser = (context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    return user;
};

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext): User => {
        return getCurrentUser(context);
    },
);
