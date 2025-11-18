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
});
