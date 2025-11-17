import 'reflect-metadata';
// Mocks ESM faker para entorno CommonJS de Jest
jest.mock('@faker-js/faker', () => ({
  faker: {
    company: { name: () => 'Company' },
    location: { city: () => 'City', state: () => 'State' },
    person: { fullName: () => 'Full Name' },
    commerce: { department: () => 'Dept' },
    internet: { email: () => 'student@example.com' },
    helpers: { arrayElement: (arr: any[]) => arr[0] },
    number: { int: ({ min }: { min: number; max: number }) => min },
    lorem: { paragraph: () => 'Comment content' }
  }
}));
// Mock bcrypt para evitar coste de hashing real
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  hashSync: jest.fn().mockReturnValue('hashed')
}));
import { SeedService } from '../../src/seed/seed.service';
import { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { University } from '../../src/universities/entities/university.entity';
import { Professor } from '../../src/professors/entities/professor.entity';
import { Comment } from '../../src/comments/entities/comment.entity';

// Repos mocks builder
const makeRepo = () => ({
  count: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// Helper para queryBuilder delete
const makeDeleteQB = () => ({ delete: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), execute: jest.fn() });

describe('SeedService', () => {
  let userRepo: any;
  let universityRepo: any;
  let professorRepo: any;
  let commentRepo: any;
  let service: SeedService;
  let userQB: any;

  beforeEach(() => {
    userRepo = makeRepo();
    universityRepo = makeRepo();
    professorRepo = makeRepo();
    commentRepo = makeRepo();

    // QueryBuilder para contar estudiantes
    userQB = { where: jest.fn().mockReturnThis(), getCount: jest.fn() };
    userRepo.createQueryBuilder.mockReturnValue(userQB);

    service = new SeedService(userRepo as Repository<User>, universityRepo as Repository<University>, professorRepo as Repository<Professor>, commentRepo as Repository<Comment>);
  });

  afterEach(() => jest.clearAllMocks());

  it('retorna mensaje de datos existentes si hay registros', async () => {
    universityRepo.count.mockResolvedValue(1);
    professorRepo.count.mockResolvedValue(0);
    commentRepo.count.mockResolvedValue(0);
    userQB.getCount.mockResolvedValue(0);

    const result = await service.executeSeed();
    expect(result.message).toMatch(/already has seed data/);
    expect(result.admin).toBeNull();
  });

  it('lanza error si falta admin', async () => {
    universityRepo.count.mockResolvedValue(0);
    professorRepo.count.mockResolvedValue(0);
    commentRepo.count.mockResolvedValue(0);
    userQB.getCount.mockResolvedValue(0);
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.executeSeed()).rejects.toThrow('Default admin user not found');
  });

  it('ejecuta seed exitoso creando entidades', async () => {
    universityRepo.count.mockResolvedValue(0);
    professorRepo.count.mockResolvedValue(0);
    commentRepo.count.mockResolvedValue(0);
    userQB.getCount.mockResolvedValue(0);
    userRepo.findOne.mockResolvedValue({ id: 'admin-id', email: 'admin@example.com' });

    // Simular guardados
    let universitySaved = 0;
    universityRepo.save.mockImplementation(async (u: any) => ({ id: 'uni-' + (++universitySaved), ...u }));

    let professorSaved = 0;
    professorRepo.save.mockImplementation(async (p: any) => ({ id: 'prof-' + (++professorSaved), ...p }));

    let studentSaved = 0;
    userRepo.save.mockImplementation(async (u: any) => ({ id: 'stu-' + (++studentSaved), ...u }));

    let commentSaved = 0;
    commentRepo.save.mockImplementation(async (c: any) => ({ id: 'com-' + (++commentSaved), ...c }));

    const result = await service.executeSeed();
    expect(result.message).toMatch(/Seed executed successfully/);
    expect(result.universities).toBe(80);
    expect(result.professors).toBe(150);
    expect(result.students).toBe(99);
    expect(result.comments).toBe(400);
    expect(universityRepo.save).toHaveBeenCalledTimes(80);
    expect(professorRepo.save).toHaveBeenCalledTimes(150);
    expect(userRepo.save).toHaveBeenCalledTimes(99);
    expect(commentRepo.save).toHaveBeenCalledTimes(400);
  });

  it('ejecuta unseed eliminando en orden', async () => {
    const commentDeleteQB = makeDeleteQB();
    const professorDeleteQB = makeDeleteQB();
    const universityDeleteQB = makeDeleteQB();
    const userDeleteQB = makeDeleteQB();

    commentRepo.createQueryBuilder.mockReturnValue(commentDeleteQB);
    professorRepo.createQueryBuilder.mockReturnValue(professorDeleteQB);
    universityRepo.createQueryBuilder.mockReturnValue(universityDeleteQB);
    userRepo.createQueryBuilder.mockReturnValue(userDeleteQB);

    const result = await service.executeUnseed();
    expect(result.message).toMatch(/Unseed executed successfully/);
    expect(commentDeleteQB.delete).toHaveBeenCalled();
    expect(professorDeleteQB.delete).toHaveBeenCalled();
    expect(universityDeleteQB.delete).toHaveBeenCalled();
    expect(userDeleteQB.delete).toHaveBeenCalled();
    expect(userDeleteQB.where).toHaveBeenCalledWith('email != :adminEmail', { adminEmail: 'admin@example.com' });
  });
});
