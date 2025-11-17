import { Mutation, Resolver } from '@nestjs/graphql';
import { SeedService } from './seed.service';
import { SeedResponse, UnseedResponse } from './types/seed-response.type';

@Resolver()
export class SeedResolver {
  constructor(private readonly seedService: SeedService) {}

  @Mutation(() => SeedResponse)
  async executeSeed(): Promise<SeedResponse> {
    return await this.seedService.executeSeed();
  }

  @Mutation(() => UnseedResponse)
  async executeUnseed(): Promise<UnseedResponse> {
    return await this.seedService.executeUnseed();
  }
}