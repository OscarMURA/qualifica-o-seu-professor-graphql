import 'reflect-metadata';
import { UniversitiesService } from '../../src/universities/universities.service';
import { Repository } from 'typeorm';
import { University } from '../../src/universities/entities/university.entity';
import { CreateUniversityInput } from '../../src/universities/dto/create-university.input';
import { UpdateUniversityInput } from '../../src/universities/dto/update-university.input';
import { NotFoundException } from '@nestjs/common';

const buildUniversity = (overrides: any = {}) => ({
  id: 'uni-1',
  name: 'University One',
  location: 'City',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UniversitiesService', () => {
  let service: UniversitiesService;
  let repo: jest.Mocked<Repository<University>>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;
    service = new UniversitiesService(repo);
  });

  afterEach(() => jest.clearAllMocks());

  it('smoke: service definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea universidad correctamente', async () => {
      const input: CreateUniversityInput = { name: 'Uni Two', location: 'Town' } as any;
      repo.create.mockReturnValue(buildUniversity({ name: input.name, location: input.location }));
      repo.save.mockResolvedValue(buildUniversity({ name: input.name, location: input.location }));
      const result = await service.create(input);
      expect(repo.create).toHaveBeenCalledWith(input);
      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Uni Two');
    });
  });

  describe('findAll', () => {
    it('retorna lista de universidades', async () => {
      const list = [buildUniversity(), buildUniversity({ id: 'uni-2', name: 'University Two' })];
      repo.find.mockResolvedValue(list as any);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('retorna universidad existente', async () => {
      const uni = buildUniversity();
      repo.findOne.mockResolvedValue(uni as any);
      const result = await service.findOne(uni.id);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: uni.id } });
      expect(result.id).toBe(uni.id);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza campos de la universidad', async () => {
      const uni = buildUniversity();
      repo.findOne.mockResolvedValue(uni as any);
      repo.save.mockResolvedValue({ ...uni, name: 'Updated Uni' });
      const result = await service.update(uni.id, { name: 'Updated Uni' } as UpdateUniversityInput);
      expect(result.name).toBe('Updated Uni');
    });

    it('lanza NotFound si la universidad no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('elimina universidad existente', async () => {
      const uni = buildUniversity();
      repo.findOne.mockResolvedValue(uni as any);
      repo.remove.mockResolvedValue(uni as any);
      const result = await service.remove(uni.id);
      expect(result.id).toBe(uni.id);
      expect(repo.remove).toHaveBeenCalled();
    });

    it('lanza NotFound si no existe para remover', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
