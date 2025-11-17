import 'reflect-metadata';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { AuthService } from '../../src/auth/auth.service';

const mockUser = {
  id: 'abc-123',
  email: 'user@example.com',
  fullName: 'User Example',
  isActive: true,
  roles: ['student'],
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    authService = {
      validateUser: jest.fn()
    } as any;
    configService = { get: jest.fn().mockReturnValue('secret-key') };
    strategy = new JwtStrategy(authService, configService as any);
  });

  it('validate debe llamar a authService.validateUser y devolver usuario', async () => {
    authService.validateUser.mockResolvedValue(mockUser as any);
    const payload = { id: mockUser.id, email: mockUser.email };

    const result = await strategy.validate(payload as any);
    expect(authService.validateUser).toHaveBeenCalledWith(mockUser.id);
    expect(result).toBe(mockUser);
  });
});
