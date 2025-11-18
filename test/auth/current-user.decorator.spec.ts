import 'reflect-metadata';
import { getCurrentUser } from '../../src/auth/decorators/current-user/current-user.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContext } from '@nestjs/common';

describe('CurrentUser Decorator Helper', () => {
  it('debe retornar el usuario desde el contexto GraphQL', () => {
    const user = { id: '1', email: 'user@test.com' };

    const execContext: ExecutionContext = {
      getType: () => 'graphql',
      getClass: () => ({} as any),
      getHandler: () => ({} as any),
      switchToHttp: () => ({ getRequest: () => ({ user }) } as any),
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getArgs: () => [],
      getArgByIndex: () => undefined,
    } as any;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user } })
    } as any);

    const result = getCurrentUser(execContext);
    expect(result).toBe(user);
  });
});
