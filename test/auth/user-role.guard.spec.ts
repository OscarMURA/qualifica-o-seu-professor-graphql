import 'reflect-metadata';
import { UserRoleGuard } from '../../src/auth/guards/user-role/user-role.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    guard = new UserRoleGuard(reflector);
  });

  const buildContext = (user: any) => {
    const executionContext: any = {
      getHandler: jest.fn(),
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user } })
    } as any);
    return executionContext;
  };

  it('debe permitir paso si no hay roles requeridos', () => {
    reflector.get.mockReturnValue(undefined);
    const context = buildContext({});
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('debe lanzar BadRequest si falta user', () => {
    reflector.get.mockReturnValue([ValidRoles.admin]);
    const context = buildContext(null);
    expect(() => guard.canActivate(context as any)).toThrow(BadRequestException);
  });

  it('debe permitir paso si usuario tiene rol válido', () => {
    reflector.get.mockReturnValue([ValidRoles.teacher]);
    const context = buildContext({ roles: [ValidRoles.teacher], email: 't@example.com' });
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('debe lanzar Forbidden si usuario no tiene rol válido', () => {
    reflector.get.mockReturnValue([ValidRoles.admin]);
    const context = buildContext({ roles: [ValidRoles.student], email: 's@example.com' });
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });
});

