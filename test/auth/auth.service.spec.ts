import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Utilidad para construir un usuario base
const buildUser = (overrides: Partial<any> = {}) => ({
  id: 'uuid-123',
  email: 'test@example.com',
  fullName: 'Test User',
  password: bcrypt.hashSync('password123', 10),
  isActive: true,
  roles: ['student'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneById: jest.fn(),
      // Métodos no usados en estas pruebas se mockean vacío
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    } as any;

    authService = new AuthService(usersService, jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('debe crear usuario y retornar token', async () => {
      const input = { email: 'New@Example.com', fullName: 'New User', password: 'abc123' };
      const createdUser = buildUser({ id: 'new-id', email: input.email.toLowerCase(), fullName: input.fullName });
      usersService.create.mockResolvedValue(createdUser as any);

      const result = await authService.signup(input as any);

      expect(usersService.create).toHaveBeenCalledWith(input);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: createdUser.id, email: createdUser.email });
      expect(result).toEqual({ user: createdUser, token: 'signed-jwt-token' });
    });
  });

  describe('login', () => {
    it('debe loguear y devolver token con credenciales válidas', async () => {
      const user = buildUser();
      usersService.findOneByEmail.mockResolvedValue(user as any);

      const result = await authService.login({ email: user.email, password: 'password123' } as any);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: user.id, email: user.email });
      expect(result.token).toBe('signed-jwt-token');
    });

    it('debe lanzar BadRequest si el usuario no existe', async () => {
      usersService.findOneByEmail.mockResolvedValue(null as any);
      await expect(
        authService.login({ email: 'missing@example.com', password: 'pass' } as any)
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('debe lanzar Unauthorized si el password no coincide', async () => {
      const user = buildUser({ password: bcrypt.hashSync('otro-pass', 10) });
      usersService.findOneByEmail.mockResolvedValue(user as any);

      await expect(
        authService.login({ email: user.email, password: 'password123' } as any)
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('retorna usuario sin password si existe y activo', async () => {
      const user = buildUser();
      usersService.findOneById = jest.fn().mockResolvedValue({ ...user });

      const result = await authService.validateUser(user.id);
      expect(usersService.findOneById).toHaveBeenCalledWith(user.id);
      expect(result).toMatchObject({ id: user.id, email: user.email });
      expect((result as any).password).toBeUndefined();
    });

    it('lanza BadRequest si no existe', async () => {
      usersService.findOneById = jest.fn().mockResolvedValue(null);
      await expect(authService.validateUser('no-id')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza Unauthorized si está inactivo', async () => {
      const user = buildUser({ isActive: false });
      usersService.findOneById = jest.fn().mockResolvedValue(user as any);
      await expect(authService.validateUser(user.id)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});

