import 'reflect-metadata';
import { CommentsResolver } from '../../src/comments/comments.resolver';
import { CommentsService } from '../../src/comments/comments.service';
import { CreateCommentInput } from '../../src/comments/dto/create-comment.input';
import { UpdateCommentInput } from '../../src/comments/dto/update-comment.input';
import { FilterCommentInput } from '../../src/comments/dto/filter-comment.input';

const mockUser = { id: 'user-1', roles: ['student'], email: 'student@example.com' } as any;
const mockComment = { id: 'comm-1', content: 'Great', rating: 5 } as any;
const mockPaginated = { data: [mockComment], page: 1, limit: 20, total: 1 } as any;
const mockRating = { averageRating: 4.2, totalComments: 3 } as any;
import 'reflect-metadata';
describe('CommentsResolver', () => {
  let resolver: CommentsResolver;
  let service: jest.Mocked<CommentsService>;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue(mockComment),
      findAll: jest.fn().mockResolvedValue(mockPaginated),
      findOne: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue({ ...mockComment, content: 'Updated' }),
      remove: jest.fn().mockResolvedValue(mockComment),
      getProfessorRating: jest.fn().mockResolvedValue(mockRating),
    } as any;
    resolver = new CommentsResolver(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('createComment delega en service.create', async () => {
    const input: CreateCommentInput = { content: 'Hello', rating: 4, professorId: 'prof-1' } as any;
    const result = await resolver.createComment(input, mockUser);
    expect(service.create).toHaveBeenCalledWith(input, mockUser);
    expect(result).toBe(mockComment);
  });

  it('findAll delega en service.findAll con filtro', async () => {
    const filter: FilterCommentInput = { search: 'Great' } as any;
    const result = await resolver.findAll(filter);
    expect(service.findAll).toHaveBeenCalledWith(filter);
    expect(result).toBe(mockPaginated);
  });

  it('findOne delega en service.findOne', async () => {
    const result = await resolver.findOne('comm-1');
    expect(service.findOne).toHaveBeenCalledWith('comm-1');
    expect(result).toBe(mockComment);
  });

  it('updateComment delega en service.update', async () => {
    const input: UpdateCommentInput = { content: 'Updated' } as any;
    const result = await resolver.updateComment('comm-1', input, mockUser);
    expect(service.update).toHaveBeenCalledWith('comm-1', input, mockUser);
    expect(result.content).toBe('Updated');
  });

  it('removeComment delega en service.remove', async () => {
    const result = await resolver.removeComment('comm-1', mockUser);
    expect(service.remove).toHaveBeenCalledWith('comm-1', mockUser);
    expect(result).toBe(mockComment);
  });

  it('getProfessorRating delega en service.getProfessorRating', async () => {
    const result = await resolver.getProfessorRating('prof-1');
    expect(service.getProfessorRating).toHaveBeenCalledWith('prof-1');
    expect(result).toBe(mockRating);
  });
});
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
      expect(qb.where).toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalled();
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
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: comment.id },
        relations: ['professor', 'student', 'professor.university']
      });
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
      expect(repo.remove).toHaveBeenCalled();
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
      expect(professorsService.findOne).toHaveBeenCalledWith('prof-1');
      expect(result.averageRating).toBeCloseTo(4.5);
      expect(result.totalComments).toBe(2);
    });

    it('lanza NotFound si no hay ratings', async () => {
      qb.getRawOne.mockResolvedValue({ averageRating: null, totalComments: '0' });
      await expect(service.getProfessorRating('prof-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
