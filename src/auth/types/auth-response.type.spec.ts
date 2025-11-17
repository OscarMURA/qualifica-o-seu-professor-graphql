import { AuthReponse } from './auth-response.type';
import { User } from '../../users/entities/user.entity';

describe('AuthResponse Type', () => {
  let authResponse: AuthReponse;
  let mockUser: User;

  beforeEach(() => {
    authResponse = new AuthReponse();
    mockUser = new User();
    mockUser.id = '123e4567-e89b-12d3-a456-426614174000';
    mockUser.email = 'test@example.com';
    mockUser.fullName = 'Test User';
  });

  describe('instantiation', () => {
    it('should create an instance', () => {
      expect(authResponse).toBeInstanceOf(AuthReponse);
    });

    it('should be defined', () => {
      expect(authResponse).toBeDefined();
    });

    it('should have user property', () => {
      authResponse.user = mockUser;
      expect(authResponse.user).toBeDefined();
    });

    it('should have token property', () => {
      authResponse.token = 'test-token';
      expect(authResponse.token).toBeDefined();
    });
  });

  describe('user property', () => {
    it('should accept User instance', () => {
      authResponse.user = mockUser;
      expect(authResponse.user).toBeInstanceOf(User);
    });

    it('should store user data', () => {
      authResponse.user = mockUser;
      expect(authResponse.user.email).toBe('test@example.com');
      expect(authResponse.user.fullName).toBe('Test User');
    });

    it('should allow user reassignment', () => {
      const user1 = mockUser;
      const user2 = new User();
      user2.email = 'another@example.com';

      authResponse.user = user1;
      expect(authResponse.user.email).toBe('test@example.com');

      authResponse.user = user2;
      expect(authResponse.user.email).toBe('another@example.com');
    });
  });

  describe('token property', () => {
    it('should accept string token', () => {
      authResponse.token = 'jwt-token-12345';
      expect(authResponse.token).toBe('jwt-token-12345');
    });

    it('should store different token formats', () => {
      const tokens = [
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'simple-token',
        'token-with-dashes-123',
        '1234567890',
      ];

      tokens.forEach((token) => {
        authResponse.token = token;
        expect(authResponse.token).toBe(token);
      });
    });

    it('should allow token updates', () => {
      authResponse.token = 'old-token';
      expect(authResponse.token).toBe('old-token');

      authResponse.token = 'new-token';
      expect(authResponse.token).toBe('new-token');
    });
  });

  describe('complete response', () => {
    it('should have both user and token', () => {
      authResponse.user = mockUser;
      authResponse.token = 'test-token';

      expect(authResponse.user).toBeDefined();
      expect(authResponse.token).toBeDefined();
    });

    it('should create valid auth response', () => {
      authResponse.user = mockUser;
      authResponse.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      expect(authResponse.user).toBeInstanceOf(User);
      expect(typeof authResponse.token).toBe('string');
      expect(authResponse.token.length).toBeGreaterThan(0);
    });
  });

  describe('GraphQL ObjectType', () => {
    it('should be a class', () => {
      expect(AuthReponse).toBeDefined();
      expect(typeof AuthReponse).toBe('function');
    });

    it('should be constructable', () => {
      const instance = new AuthReponse();
      expect(instance).toBeInstanceOf(AuthReponse);
    });

    it('should have correct constructor name', () => {
      expect(authResponse.constructor.name).toBe('AuthReponse');
    });
  });

  describe('field types', () => {
    it('should return User type for user field', () => {
      authResponse.user = mockUser;
      expect(authResponse.user).toBeInstanceOf(User);
    });

    it('should return string type for token field', () => {
      authResponse.token = 'test-token';
      expect(typeof authResponse.token).toBe('string');
    });
  });

  describe('multiple instances', () => {
    it('should create independent instances', () => {
      const response1 = new AuthReponse();
      const response2 = new AuthReponse();

      response1.token = 'token-1';
      response2.token = 'token-2';

      expect(response1.token).toBe('token-1');
      expect(response2.token).toBe('token-2');
      expect(response1).not.toBe(response2);
    });

    it('should not share state between instances', () => {
      const response1 = new AuthReponse();
      const response2 = new AuthReponse();

      response1.user = mockUser;
      response1.token = 'token-1';

      expect(response2.user).toBeUndefined();
      expect(response2.token).toBeUndefined();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      authResponse.user = mockUser;
      authResponse.token = 'test-token';

      const json = JSON.stringify(authResponse);
      expect(json).toContain('test-token');
    });

    it('should include user data in serialization', () => {
      authResponse.user = mockUser;
      authResponse.token = 'test-token';

      const parsed = JSON.parse(JSON.stringify(authResponse));
      expect(parsed.token).toBe('test-token');
      expect(parsed.user).toBeDefined();
    });
  });

  describe('property assignment', () => {
    it('should allow direct property assignment', () => {
      const response = new AuthReponse();
      response.user = mockUser;
      response.token = 'direct-token';

      expect(response.user).toBe(mockUser);
      expect(response.token).toBe('direct-token');
    });

    it('should handle null/undefined gracefully', () => {
      const response = new AuthReponse();
      response.user = null as any;
      response.token = null as any;

      expect(response.user).toBeNull();
      expect(response.token).toBeNull();
    });
  });

  describe('type safety', () => {
    it('should enforce User type for user property', () => {
      authResponse.user = mockUser;
      expect(authResponse.user).toBeInstanceOf(User);
    });

    it('should accept string for token property', () => {
      authResponse.token = 'string-token';
      expect(typeof authResponse.token).toBe('string');
    });
  });

  describe('real-world scenarios', () => {
    it('should represent successful login response', () => {
      const user = new User();
      user.id = '550e8400-e29b-41d4-a716-446655440000';
      user.email = 'john@example.com';
      user.fullName = 'John Doe';

      const response = new AuthReponse();
      response.user = user;
      response.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';

      expect(response.user.email).toBe('john@example.com');
      expect(response.token).toContain('eyJ');
    });

    it('should represent signup response', () => {
      const newUser = new User();
      newUser.email = 'newuser@example.com';
      newUser.fullName = 'New User';
      newUser.isActive = true;

      const response = new AuthReponse();
      response.user = newUser;
      response.token = 'new-user-jwt-token';

      expect(response.user.isActive).toBe(true);
      expect(response.token).toBe('new-user-jwt-token');
    });
  });
});
