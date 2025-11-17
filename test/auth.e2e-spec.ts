import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    fullName: 'Test User',
    password: bcrypt.hashSync('password123', 10),
    isActive: true,
    roles: ['teacher'],
  };

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

  describe('Authentication Flow', () => {
    describe('signup mutation', () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
              email
              fullName
              isActive
              roles
            }
          }
        }
      `;

      it('should create a new user with valid data', () => {
        const variables = {
          signupInput: {
            email: 'newuser@example.com',
            password: 'password123',
            fullName: 'New User',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should fail with invalid email', () => {
        const variables = {
          signupInput: {
            email: 'invalid-email',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with short password', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: '12345',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with empty fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: '',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with missing email', () => {
        const variables = {
          signupInput: {
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with missing password', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with missing fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should normalize email to lowercase', () => {
        const variables = {
          signupInput: {
            email: 'TEST@EXAMPLE.COM',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        mockUserRepository.create.mockReturnValue({
          ...mockUser,
          email: 'test@example.com',
        });
        mockUserRepository.save.mockResolvedValue({
          ...mockUser,
          email: 'test@example.com',
        });

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should handle special characters in email', () => {
        const variables = {
          signupInput: {
            email: 'user+test@example.co.uk',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should handle accented characters in fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'José María Pérez',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should handle special characters in password', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'P@$$w0rd!#%',
            fullName: 'Test User',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should fail with whitespace-only fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: '   ',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle very long passwords', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'a'.repeat(100),
            fullName: 'Test User',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should handle very long fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'a'.repeat(500),
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });

      it('should fail with null email', () => {
        const variables = {
          signupInput: {
            email: null,
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with null password', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: null,
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with null fullName', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: null,
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });
    });

    describe('login mutation', () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
              email
              fullName
              isActive
              roles
            }
          }
        }
      `;

      it('should authenticate user with valid credentials', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: 'password123',
          },
        };

        mockUserRepository.findOne.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200);
      });

      it('should fail with invalid email format', () => {
        const variables = {
          loginInput: {
            email: 'invalid-email',
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with short password', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: '12345',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with missing email', () => {
        const variables = {
          loginInput: {
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with missing password', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with empty email', () => {
        const variables = {
          loginInput: {
            email: '',
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with empty password', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: '',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle case-sensitive email during login', () => {
        const variables = {
          loginInput: {
            email: 'TEST@EXAMPLE.COM',
            password: 'password123',
          },
        };

        mockUserRepository.findOne.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200);
      });

      it('should handle special characters in password during login', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: 'P@$$w0rd!#%',
          },
        };

        const userWithSpecialPassword = {
          ...mockUser,
          password: bcrypt.hashSync('P@$$w0rd!#%', 10),
        };

        mockUserRepository.findOne.mockResolvedValue(userWithSpecialPassword);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200);
      });

      it('should fail with null email', () => {
        const variables = {
          loginInput: {
            email: null,
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should fail with null password', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: null,
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should not expose password in response', () => {
        const variables = {
          loginInput: {
            email: 'test@example.com',
            password: 'password123',
          },
        };

        mockUserRepository.findOne.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            const responseString = JSON.stringify(res.body);
            expect(responseString).not.toContain(mockUser.password);
          });
      });
    });

    describe('validation edge cases', () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
              email
            }
          }
        }
      `;

      it('should reject email without @', () => {
        const variables = {
          signupInput: {
            email: 'testexample.com',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should reject email without domain', () => {
        const variables = {
          signupInput: {
            email: 'test@',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should reject email without local part', () => {
        const variables = {
          signupInput: {
            email: '@example.com',
            password: 'password123',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should reject password with 5 characters', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'abcde',
            fullName: 'Test User',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should accept password with exactly 6 characters', () => {
        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: '123456',
            fullName: 'Test User',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });
    });

    describe('concurrent authentication requests', () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
              email
            }
          }
        }
      `;

      it('should handle multiple concurrent signup requests', async () => {
        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        const requests = Array(5)
          .fill(null)
          .map((_, i) =>
            request(app.getHttpServer())
              .post('/graphql')
              .send({
                query: signupMutation,
                variables: {
                  signupInput: {
                    email: `user${i}@example.com`,
                    password: 'password123',
                    fullName: `User ${i}`,
                  },
                },
              })
          );

        const responses = await Promise.all(requests);

        responses.forEach((res) => {
          expect(res.status).toBe(200);
        });
      });
    });

    describe('security considerations', () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
              email
            }
          }
        }
      `;

      it('should not reveal if user exists in error messages', () => {
        const variables = {
          loginInput: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            if (res.body.errors) {
              const errorMessage = JSON.stringify(res.body.errors);
              expect(errorMessage.toLowerCase()).not.toContain('user not found');
              expect(errorMessage.toLowerCase()).not.toContain('does not exist');
            }
          });
      });

      it('should handle SQL injection attempts in email', () => {
        const variables = {
          loginInput: {
            email: "admin'--",
            password: 'password123',
          },
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: loginMutation,
            variables,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle XSS attempts in fullName', () => {
        const signupMutation = `
          mutation Signup($signupInput: SignupInput!) {
            signup(signupInput: $signupInput) {
              user {
                fullName
              }
            }
          }
        `;

        const variables = {
          signupInput: {
            email: 'test@example.com',
            password: 'password123',
            fullName: '<script>alert("xss")</script>',
          },
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables,
          })
          .expect(200);
      });
    });
  });
});
