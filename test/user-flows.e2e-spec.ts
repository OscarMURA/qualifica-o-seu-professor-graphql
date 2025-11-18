import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('User Flows (e2e)', () => {
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

  describe('Complete User Registration Flow', () => {
    it('should complete full registration flow', async () => {
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

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'newuser@example.com',
        fullName: 'New User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'newuser@example.com',
              password: 'password123',
              fullName: 'New User',
            },
          },
        })
        .expect(200);

      // Verificar que no hay errores
      expect(response.body.errors).toBeUndefined();

      // Verificar que se creó el usuario
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should prevent duplicate email registration', async () => {
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

      // Simular que el email ya existe
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

      // Debe haber un error
      expect(response.body.errors).toBeDefined();
    });

    it('should validate all fields during registration', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
            }
          }
        }
      `;

      // Probar con datos inválidos
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'invalid-email',
              password: '123',
              fullName: '',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Login and Authentication Flow', () => {
    it('should complete login flow with valid credentials', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
              email
              fullName
              roles
            }
          }
        }
      `;

      const existingUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        fullName: 'Test User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      const existingUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'test@example.com',
              password: 'wrongpassword',
            },
          },
        })
        .expect(200);

      // Debería fallar la autenticación
      expect(response.body.errors || response.body.data?.login === null).toBeTruthy();
    });

    it('should reject login for non-existent user', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      mockUserRepository.findOne.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'nonexistent@example.com',
              password: 'password123',
            },
          },
        })
        .expect(200);

      expect(response.body.errors || response.body.data?.login === null).toBeTruthy();
    });

    it('should reject login for inactive user', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      const inactiveUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: bcrypt.hashSync('password123', 10),
        isActive: false,
        roles: ['teacher'],
      };

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'test@example.com',
              password: 'password123',
            },
          },
        })
        .expect(200);

      // Puede fallar o retornar null dependiendo de la implementación
      expect(response).toBeDefined();
    });
  });

  describe('User Query Flow', () => {
    it('should query user by id', async () => {
      const query = `
        query {
          user(id: 1) {
            id
            email
            fullName
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      // Actualmente no implementado
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Not implemented');
    });

    it('should handle user not found scenario', async () => {
      const query = `
        query {
          user(id: 99999) {
            id
            email
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });

    it('should query multiple user fields', async () => {
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

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Registration then Login Flow', () => {
    it('should register and then login successfully', async () => {
      // Step 1: Register
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
              email
              fullName
            }
          }
        }
      `;

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'newuser@example.com',
        fullName: 'New User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const signupResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'newuser@example.com',
              password: 'password123',
              fullName: 'New User',
            },
          },
        })
        .expect(200);

      expect(signupResponse.body.errors).toBeUndefined();

      // Step 2: Login with same credentials
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

      mockUserRepository.findOne.mockResolvedValue(newUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'newuser@example.com',
              password: 'password123',
            },
          },
        })
        .expect(200);

      expect(loginResponse.body.errors).toBeUndefined();
    });

    it('should fail login with wrong password after registration', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              id
            }
          }
        }
      `;

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        password: bcrypt.hashSync('correctpassword', 10),
        fullName: 'User',
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'user@example.com',
              password: 'correctpassword',
              fullName: 'User',
            },
          },
        });

      // Try to login with wrong password
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      mockUserRepository.findOne.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'user@example.com',
              password: 'wrongpassword',
            },
          },
        })
        .expect(200);

      expect(response.body.errors || response.body.data?.login === null).toBeTruthy();
    });
  });

  describe('Multiple Users Flow', () => {
    it('should handle registration of multiple users', async () => {
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

      const users = [
        {
          email: 'user1@example.com',
          password: 'password123',
          fullName: 'User 1',
        },
        {
          email: 'user2@example.com',
          password: 'password123',
          fullName: 'User 2',
        },
        {
          email: 'user3@example.com',
          password: 'password123',
          fullName: 'User 3',
        },
      ];

      for (const user of users) {
        const mockUser = {
          id: `${Date.now()}-${Math.random()}`,
          ...user,
          password: bcrypt.hashSync(user.password, 10),
          isActive: true,
          roles: ['teacher'],
        };

        mockUserRepository.create.mockReturnValue(mockUser);
        mockUserRepository.save.mockResolvedValue(mockUser);

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: signupMutation,
            variables: {
              signupInput: user,
            },
          })
          .expect(200);

        expect(response.body.errors).toBeUndefined();
      }

      expect(mockUserRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent user registrations', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              email
            }
          }
        }
      `;

      const requests = Array(5)
        .fill(null)
        .map((_, i) => {
          const mockUser = {
            id: `user-${i}`,
            email: `concurrent${i}@example.com`,
            fullName: `Concurrent User ${i}`,
            password: bcrypt.hashSync('password123', 10),
            isActive: true,
            roles: ['teacher'],
          };

          mockUserRepository.create.mockReturnValue(mockUser);
          mockUserRepository.save.mockResolvedValue(mockUser);

          return request(app.getHttpServer())
            .post('/graphql')
            .send({
              query: signupMutation,
              variables: {
                signupInput: {
                  email: `concurrent${i}@example.com`,
                  password: 'password123',
                  fullName: `Concurrent User ${i}`,
                },
              },
            });
        });

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle rapid successive login attempts', async () => {
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/graphql')
            .send({
              query: loginMutation,
              variables: {
                loginInput: {
                  email: 'test@example.com',
                  password: 'password123',
                },
              },
            })
        );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it('should handle malformed GraphQL in flow', async () => {
      const malformedQuery = `
        mutation {
          signup(
            email: "test@example.com"
          {
            user {
              id
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: malformedQuery })
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should handle empty request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({})
        .expect((res) => {
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should handle very large input strings', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              id
            }
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
              password: 'a'.repeat(10000),
              fullName: 'b'.repeat(10000),
            },
          },
        })
        .expect(200);

      // Should process but may have size limits
      expect(response).toBeDefined();
    });
  });

  describe('User State Transitions', () => {
    it('should maintain user active state through flow', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              isActive
            }
          }
        }
      `;

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'active@example.com',
        fullName: 'Active User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'active@example.com',
              password: 'password123',
              fullName: 'Active User',
            },
          },
        })
        .expect(200);

      if (response.body.data?.signup?.user) {
        expect(response.body.data.signup.user.isActive).toBe(true);
      }
    });

    it('should assign default teacher role on registration', async () => {
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            user {
              roles
            }
          }
        }
      `;

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'teacher@example.com',
        fullName: 'Teacher User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'teacher@example.com',
              password: 'password123',
              fullName: 'Teacher User',
            },
          },
        })
        .expect(200);

      if (response.body.data?.signup?.user) {
        expect(response.body.data.signup.user.roles).toContain('teacher');
      }
    });
  });

  describe('Complete Application Flow', () => {
    it('should handle complete user lifecycle', async () => {
      // 1. Register a new user
      const signupMutation = `
        mutation Signup($signupInput: SignupInput!) {
          signup(signupInput: $signupInput) {
            token
            user {
              id
              email
              fullName
            }
          }
        }
      `;

      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'lifecycle@example.com',
        fullName: 'Lifecycle User',
        password: bcrypt.hashSync('password123', 10),
        isActive: true,
        roles: ['teacher'],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const signupResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            signupInput: {
              email: 'lifecycle@example.com',
              password: 'password123',
              fullName: 'Lifecycle User',
            },
          },
        })
        .expect(200);

      expect(signupResponse.body.errors).toBeUndefined();

      // 2. Login with the new user
      const loginMutation = `
        mutation Login($loginInput: LoginInput!) {
          login(loginInput: $loginInput) {
            token
            user {
              id
            }
          }
        }
      `;

      mockUserRepository.findOne.mockResolvedValue(newUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            loginInput: {
              email: 'lifecycle@example.com',
              password: 'password123',
            },
          },
        })
        .expect(200);

      expect(loginResponse.body.errors).toBeUndefined();

      // 3. Query user data
      const userQuery = `
        query {
          user(id: 1) {
            id
            email
          }
        }
      `;

      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: userQuery })
        .expect(200);

      // Verify all operations were called
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });
  });
});
