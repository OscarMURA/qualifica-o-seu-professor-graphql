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
});
