import 'reflect-metadata';
import { Auth } from '../../src/auth/decorators/auth/auth.decorator';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';
import { GraphqlAuthGuard } from '../../src/auth/guards/graphql-auth/graphql-auth.guard';
import { UserRoleGuard } from '../../src/auth/guards/user-role/user-role.guard';

class AuthClass {
  @Auth(ValidRoles.admin)
  adminOnly() {}

  @Auth()
  anyUser() {}
}

describe('Auth Decorator', () => {
  it('aplica roles y guards con rol admin', () => {
    const roles = Reflect.getMetadata('roles', AuthClass.prototype.adminOnly);
    const guards = Reflect.getMetadata('__guards__', AuthClass.prototype.adminOnly);
    expect(roles).toEqual([ValidRoles.admin]);
    expect(guards).toHaveLength(2);
    expect(guards[0]).toBe(GraphqlAuthGuard);
    expect(guards[1]).toBe(UserRoleGuard);
  });

  it('aplica guards sin roles', () => {
    const roles = Reflect.getMetadata('roles', AuthClass.prototype.anyUser);
    const guards = Reflect.getMetadata('__guards__', AuthClass.prototype.anyUser);
    expect(roles).toEqual([]);
    expect(guards).toHaveLength(2);
  });
});
