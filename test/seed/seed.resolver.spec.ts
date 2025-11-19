import 'reflect-metadata';
jest.mock('@faker-js/faker', () => ({ faker: {} }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), hashSync: jest.fn() }));
import { SeedResolver } from '../../src/seed/seed.resolver';
import { SeedService } from '../../src/seed/seed.service';

const mockSeedResponse = {
  message: 'Seed executed successfully',
  admin: { id: 'admin-id', email: 'admin@example.com' },
  universities: 80,
  professors: 150,
  students: 99,
  comments: 400,
};

const mockUnseedResponse = { message: 'Unseed executed successfully' };

describe('SeedResolver', () => {
  let resolver: SeedResolver;
  let service: jest.Mocked<SeedService>;

  beforeEach(() => {
    service = {
      executeSeed: jest.fn().mockResolvedValue(mockSeedResponse),
      executeUnseed: jest.fn().mockResolvedValue(mockUnseedResponse),
    } as any;
    resolver = new SeedResolver(service);
  });

  afterEach(() => jest.clearAllMocks());

  it('executeSeed delega en service.executeSeed', async () => {
    const result = await resolver.executeSeed();
    expect(service.executeSeed).toHaveBeenCalled();
    expect(result).toBe(mockSeedResponse);
  });

  it('executeUnseed delega en service.executeUnseed', async () => {
    const result = await resolver.executeUnseed();
    expect(service.executeUnseed).toHaveBeenCalled();
    expect(result).toBe(mockUnseedResponse);
  });

  it('executeSeed retorna datos correctos', async () => {
    const result = await resolver.executeSeed();
    expect(result.universities).toBe(80);
    expect(result.professors).toBe(150);
    expect(result.students).toBe(99);
    expect(result.comments).toBe(400);
  });

  it('executeUnseed retorna mensaje correcto', async () => {
    const result = await resolver.executeUnseed();
    expect(result.message).toBe('Unseed executed successfully');
  });

  it('executeSeed maneja errores', async () => {
    service.executeSeed.mockRejectedValue(new Error('Seed failed'));
    await expect(resolver.executeSeed()).rejects.toThrow('Seed failed');
  });

  it('executeUnseed maneja errores', async () => {
    service.executeUnseed.mockRejectedValue(new Error('Unseed failed'));
    await expect(resolver.executeUnseed()).rejects.toThrow('Unseed failed');
  });

  it('executeSeed crea datos de prueba', async () => {
    const result = await resolver.executeSeed();
    expect(service.executeSeed).toHaveBeenCalled();
    expect(result.message).toBe('Seed executed successfully');
  });

  it('executeUnseed limpia datos de prueba', async () => {
    const result = await resolver.executeUnseed();
    expect(service.executeUnseed).toHaveBeenCalled();
    expect(result.message).toBe('Unseed executed successfully');
  });
});
