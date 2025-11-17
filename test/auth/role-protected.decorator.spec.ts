import 'reflect-metadata';
import { RoleProtected, META_DATA } from '../../src/auth/decorators/role-protected/role-protected.decorator';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

class DummyClass {
  @RoleProtected(ValidRoles.admin)
  secured() {}

  @RoleProtected()
  open() {}
}

describe('RoleProtected Decorator', () => {
  it('debe retornar metadata con el rol aplicado', () => {
    const metadata = Reflect.getMetadata(META_DATA, DummyClass.prototype.secured);
    expect(metadata).toEqual([ValidRoles.admin]);
  });

  it('debe retornar arreglo vacío cuando no se proveen roles', () => {
    const metadata = Reflect.getMetadata(META_DATA, DummyClass.prototype.open);
    expect(metadata).toEqual([]);
  });
});
