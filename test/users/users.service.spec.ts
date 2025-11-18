import 'reflect-metadata';
import { UsersService } from '../../src/users/users.service';
import { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { SignupInput } from '../../src/auth/dto/signup.input';
import { CreateUserInput } from '../../src/users/dto/create-user.input';
import { UpdateUserInput } from '../../src/users/dto/update-user.input';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: overrides.id || 'u-1',
  email: overrides.email || 'user@example.com',
  fullName: overrides.fullName || 'User Example',
  password: overrides.password || bcrypt.hashSync('secret', 10),
  isActive: overrides.isActive ?? true,
  roles: overrides.roles || ['student'],
  createdAt: overrides.createdAt || new Date(),
  updatedAt: overrides.updatedAt || new Date(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;
  let preloadSpy: jest.Mock;

  beforeEach(() => {
    preloadSpy = jest.fn();
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      preload: preloadSpy,
      remove: jest.fn(),
    } as any;

    service = new UsersService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create (signupInput)', () => {
    it('crea usuario y encripta password', async () => {
      const input: SignupInput = { email: 'New@Example.com', fullName: 'New User', password: 'plain' } as any;
      const created = buildUser({ id: 'u-2', email: input.email.toLowerCase(), fullName: input.fullName });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);
      const result = await service.create(input);
      expect(repo.create).toHaveBeenCalled();
      expect(result.email).toBe('new@example.com');
      expect(result.password).not.toBe('plain');
    });
  });

  describe('createUser (CreateUserInput)', () => {
    it('crea usuario con roles y password encriptado', async () => {
      const input: CreateUserInput = { email: 'admin@example.com', fullName: 'Admin', password: '123', roles: ['admin'], isActive: true } as any;
      const created = buildUser({ id: 'u-3', email: input.email.toLowerCase(), fullName: input.fullName, roles: input.roles });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);
      const result = await service.createUser(input);
      expect(result.roles).toContain('admin');
      expect(result.password).not.toBe('123');
    });
  });

  describe('findAll', () => {
    it('retorna listado de usuarios', async () => {
      const list = [buildUser(), buildUser({ id: 'u-2', email: 'other@example.com' })];
      repo.find.mockResolvedValue(list as any);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOneById', () => {
    it('retorna usuario si existe', async () => {
      const user = buildUser();
      repo.findOneByOrFail.mockResolvedValue(user as any);
      const result = await service.findOneById(user.id);
      expect(result.id).toBe(user.id);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOneByOrFail.mockRejectedValue(new Error('not found'));
      await expect(service.findOneById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOneByEmail', () => {
    it('retorna usuario cuando existe', async () => {
      const user = buildUser();
      repo.findOne.mockResolvedValue(user as any);
      const result = await service.findOneByEmail(user.email);
      expect(result.email).toBe(user.email);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockRejectedValue(new Error('missing'));
      await expect(service.findOneByEmail('no@ex.com')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza usuario sin cambiar password si no se provee', async () => {
      const existing = buildUser();
      preloadSpy.mockResolvedValue(existing as any);
      repo.save.mockResolvedValue({ ...existing, fullName: 'Updated Name' });
      const result = await service.update(existing.id, { fullName: 'Updated Name' } as UpdateUserInput);
      expect(result.fullName).toBe('Updated Name');
    });

    it('actualiza usuario y encripta nuevo password', async () => {
      const existing = buildUser();
      preloadSpy.mockResolvedValue(existing as any);
      repo.save.mockResolvedValue({ ...existing, password: bcrypt.hashSync('newpass', 10) });
      const result = await service.update(existing.id, { password: 'newpass' } as UpdateUserInput);
      expect(result.password).not.toBe('newpass');
    });

    it('lanza NotFound si preload retorna null', async () => {
      preloadSpy.mockResolvedValue(null);
      await expect(service.update('bad-id', { fullName: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('elimina usuario y retorna copia', async () => {
      const existing = buildUser();
      repo.findOneByOrFail.mockResolvedValue(existing as any);
      repo.remove.mockResolvedValue(existing as any);
      const result = await service.remove(existing.id);
      expect(result.id).toBe(existing.id);
      expect(repo.remove).toHaveBeenCalled();
    });
  });

  describe('handleExceptions', () => {
    it('lanza BadRequest para código 23505', () => {
      // @ts-ignore - probamos método privado vía any
      expect(() => (service as any).handleExceptions({ code: '23505', detail: 'key duplicated' }))
        .toThrow(BadRequestException);
    });

    it('lanza BadRequest para código error-001', () => {
      // @ts-ignore
      expect(() => (service as any).handleExceptions({ code: 'error-001', detail: 'key custom error' }))
        .toThrow(BadRequestException);
    });

    it('lanza InternalServerError por código desconocido', () => {
      // @ts-ignore
      expect(() => (service as any).handleExceptions({ code: 'XXXX', detail: 'unknown' }))
        .toThrow(InternalServerErrorException);
    });
  });
});
