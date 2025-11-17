import 'reflect-metadata';
import { UniversitiesResolver } from '../../src/universities/universities.resolver';
import { UniversitiesService } from '../../src/universities/universities.service';
import { CreateUniversityInput } from '../../src/universities/dto/create-university.input';
import { UpdateUniversityInput } from '../../src/universities/dto/update-university.input';

const mockUniversity = {
  id: 'uni-1',
  name: 'University One',
  location: 'City',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UniversitiesResolver', () => {
  let resolver: UniversitiesResolver;
  let service: jest.Mocked<UniversitiesService>;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue(mockUniversity),
      findAll: jest.fn().mockResolvedValue([mockUniversity]),
      findOne: jest.fn().mockResolvedValue(mockUniversity),
      update: jest.fn().mockResolvedValue({ ...mockUniversity, name: 'Updated University' }),
      remove: jest.fn().mockResolvedValue(mockUniversity),
    } as any;

    resolver = new UniversitiesResolver(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('createUniversity delega en service.create', async () => {
    const input: CreateUniversityInput = { name: 'New Uni', location: 'Town' } as any;
    const result = await resolver.createUniversity(input);
    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toBe(mockUniversity);
  });

  it('findAll delega en service.findAll', async () => {
    const result = await resolver.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('findOne delega en service.findOne', async () => {
    const result = await resolver.findOne('uni-1');
    expect(service.findOne).toHaveBeenCalledWith('uni-1');
    expect(result.id).toBe('uni-1');
  });

  it('updateUniversity delega en service.update', async () => {
    const input: UpdateUniversityInput = { name: 'Updated University' } as any;
    const result = await resolver.updateUniversity('uni-1', input);
    expect(service.update).toHaveBeenCalledWith('uni-1', input);
    expect(result.name).toBe('Updated University');
  });

  it('removeUniversity delega en service.remove', async () => {
    const result = await resolver.removeUniversity('uni-1');
    expect(service.remove).toHaveBeenCalledWith('uni-1');
    expect(result.id).toBe('uni-1');
  });
});
