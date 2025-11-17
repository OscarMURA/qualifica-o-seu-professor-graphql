import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CreateUniversityInput } from './dto/create-university.input';
import { UpdateUniversityInput } from './dto/update-university.input';
import { University } from './entities/university.entity';
import { UniversitiesService } from './universities.service';

@Resolver(() => University)
export class UniversitiesResolver {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Mutation(() => University)
  @Auth(ValidRoles.admin)
  createUniversity(
    @Args('createUniversityInput') createUniversityInput: CreateUniversityInput,
  ): Promise<University> {
    return this.universitiesService.create(createUniversityInput);
  }

  @Query(() => [University], { name: 'universities' })
  findAll(): Promise<University[]> {
    return this.universitiesService.findAll();
  }

  @Query(() => University, { name: 'university' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<University> {
    return this.universitiesService.findOne(id);
  }

  @Mutation(() => University)
  @Auth(ValidRoles.admin)
  updateUniversity(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateUniversityInput') updateUniversityInput: UpdateUniversityInput,
  ): Promise<University> {
    return this.universitiesService.update(id, updateUniversityInput);
  }

  @Mutation(() => University)
  @Auth(ValidRoles.admin)
  removeUniversity(@Args('id', { type: () => ID }) id: string): Promise<University> {
    return this.universitiesService.remove(id);
  }
}