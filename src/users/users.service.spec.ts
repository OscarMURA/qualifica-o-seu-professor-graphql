import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SignupInput } from '../auth/dto/signup.input';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedPassword123',
    isActive: true,
    roles: ['teacher'],
    checkFieldsBeforeChanges: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Clear all mocks before each test
    jest.clearAllMocks();
    mockedBcrypt.hashSync.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const signupInput: SignupInput = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hashSync.mockReturnValue(hashedPassword as never);
      
      mockRepository.create.mockReturnValue({
        ...mockUser,
        email: signupInput.email,
        fullName: signupInput.fullName,
        password: hashedPassword,
      });
      
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        email: signupInput.email,
        fullName: signupInput.fullName,
        password: hashedPassword,
      });

      const result = await service.create(signupInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith(signupInput.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...signupInput,
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(signupInput.email);
      expect(result.password).toBe(hashedPassword);
    });

    it('should hash password with bcrypt before saving', async () => {
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hashSync.mockReturnValue(hashedPassword as never);
      
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(signupInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith(signupInput.password, 10);
      expect(mockedBcrypt.hashSync).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when email already exists (code 23505)', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key (email)=(test@example.com) already exists.',
      };
      
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue(dbError);

      await expect(service.create(signupInput)).rejects.toThrow(BadRequestException);
      await expect(service.create(signupInput)).rejects.toThrow(
        '(email)=(test@example.com) already exists.'
      );
    });

    it('should throw BadRequestException for custom error-001 code', async () => {
      const dbError = {
        code: 'error-001',
        detail: 'Key (field)=(value) validation failed.',
      };
      
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue(dbError);

      await expect(service.create(signupInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for unknown database errors', async () => {
      const dbError = {
        code: 'UNKNOWN_ERROR',
        message: 'Database connection failed',
      };
      
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue(dbError);

      await expect(service.create(signupInput)).rejects.toThrow(InternalServerErrorException);
      await expect(service.create(signupInput)).rejects.toThrow('Please check server logs');
    });

    it('should handle empty password gracefully', async () => {
      const invalidInput = { ...signupInput, password: '' };
      const hashedPassword = 'hashedEmptyPassword';
      
      mockedBcrypt.hashSync.mockReturnValue(hashedPassword as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(invalidInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith('', 10);
    });

    it('should create user with default roles as teacher', async () => {
      mockedBcrypt.hashSync.mockReturnValue('hashedPassword' as never);
      
      const newUser = {
        ...mockUser,
        roles: ['teacher'],
      };
      
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(signupInput);

      expect(result.roles).toEqual(['teacher']);
    });

    it('should create user with isActive set to true by default', async () => {
      mockedBcrypt.hashSync.mockReturnValue('hashedPassword' as never);
      
      const newUser = {
        ...mockUser,
        isActive: true,
      };
      
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(signupInput);

      expect(result.isActive).toBe(true);
    });

    it('should handle special characters in email', async () => {
      const specialEmailInput = {
        ...signupInput,
        email: 'test+special@example.co.uk',
      };
      
      mockedBcrypt.hashSync.mockReturnValue('hashedPassword' as never);
      mockRepository.create.mockReturnValue({ ...mockUser, email: specialEmailInput.email });
      mockRepository.save.mockResolvedValue({ ...mockUser, email: specialEmailInput.email });

      const result = await service.create(specialEmailInput);

      expect(result.email).toBe(specialEmailInput.email);
    });

    it('should handle special characters in fullName', async () => {
      const specialNameInput = {
        ...signupInput,
        fullName: 'José María Pérez-O\'Connor',
      };
      
      mockedBcrypt.hashSync.mockReturnValue('hashedPassword' as never);
      mockRepository.create.mockReturnValue({ ...mockUser, fullName: specialNameInput.fullName });
      mockRepository.save.mockResolvedValue({ ...mockUser, fullName: specialNameInput.fullName });

      const result = await service.create(specialNameInput);

      expect(result.fullName).toBe(specialNameInput.fullName);
    });

    it('should handle long passwords', async () => {
      const longPasswordInput = {
        ...signupInput,
        password: 'a'.repeat(1000),
      };
      
      mockedBcrypt.hashSync.mockReturnValue('hashedLongPassword' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(longPasswordInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith(longPasswordInput.password, 10);
    });
  });

  describe('findOneById', () => {
    it('should return a user when valid id is provided', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockUser);

      const result = await service.findOneById(mockUser.id);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledWith({ id: mockUser.id });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      const invalidId = 'invalid-uuid-123';
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneById(invalidId)).rejects.toThrow(NotFoundException);
      await expect(service.findOneById(invalidId)).rejects.toThrow(`User ${invalidId} not found`);
    });

    it('should handle UUID v4 format correctly', async () => {
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, id: uuidV4 });

      const result = await service.findOneById(uuidV4);

      expect(result.id).toBe(uuidV4);
    });

    it('should throw NotFoundException for empty string id', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneById('')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for null id', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneById(null as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for undefined id', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneById(undefined as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle malformed UUID gracefully', async () => {
      const malformedUuid = 'not-a-valid-uuid';
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Invalid UUID'));

      await expect(service.findOneById(malformedUuid)).rejects.toThrow(NotFoundException);
    });

    it('should return user with all properties intact', async () => {
      const completeUser = {
        ...mockUser,
        email: 'complete@test.com',
        fullName: 'Complete User',
        isActive: true,
        roles: ['teacher', 'admin'],
      };
      
      mockRepository.findOneByOrFail.mockResolvedValue(completeUser);

      const result = await service.findOneById(completeUser.id);

      expect(result.email).toBe(completeUser.email);
      expect(result.fullName).toBe(completeUser.fullName);
      expect(result.isActive).toBe(completeUser.isActive);
      expect(result.roles).toEqual(completeUser.roles);
    });

    it('should call repository findOneByOrFail exactly once', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockUser);

      await service.findOneById(mockUser.id);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection errors', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(
        new Error('Database connection lost')
      );

      await expect(service.findOneById(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user when valid email is provided', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(mockUser.email);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when email does not exist', async () => {
      const invalidEmail = 'nonexistent@example.com';
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneByEmail(invalidEmail)).rejects.toThrow(NotFoundException);
      await expect(service.findOneByEmail(invalidEmail)).rejects.toThrow(
        `User ${invalidEmail} not found`
      );
    });

    it('should handle case-sensitive email search', async () => {
      const emailUpperCase = 'TEST@EXAMPLE.COM';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: emailUpperCase });

      const result = await service.findOneByEmail(emailUpperCase);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledWith({ email: emailUpperCase });
      expect(result.email).toBe(emailUpperCase);
    });

    it('should handle email with special characters', async () => {
      const specialEmail = 'user+test@example.co.uk';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: specialEmail });

      const result = await service.findOneByEmail(specialEmail);

      expect(result.email).toBe(specialEmail);
    });

    it('should throw NotFoundException for empty email', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneByEmail('')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for null email', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneByEmail(null as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for undefined email', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneByEmail(undefined as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle email with whitespace', async () => {
      const emailWithSpaces = ' test@example.com ';
      mockRepository.findOneByOrFail.mockResolvedValue(mockUser);

      await service.findOneByEmail(emailWithSpaces);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledWith({ email: emailWithSpaces });
    });

    it('should return user with password field', async () => {
      const userWithPassword = { ...mockUser, password: 'hashedPassword123' };
      mockRepository.findOneByOrFail.mockResolvedValue(userWithPassword);

      const result = await service.findOneByEmail(mockUser.email);

      expect(result.password).toBe('hashedPassword123');
    });

    it('should call repository findOneByOrFail exactly once', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockUser);

      await service.findOneByEmail(mockUser.email);

      expect(mockRepository.findOneByOrFail).toHaveBeenCalledTimes(1);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: longEmail });

      const result = await service.findOneByEmail(longEmail);

      expect(result.email).toBe(longEmail);
    });

    it('should handle email with subdomain', async () => {
      const subdomainEmail = 'user@mail.example.com';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: subdomainEmail });

      const result = await service.findOneByEmail(subdomainEmail);

      expect(result.email).toBe(subdomainEmail);
    });

    it('should handle international domain names', async () => {
      const internationalEmail = 'user@example.co.jp';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: internationalEmail });

      const result = await service.findOneByEmail(internationalEmail);

      expect(result.email).toBe(internationalEmail);
    });

    it('should handle email with numbers', async () => {
      const numericEmail = 'user123@example456.com';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: numericEmail });

      const result = await service.findOneByEmail(numericEmail);

      expect(result.email).toBe(numericEmail);
    });

    it('should handle email with hyphens', async () => {
      const hyphenEmail = 'user-name@example-domain.com';
      mockRepository.findOneByOrFail.mockResolvedValue({ ...mockUser, email: hyphenEmail });

      const result = await service.findOneByEmail(hyphenEmail);

      expect(result.email).toBe(hyphenEmail);
    });
  });

  describe('error handling', () => {
    it('should handle network timeout errors', async () => {
      const signupInput: SignupInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue({ code: 'ETIMEDOUT', message: 'Connection timeout' });

      await expect(service.create(signupInput)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle constraint violation errors', async () => {
      const signupInput: SignupInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (email)=(test@example.com) already exists.',
      });

      await expect(service.create(signupInput)).rejects.toThrow(BadRequestException);
    });

    it('should handle null constraint violations', async () => {
      const signupInput: SignupInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue({
        code: '23502',
        detail: 'Null value in column "fullName" violates not-null constraint',
      });

      await expect(service.create(signupInput)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle foreign key constraint violations', async () => {
      const signupInput: SignupInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key constraint violation',
      });

      await expect(service.create(signupInput)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent user creation attempts', async () => {
      const signupInput: SignupInput = {
        email: 'concurrent@example.com',
        password: 'password123',
        fullName: 'Concurrent User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, email: signupInput.email });

      const promises = [
        service.create(signupInput),
        service.create(signupInput),
        service.create(signupInput),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should handle user lookup with inactive users', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockRepository.findOneByOrFail.mockResolvedValue(inactiveUser);

      const result = await service.findOneById(mockUser.id);

      expect(result.isActive).toBe(false);
    });

    it('should handle users with multiple roles', async () => {
      const multiRoleUser = { ...mockUser, roles: ['teacher', 'admin', 'moderator'] };
      mockRepository.findOneByOrFail.mockResolvedValue(multiRoleUser);

      const result = await service.findOneById(mockUser.id);

      expect(result.roles).toHaveLength(3);
      expect(result.roles).toContain('teacher');
      expect(result.roles).toContain('admin');
      expect(result.roles).toContain('moderator');
    });

    it('should handle users with empty roles array', async () => {
      const noRoleUser = { ...mockUser, roles: [] };
      mockRepository.findOneByOrFail.mockResolvedValue(noRoleUser);

      const result = await service.findOneById(mockUser.id);

      expect(result.roles).toEqual([]);
    });

    it('should handle very short passwords', async () => {
      const shortPasswordInput: SignupInput = {
        email: 'test@example.com',
        password: 'a',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashedA' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(shortPasswordInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith('a', 10);
    });

    it('should handle passwords with special characters', async () => {
      const specialPasswordInput: SignupInput = {
        email: 'test@example.com',
        password: 'P@$$w0rd!#%&*()_+-=[]{}|;:,.<>?',
        fullName: 'Test User',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashedSpecial' as never);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(specialPasswordInput);

      expect(mockedBcrypt.hashSync).toHaveBeenCalledWith(specialPasswordInput.password, 10);
    });

    it('should handle Unicode characters in fullName', async () => {
      const unicodeNameInput: SignupInput = {
        email: 'test@example.com',
        password: 'password123',
        fullName: '李明 🎓 Müller',
      };

      mockedBcrypt.hashSync.mockReturnValue('hashed' as never);
      mockRepository.create.mockReturnValue({ ...mockUser, fullName: unicodeNameInput.fullName });
      mockRepository.save.mockResolvedValue({ ...mockUser, fullName: unicodeNameInput.fullName });

      const result = await service.create(unicodeNameInput);

      expect(result.fullName).toBe(unicodeNameInput.fullName);
    });
  });
});

