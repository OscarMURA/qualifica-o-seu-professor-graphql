import 'reflect-metadata';
import { ProfessorsService } from '../../src/professors/professors.service';
import { UniversitiesService } from '../../src/universities/universities.service';
import { Repository, ILike } from 'typeorm';
import { Professor } from '../../src/professors/entities/professor.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateProfessorInput } from '../../src/professors/dto/create-professor.input';
import { UpdateProfessorInput } from '../../src/professors/dto/update-professor.input';
import { FilterProfessorInput } from '../../src/professors/dto/filter-professor.input';

const buildUniversity = (overrides: any = {}) => ({
  id: 'uni-1',
  name: 'University One',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildProfessor = (overrides: any = {}) => ({
  id: 'prof-1',
  name: 'John Doe',
  department: 'Mathematics',
  university: buildUniversity(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProfessorsService', () => {
  let service: ProfessorsService;
  let repo: jest.Mocked<Repository<Professor>>;
  let universitiesService: jest.Mocked<UniversitiesService>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    universitiesService = {
      findOne: jest.fn().mockResolvedValue(buildUniversity()),
    } as any;

    service = new ProfessorsService(repo, universitiesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('smoke: service definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea profesor con universidad asociada', async () => {
      const input: CreateProfessorInput = { name: 'Alice', department: 'Physics', universityId: 'uni-1' } as any;
      repo.create.mockReturnValue(buildProfessor({ name: input.name, department: input.department }));
      repo.save.mockResolvedValue(buildProfessor({ name: input.name, department: input.department }));
      const result = await service.create(input);
      expect(universitiesService.findOne).toHaveBeenCalledWith('uni-1');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Alice');
    });
  });

  describe('findAll', () => {
    it('retorna lista sin filtros', async () => {
      const profs = [buildProfessor(), buildProfessor({ id: 'prof-2' })];
      repo.find.mockResolvedValue(profs as any);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ where: {}, relations: ['university'] });
      expect(result).toHaveLength(2);
    });

    it('filtra por universityId', async () => {
      const profs = [buildProfessor()];
      repo.find.mockResolvedValue(profs as any);
      const result = await service.findAll({ universityId: 'uni-1' } as FilterProfessorInput);
      expect(repo.find).toHaveBeenCalledWith({ where: { university: { id: 'uni-1' } }, relations: ['university'] });
      expect(result).toHaveLength(1);
    });

    it('aplica búsqueda (search) delegando en find con condiciones ILike)', async () => {
      const profs = [buildProfessor({ name: 'Math Pro' })];
      repo.find.mockResolvedValue(profs as any);
      const result = await service.findAll({ search: 'Math' } as FilterProfessorInput);
      expect(repo.find).toHaveBeenCalledWith({
        where: [
          { university: undefined, name: ILike('%Math%') },
          { university: undefined, department: ILike('%Math%') },
        ],
        relations: ['university'],
      });
      expect(result[0].name).toContain('Math');
    });

    it('aplica búsqueda con universityId combinado', async () => {
      const profs = [buildProfessor({ name: 'Math Pro' })];
      repo.find.mockResolvedValue(profs as any);
      const result = await service.findAll({ search: 'Math', universityId: 'uni-1' } as FilterProfessorInput);
      expect(repo.find).toHaveBeenCalledWith({
        where: [
          { university: { id: 'uni-1' }, name: ILike('%Math%') },
          { university: { id: 'uni-1' }, department: ILike('%Math%') },
        ],
        relations: ['university'],
      });
      expect(result[0].name).toContain('Math');
    });
  });

  describe('findOne', () => {
    it('retorna profesor existente', async () => {
      const prof = buildProfessor();
      repo.findOne.mockResolvedValue(prof as any);
      const result = await service.findOne(prof.id);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: prof.id }, relations: ['university'] });
      expect(result.id).toBe(prof.id);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza datos básicos', async () => {
      const prof = buildProfessor();
      repo.findOne.mockResolvedValue(prof as any);
      repo.save.mockResolvedValue({ ...prof, name: 'Updated Name' });
      const result = await service.update(prof.id, { name: 'Updated Name' } as UpdateProfessorInput);
      expect(result.name).toBe('Updated Name');
    });

    it('actualiza universidad cuando se especifica universityId', async () => {
      const prof = buildProfessor();
      repo.findOne.mockResolvedValue(prof as any);
      universitiesService.findOne.mockResolvedValue(buildUniversity({ id: 'uni-2', name: 'Uni Two' }));
      repo.save.mockResolvedValue({ ...prof, university: buildUniversity({ id: 'uni-2', name: 'Uni Two' }) });
      const result = await service.update(prof.id, { universityId: 'uni-2' } as UpdateProfessorInput);
      expect(universitiesService.findOne).toHaveBeenCalledWith('uni-2');
      expect(result.university.id).toBe('uni-2');
    });
  });

  describe('remove', () => {
    it('elimina profesor y retorna copia', async () => {
      const prof = buildProfessor();
      repo.findOne.mockResolvedValue(prof as any);
      repo.remove.mockResolvedValue(prof as any);
      const result = await service.remove(prof.id);
      expect(result.id).toBe(prof.id);
      expect(repo.remove).toHaveBeenCalled();
    });
  });
});
