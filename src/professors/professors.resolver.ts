import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CreateProfessorInput } from './dto/create-professor.input';
import { FilterProfessorInput } from './dto/filter-professor.input';
import { UpdateProfessorInput } from './dto/update-professor.input';
import { Professor } from './entities/professor.entity';
import { ProfessorsService } from './professors.service';

@Resolver(() => Professor)
export class ProfessorsResolver {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Mutation(() => Professor)
  @Auth(ValidRoles.admin)
  createProfessor(
    @Args('createProfessorInput') createProfessorInput: CreateProfessorInput,
  ): Promise<Professor> {
    return this.professorsService.create(createProfessorInput);
  }

  @Query(() => [Professor], { name: 'professors' })
  findAll(
    @Args('filterInput', { nullable: true }) filterInput?: FilterProfessorInput,
  ): Promise<Professor[]> {
    return this.professorsService.findAll(filterInput);
  }

  @Query(() => Professor, { name: 'professor' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<Professor> {
    return this.professorsService.findOne(id);
  }

  @Mutation(() => Professor)
  @Auth(ValidRoles.admin)
  updateProfessor(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateProfessorInput') updateProfessorInput: UpdateProfessorInput,
  ): Promise<Professor> {
    return this.professorsService.update(id, updateProfessorInput);
  }

  @Mutation(() => Professor)
  @Auth(ValidRoles.admin)
  removeProfessor(@Args('id', { type: () => ID }) id: string): Promise<Professor> {
    return this.professorsService.remove(id);
  }
}