import 'reflect-metadata';
import { ProfessorsResolver } from '../../src/professors/professors.resolver';
import { ProfessorsService } from '../../src/professors/professors.service';
import { CreateProfessorInput } from '../../src/professors/dto/create-professor.input';
import { UpdateProfessorInput } from '../../src/professors/dto/update-professor.input';
import { FilterProfessorInput } from '../../src/professors/dto/filter-professor.input';

const mockProfessor = {
  id: 'prof-1',
  name: 'John Doe',
  department: 'Math',
  university: { id: 'uni-1', name: 'Uni One' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProfessorsResolver', () => {
  let resolver: ProfessorsResolver;
  let service: jest.Mocked<ProfessorsService>;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue(mockProfessor),
      findAll: jest.fn().mockResolvedValue([mockProfessor]),
      findOne: jest.fn().mockResolvedValue(mockProfessor),
      update: jest.fn().mockResolvedValue({ ...mockProfessor, name: 'Updated' }),
      remove: jest.fn().mockResolvedValue(mockProfessor),
    } as any;

    resolver = new ProfessorsResolver(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('createProfessor delega en service.create', async () => {
    const input: CreateProfessorInput = { name: 'Alice', department: 'Physics', universityId: 'uni-1' } as any;
    const result = await resolver.createProfessor(input);
    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toBe(mockProfessor);
  });

  it('findAll sin filtro delega en service.findAll', async () => {
    const result = await resolver.findAll();
    expect(service.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(1);
  });

  it('findAll con filtro delega en service.findAll', async () => {
    const filter: FilterProfessorInput = { search: 'John' } as any;
    const result = await resolver.findAll(filter);
    expect(service.findAll).toHaveBeenCalledWith(filter);
    expect(result[0].name).toBe('John Doe');
  });

  it('findOne delega en service.findOne', async () => {
    const result = await resolver.findOne('prof-1');
    expect(service.findOne).toHaveBeenCalledWith('prof-1');
    expect(result.id).toBe('prof-1');
  });

  it('updateProfessor delega en service.update', async () => {
    const input: UpdateProfessorInput = { name: 'Updated' } as any;
    const result = await resolver.updateProfessor('prof-1', input);
    expect(service.update).toHaveBeenCalledWith('prof-1', input);
    expect(result.name).toBe('Updated');
  });

  it('removeProfessor delega en service.remove', async () => {
    const result = await resolver.removeProfessor('prof-1');
    expect(service.remove).toHaveBeenCalledWith('prof-1');
    expect(result.id).toBe('prof-1');
  });
});
