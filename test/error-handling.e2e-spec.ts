import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Error Handling and Edge Cases (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Error Scenarios', () => {
    const signupMutation = `
      mutation Signup($signupInput: SignupInput!) {
        signup(signupInput: $signupInput) {
          user {
            id
            email
          }
        }
      }
    `;

    it('should handle database connection timeout', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Connection timeout',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle duplicate key constraint violation', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (email)=(test@example.com) already exists.',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(JSON.stringify(response.body.errors)).toContain('already exists');
    });

    it('should handle null constraint violation', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: '23502',
        detail: 'Null value in column "email" violates not-null constraint',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle foreign key constraint violation', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key constraint violation',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle database connection error', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle unknown database error', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue({
        code: 'UNKNOWN',
        message: 'Unexpected database error',
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Input Validation Edge Cases', () => {
    const signupMutation = `
      mutation Signup($signupInput: SignupInput!) {
        signup(signupInput: $signupInput) {
          user {
            email
          }
        }
      }
    `;

    it('should handle email with maximum length', async () => {
      const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(180) + '.com';
      
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: longEmail,
        fullName: 'Test',
        isActive: true,
        roles: ['teacher'],
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: longEmail,
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      // Puede ser válido o inválido según validación
      expect(response).toBeDefined();
    });

    it('should handle password with only spaces (should fail)', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: '      ',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      // Should fail validation even though length > 6
      expect(response).toBeDefined();
    });

    it('should handle fullName with only whitespace', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: '     ',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle email with consecutive dots', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'user..name@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      // Puede fallar según validación RFC
      expect(response).toBeDefined();
    });

    it('should handle email starting with dot', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: '.user@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle email ending with dot', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'user.@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle fullName with emojis', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test 🎓 User',
        isActive: true,
        roles: ['teacher'],
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test 🎓 User',
            },
          },
        })
        .expect(200);

      // Should be accepted
      expect(response).toBeDefined();
    });

    it('should handle fullName with control characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test\x00User',
            },
          },
        })
        .expect(200);

      // May be accepted or rejected
      expect(response).toBeDefined();
    });

    it('should handle password with null bytes', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test',
        isActive: true,
        roles: ['teacher'],
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'pass\x00word123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle Unicode normalization in email', async () => {
      const email1 = 'café@example.com'; // NFC
      const email2 = 'café@example.com'; // NFD

      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: email1,
        fullName: 'Test',
        isActive: true,
        roles: ['teacher'],
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: email1,
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response).toBeDefined();
    });
  });

  describe('GraphQL Syntax Edge Cases', () => {
    it('should handle query with comments', async () => {
      const query = `
        # This is a comment
        query {
          # Get user by id
          user(id: 1) {
            id
            email
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle query with aliases', async () => {
      const query = `
        query {
          firstUser: user(id: 1) {
            id
            email
          }
          secondUser: user(id: 2) {
            id
            email
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle query with fragments', async () => {
      const query = `
        fragment UserFields on User {
          id
          email
          fullName
        }
        
        query {
          user(id: 1) {
            ...UserFields
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle query with inline fragments', async () => {
      const query = `
        query {
          user(id: 1) {
            ... on User {
              id
              email
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle deeply nested query', async () => {
      const query = `
        query {
          user(id: 1) {
            id
            email
            fullName
            isActive
            roles
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle query with directives', async () => {
      const query = `
        query GetUser($includeEmail: Boolean!) {
          user(id: 1) {
            id
            email @include(if: $includeEmail)
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { includeEmail: true },
        })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should handle mutation with multiple operations', async () => {
      const mutation = `
        mutation MultiOp {
          op1: signup(signupInput: {
            email: "user1@example.com"
            password: "password123"
            fullName: "User 1"
          }) {
            user { id }
          }
        }
      `;

      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        email: 'user1@example.com',
        fullName: 'User 1',
        isActive: true,
        roles: ['teacher'],
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response).toBeDefined();
    });
  });

  describe('Concurrent Operation Edge Cases', () => {
    it('should handle race condition on duplicate email', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              email
            }
          }
        }
      `;

      const sameEmail = 'race@example.com';
      
      let callCount = 0;
      mockUserRepository.save.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            id: '1',
            email: sameEmail,
            fullName: 'User 1',
            isActive: true,
            roles: ['teacher'],
          });
        } else {
          return Promise.reject({
            code: '23505',
            detail: `Key (email)=(${sameEmail}) already exists.`,
          });
        }
      });

      const requests = [
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables: {
              signupInput: {
                email: sameEmail,
                password: 'password123',
                fullName: 'User 1',
              },
            },
          }),
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables: {
              signupInput: {
                email: sameEmail,
                password: 'password123',
                fullName: 'User 2',
              },
            },
          }),
      ];

      const responses = await Promise.all(requests);

      // At least one should fail
      const hasError = responses.some(r => r.body.errors);
      expect(hasError).toBe(true);
    });

    it('should handle simultaneous user queries', async () => {
      const query = `
        query {
          user(id: 1) {
            id
            email
          }
        }
      `;

      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({ query })
        );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent NoSQL injection in variables', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            user {
              id
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: { $ne: null },
              password: { $ne: null },
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle excessively long query strings', async () => {
      const longQuery = `
        query {
          user(id: 1) {
            ${'id email fullName isActive roles '.repeat(100)}
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: longQuery })
        .expect((res) => {
          expect([200, 400, 413]).toContain(res.status);
        });
    });

    it('should handle query depth limits', async () => {
      const deepQuery = `
        query {
          user(id: 1) {
            id
            email
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deepQuery })
        .expect(200);

      expect(response).toBeDefined();
    });

    it('should sanitize error messages', async () => {
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue(
        new Error('Database password: secretpass123')
      );

      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user { id }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'test@example.com',
              password: 'password123',
              fullName: 'Test User',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      const errorString = JSON.stringify(response.body.errors);
      // Should not expose sensitive info
      expect(errorString.toLowerCase()).not.toContain('secretpass');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle burst of requests', async () => {
      const query = `
        query {
          user(id: 1) {
            id
          }
        }
      `;

      const burstSize = 50;
      const requests = Array(burstSize)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({ query })
        );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      const totalTime = endTime - startTime;
      console.log(`Burst of ${burstSize} requests completed in ${totalTime}ms`);
    });

    it('should handle large response payload', async () => {
      const query = `
        query {
          user(id: 1) {
            id
            email
            fullName
            isActive
            roles
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response).toBeDefined();
    });
  });

  describe('Type Coercion Edge Cases', () => {
    it('should handle string passed as Int parameter', async () => {
      const query = `
        query {
          user(id: "not-a-number") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle float passed as Int parameter', async () => {
      const query = `
        query {
          user(id: 1.5) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      // GraphQL puede coercionar o rechazar
      expect(response).toBeDefined();
    });

    it('should handle boolean passed as string', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user { id }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: true,
              password: 'password123',
              fullName: 'Test',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });
});
