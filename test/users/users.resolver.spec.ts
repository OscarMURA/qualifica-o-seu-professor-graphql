import 'reflect-metadata';
import { UsersResolver } from '../../src/users/users.resolver';
import { UsersService } from '../../src/users/users.service';
import { CreateUserInput } from '../../src/users/dto/create-user.input';
import { UpdateUserInput } from '../../src/users/dto/update-user.input';

const mockUser = {
  id: 'u-1',
  email: 'user@example.com',
  fullName: 'User Example',
  roles: ['student'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: jest.Mocked<UsersService>;

  beforeEach(() => {
    service = {
      createUser: jest.fn().mockResolvedValue(mockUser),
      findAll: jest.fn().mockResolvedValue([mockUser]),
      findOneById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ ...mockUser, fullName: 'Updated Name' }),
      remove: jest.fn().mockResolvedValue(mockUser),
    } as any;
    resolver = new UsersResolver(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('createUser delega en service.createUser', async () => {
    const input: CreateUserInput = { email: 'new@example.com', fullName: 'New', password: 'pass', roles: ['student'], isActive: true } as any;
    const result = await resolver.createUser(input);
    expect(service.createUser).toHaveBeenCalledWith(input);
    expect(result).toBe(mockUser);
  });

  it('findAll delega en service.findAll', async () => {
    const result = await resolver.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('me devuelve usuario del decorador', () => {
    const me = resolver.me(mockUser as any);
    expect(me).toBe(mockUser);
  });

  it('findOne delega en service.findOneById', async () => {
    const result = await resolver.findOne('u-1');
    expect(service.findOneById).toHaveBeenCalledWith('u-1');
    expect(result.id).toBe('u-1');
  });

  it('updateUser delega en service.update', async () => {
    const input: UpdateUserInput = { fullName: 'Updated Name' } as any;
    const result = await resolver.updateUser('u-1', input);
    expect(service.update).toHaveBeenCalledWith('u-1', input);
    expect(result.fullName).toBe('Updated Name');
  });

  it('removeUser delega en service.remove', async () => {
    const result = await resolver.removeUser('u-1');
    expect(service.remove).toHaveBeenCalledWith('u-1');
    expect(result.id).toBe('u-1');
  });

  it('createUser con email duplicado arroja error', async () => {
    service.createUser.mockRejectedValue(new Error('Duplicate email'));
    const input: CreateUserInput = { email: 'user@example.com', fullName: 'User', password: 'pass', roles: ['student'], isActive: true } as any;
    await expect(resolver.createUser(input)).rejects.toThrow();
  });

  it('findOne con ID no existente arroja error', async () => {
    service.findOneById.mockRejectedValue(new Error('Not found'));
    await expect(resolver.findOne('missing-id')).rejects.toThrow();
  });

  it('updateUser actualiza parcialmente', async () => {
    service.update.mockResolvedValue({ ...mockUser, isActive: false } as any);
    const result = await resolver.updateUser('u-1', { isActive: false } as any);
    expect(result.isActive).toBe(false);
  });

  it('me retorna usuario autenticado', () => {
    const user = { ...mockUser, id: 'current-user' } as any;
    const result = resolver.me(user);
    expect(result.id).toBe('current-user');
  });

  it('findAll retorna lista vacía si no hay usuarios', async () => {
    service.findAll.mockResolvedValue([]);
    const result = await resolver.findAll();
    expect(result).toHaveLength(0);
  });

  it('createUser crea nuevo usuario', async () => {
    const input: CreateUserInput = { email: 'new@example.com', fullName: 'New', password: 'pass', roles: ['student'], isActive: true } as any;
    const result = await resolver.createUser(input);
    expect(service.createUser).toHaveBeenCalledWith(input);
    expect(result).toBe(mockUser);
  });

  it('findAll retorna lista de usuarios', async () => {
    const result = await resolver.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('findOne retorna usuario específico', async () => {
    const result = await resolver.findOne('u-1');
    expect(service.findOneById).toHaveBeenCalledWith('u-1');
    expect(result).toBe(mockUser);
  });

  it('updateUser actualiza usuario', async () => {
    const input: UpdateUserInput = { fullName: 'Updated' } as any;
    const result = await resolver.updateUser('u-1', input);
    expect(service.update).toHaveBeenCalledWith('u-1', input);
    expect(result.fullName).toBe('Updated Name');
  });

  it('removeUser elimina usuario', async () => {
    const result = await resolver.removeUser('u-1');
    expect(service.remove).toHaveBeenCalledWith('u-1');
    expect(result).toBe(mockUser);
  });
});
