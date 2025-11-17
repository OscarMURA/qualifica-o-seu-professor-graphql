import 'reflect-metadata';
import { CommentsService } from '../../src/comments/comments.service';
import { ProfessorsService } from '../../src/professors/professors.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Comment } from '../../src/comments/entities/comment.entity';
import { CreateCommentInput } from '../../src/comments/dto/create-comment.input';
import { UpdateCommentInput } from '../../src/comments/dto/update-comment.input';
import { FilterCommentInput } from '../../src/comments/dto/filter-comment.input';

// Helpers
const buildUser = (overrides: any = {}) => ({
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  roles: ['student'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildProfessor = (overrides: any = {}) => ({
  id: 'prof-1',
  fullName: 'Prof One',
  university: { id: 'uni-1', name: 'Uni', createdAt: new Date(), updatedAt: new Date() },
  comments: [],
  ...overrides,
});

const buildComment = (overrides: any = {}) => ({
  id: 'comm-1',
  content: 'Great teacher',
  rating: 5,
  professor: buildProfessor(),
  student: buildUser(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: jest.Mocked<Repository<Comment>>;
  let professorsService: jest.Mocked<ProfessorsService>;
  let qb: any;

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([buildComment()]),
      getCount: jest.fn().mockResolvedValue(1),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.50', totalComments: '2'}),
    };

    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any;

    professorsService = {
      findOne: jest.fn().mockResolvedValue(buildProfessor())
    } as any;

    service = new CommentsService(repo, professorsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('smoke: service definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea comentario cuando no existe previo', async () => {
      const input: CreateCommentInput = { content: 'Nice', rating: 4, professorId: 'prof-1' } as any;
      const user = buildUser();
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(buildComment({ content: input.content, rating: input.rating }));
      repo.save.mockResolvedValue(buildComment({ content: input.content, rating: input.rating }));

      const result = await service.create(input, user as any);
      expect(professorsService.findOne).toHaveBeenCalledWith('prof-1');
      expect(repo.findOne).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result.content).toBe('Nice');
    });

    it('lanza Conflict si ya existe comentario', async () => {
      const input: CreateCommentInput = { content: 'Again', rating: 3, professorId: 'prof-1' } as any;
      const user = buildUser();
      repo.findOne.mockResolvedValue(buildComment());
      await expect(service.create(input, user as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('retorna paginación con filtros aplicados', async () => {
      const filter: FilterCommentInput = { professorId: 'prof-1', userId: 'user-1', search: 'great', page: 2, limit: 10 } as any;
      const result = await service.findAll(filter);
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('funciona sin filtros (usa defaults)', async () => {
      const result = await service.findAll();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('retorna comentario existente', async () => {
      const comment = buildComment();
      repo.findOne.mockResolvedValue(comment as any);
      const result = await service.findOne(comment.id);
      expect(result.id).toBe(comment.id);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza comentario si es dueño', async () => {
      const user = buildUser();
      const comment = buildComment({ student: user });
      repo.findOne.mockResolvedValue(comment as any);
      repo.save.mockResolvedValue({ ...comment, content: 'Updated' });
      const result = await service.update(comment.id, { content: 'Updated' } as UpdateCommentInput, user as any);
      expect(result.content).toBe('Updated');
    });

    it('lanza Forbidden si no es dueño ni admin', async () => {
      const owner = buildUser({ id: 'owner-1' });
      const user = buildUser({ id: 'other-1', roles: ['student'] });
      const comment = buildComment({ student: owner });
      repo.findOne.mockResolvedValue(comment as any);
      await expect(service.update(comment.id, { content: 'X' } as any, user as any)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite admin actualizar aunque no sea dueño', async () => {
      const owner = buildUser({ id: 'owner-1' });
      const admin = buildUser({ id: 'admin-1', roles: ['admin'] });
      const comment = buildComment({ student: owner });
      repo.findOne.mockResolvedValue(comment as any);
      repo.save.mockResolvedValue({ ...comment, content: 'Admin edit' });
      const result = await service.update(comment.id, { content: 'Admin edit' } as any, admin as any);
      expect(result.content).toBe('Admin edit');
    });
  });

  describe('remove', () => {
    it('elimina comentario si es dueño', async () => {
      const user = buildUser();
      const comment = buildComment({ student: user });
      repo.findOne.mockResolvedValue(comment as any);
      repo.remove.mockResolvedValue(comment as any);
      const result = await service.remove(comment.id, user as any);
      expect(result.id).toBe(comment.id);
    });

    it('lanza Forbidden si no es dueño ni admin', async () => {
      const owner = buildUser({ id: 'owner-1' });
      const user = buildUser({ id: 'other-1', roles: ['student'] });
      const comment = buildComment({ student: owner });
      repo.findOne.mockResolvedValue(comment as any);
      await expect(service.remove(comment.id, user as any)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite admin eliminar aunque no sea dueño', async () => {
      const owner = buildUser({ id: 'owner-1' });
      const admin = buildUser({ id: 'admin-1', roles: ['admin'] });
      const comment = buildComment({ student: owner });
      repo.findOne.mockResolvedValue(comment as any);
      repo.remove.mockResolvedValue(comment as any);
      const result = await service.remove(comment.id, admin as any);
      expect(result.id).toBe(comment.id);
    });
  });

  describe('getProfessorRating', () => {
    it('retorna rating promedio y total comentarios', async () => {
      const result = await service.getProfessorRating('prof-1');
      expect(result.averageRating).toBeCloseTo(4.5);
      expect(result.totalComments).toBe(2);
    });

    it('lanza NotFound si no hay ratings', async () => {
      qb.getRawOne.mockResolvedValue({ averageRating: null, totalComments: '0' });
      await expect(service.getProfessorRating('prof-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
