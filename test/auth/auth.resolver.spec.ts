import 'reflect-metadata';
import { AuthResolver } from '../../src/auth/auth.resolver';
import { AuthService } from '../../src/auth/auth.service';
import { SignupInput } from '../../src/auth/dto/signup.input';
import { LoginInput } from '../../src/auth/dto/login.input';

const mockUser = {
  id: 'u-1',
  email: 'mock@example.com',
  fullName: 'Mock User',
  isActive: true,
  roles: ['student'],
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn()
    } as any;
    resolver = new AuthResolver(authService);
  });

  it('signup debe delegar correctamente en AuthService', async () => {
    const input: SignupInput = { email: 'new@example.com', fullName: 'New', password: 'abc123' };
    const expected = { user: { ...mockUser, email: input.email }, token: 'jwt-token' };
    authService.signup.mockResolvedValue(expected as any);
    const result = await resolver.signup(input);
    expect(authService.signup).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it('login debe delegar correctamente en AuthService', async () => {
    const input: LoginInput = { email: mockUser.email, password: 'pass' };
    const expected = { user: mockUser as any, token: 'jwt-login' };
    authService.login.mockResolvedValue(expected as any);
    const result = await resolver.login(input);
    expect(authService.login).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it('me debe devolver el usuario inyectado por el decorador', () => {
    const result = resolver.me(mockUser as any);
    expect(result).toBe(mockUser);
  });

  it('signup con email duplicado arroja error', async () => {
    const input: SignupInput = { email: 'dup@example.com', fullName: 'Dup', password: 'pass' };
    authService.signup.mockRejectedValue(new Error('Email already exists'));
    await expect(resolver.signup(input)).rejects.toThrow('Email already exists');
  });

  it('login con credenciales incorrectas arroja error', async () => {
    const input: LoginInput = { email: 'wrong@example.com', password: 'wrong' };
    authService.login.mockRejectedValue(new Error('Invalid credentials'));
    await expect(resolver.login(input)).rejects.toThrow('Invalid credentials');
  });

  it('me retorna usuario con roles correctos', () => {
    const adminUser = { ...mockUser, roles: ['admin'] };
    const result = resolver.me(adminUser as any);
    expect(result.roles).toContain('admin');
  });
});
