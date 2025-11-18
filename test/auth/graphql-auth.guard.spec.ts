import 'reflect-metadata';
import { GraphqlAuthGuard } from '../../src/auth/guards/graphql-auth/graphql-auth.guard';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('GraphqlAuthGuard', () => {
  it('getRequest debe extraer req del contexto GraphQL', () => {
    const guard = new GraphqlAuthGuard();
    const reqMock = { headers: {}, user: { id: '1' } };
    const executionContext: any = {};
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: reqMock })
    } as any);

    const result = guard.getRequest(executionContext);
    expect(result).toBe(reqMock);
  });
});
import 'reflect-metadata';
import { RoleProtected, META_DATA } from '../../src/auth/decorators/role-protected/role-protected.decorator';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

class DummyClass {
  @RoleProtected(ValidRoles.admin, ValidRoles.teacher)
  secured() {}

  @RoleProtected()
  open() {}
}

describe('RoleProtected Decorator', () => {
  it('debe asignar metadata con roles provistos', () => {
    const target = DummyClass.prototype;
    const metadata = Reflect.getMetadata(META_DATA, target.secured);
    expect(metadata).toEqual([ValidRoles.admin, ValidRoles.teacher]);
  });

  it('debe asignar arreglo vacío cuando no se proveen roles', () => {
    const target = DummyClass.prototype;
    const metadata = Reflect.getMetadata(META_DATA, target.open);
    expect(metadata).toEqual([]);
  });
});

