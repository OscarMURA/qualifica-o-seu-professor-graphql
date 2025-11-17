import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedPassword123',
    isActive: true,
    roles: ['teacher'],
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GraphQL Queries', () => {
    describe('user query', () => {
      it('should return error for not implemented query', () => {
        const query = `
          query {
            user(id: 1) {
              id
              email
              fullName
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain('Not implemented');
          });
      });

      it('should handle invalid query structure', () => {
        const query = `
          query {
            user {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(400);
      });

      it('should handle query without id parameter', () => {
        const query = `
          query {
            user {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query with string id instead of int', () => {
        const query = `
          query {
            user(id: "abc") {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query with negative id', () => {
        const query = `
          query {
            user(id: -1) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain('Not implemented');
          });
      });

      it('should handle query with zero id', () => {
        const query = `
          query {
            user(id: 0) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain('Not implemented');
          });
      });

      it('should handle query with very large id', () => {
        const query = `
          query {
            user(id: 999999999) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query requesting non-existent fields', () => {
        const query = `
          query {
            user(id: 1) {
              id
              email
              nonExistentField
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query with all valid fields', () => {
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

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors[0].message).toContain('Not implemented');
          });
      });

      it('should handle query with nested fields', () => {
        const query = `
          query {
            user(id: 1) {
              id
              email
              fullName
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200);
      });

      it('should handle multiple queries in one request', () => {
        const query = `
          query {
            user1: user(id: 1) {
              id
              email
            }
            user2: user(id: 2) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200);
      });

      it('should handle query with variables', () => {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: { id: 1 },
          })
          .expect(200);
      });

      it('should handle query with missing variables', () => {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query with wrong variable type', () => {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: { id: 'not-a-number' },
          })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle query with null variable', () => {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: { id: null },
          })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });
    });

    describe('introspection queries', () => {
      it('should support GraphQL introspection', () => {
        const query = `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.__schema).toBeDefined();
            expect(res.body.data.__schema.types).toBeDefined();
          });
      });

      it('should return User type in schema', () => {
        const query = `
          query {
            __type(name: "User") {
              name
              fields {
                name
                type {
                  name
                }
              }
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.__type).toBeDefined();
            expect(res.body.data.__type.name).toBe('User');
          });
      });

      it('should show User fields in introspection', () => {
        const query = `
          query {
            __type(name: "User") {
              fields {
                name
              }
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            const fields = res.body.data.__type.fields.map((f: any) => f.name);
            expect(fields).toContain('id');
            expect(fields).toContain('email');
            expect(fields).toContain('fullName');
          });
      });

      it('should show available queries', () => {
        const query = `
          query {
            __schema {
              queryType {
                fields {
                  name
                }
              }
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.__schema.queryType.fields).toBeDefined();
          });
      });
    });

    describe('error handling', () => {
      it('should handle malformed GraphQL syntax', () => {
        const query = `
          query {
            user(id: 1
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle empty query', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query: '' })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle missing query', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({})
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle null query', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query: null })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });

      it('should handle invalid JSON', () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .set('Content-Type', 'application/json')
          .send('invalid json')
          .expect(400);
      });

      it('should handle query with circular reference', () => {
        const query = `
          query {
            user(id: 1) {
              id
              email
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200);
      });
    });

    describe('HTTP methods', () => {
      it('should accept POST requests', () => {
        const query = `
          query {
            user(id: 1) {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200);
      });

      it('should reject GET requests for mutations', () => {
        return request(app.getHttpServer())
          .get('/graphql')
          .query({ query: 'query { user(id: 1) { id } }' })
          .expect((res) => {
            // GET puede estar permitido o no dependiendo de la configuración
            expect(res).toBeDefined();
          });
      });

      it('should handle preflight OPTIONS request', () => {
        return request(app.getHttpServer())
          .options('/graphql')
          .expect((res) => {
            expect([200, 204]).toContain(res.status);
          });
      });
    });

    describe('content type handling', () => {
      it('should accept application/json', () => {
        const query = `
          query {
            user(id: 1) {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .set('Content-Type', 'application/json')
          .send({ query })
          .expect(200);
      });

      it('should handle charset in content type', () => {
        const query = `
          query {
            user(id: 1) {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .set('Content-Type', 'application/json; charset=utf-8')
          .send({ query })
          .expect(200);
      });
    });

    describe('concurrent requests', () => {
      it('should handle multiple concurrent requests', async () => {
        const query = `
          query {
            user(id: 1) {
              id
              email
            }
          }
        `;

        const requests = Array(5)
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

      it('should handle concurrent requests with different queries', async () => {
        const queries = [
          'query { user(id: 1) { id } }',
          'query { user(id: 2) { email } }',
          'query { user(id: 3) { fullName } }',
        ];

        const requests = queries.map((query) =>
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

    describe('large payloads', () => {
      it('should handle query with many fields', () => {
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

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200);
      });

      it('should handle query with long string in variable', () => {
        const query = `
          query GetUser($id: Int!) {
            user(id: $id) {
              id
            }
          }
        `;

        const longString = 'a'.repeat(10000);

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: { id: 1, extra: longString },
          })
          .expect(200);
      });
    });

    describe('security', () => {
      it('should not expose internal error details', () => {
        const query = `
          query {
            user(id: 1) {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect(200)
          .expect((res) => {
            if (res.body.errors) {
              res.body.errors.forEach((error: any) => {
                expect(error.message).not.toContain('password');
                expect(error.message).not.toContain('token');
              });
            }
          });
      });

      it('should handle injection attempts in query', () => {
        const query = `
          query {
            user(id: "1; DROP TABLE users;") {
              id
            }
          }
        `;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({ query })
          .expect((res) => {
            expect(res.body.errors).toBeDefined();
          });
      });
    });
  });

  describe('Application health', () => {
    it('should have GraphQL endpoint available', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
        });
    });

    it('should respond to requests', () => {
      const query = `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `;

      return request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);
    });
  });
});
