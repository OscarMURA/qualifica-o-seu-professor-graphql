import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUniversityInput } from './dto/create-university.input';
import { UpdateUniversityInput } from './dto/update-university.input';
import { University } from './entities/university.entity';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  async create(createUniversityInput: CreateUniversityInput): Promise<University> {
    const university = this.universityRepository.create(createUniversityInput);
    return await this.universityRepository.save(university);
  }

  async findAll(): Promise<University[]> {
    return await this.universityRepository.find();
  }

  async findOne(id: string): Promise<University> {
    const university = await this.universityRepository.findOne({
      where: { id },
    });

    if (!university) {
      throw new NotFoundException(`University with ID ${id} not found`);
    }

    return university;
  }

  async update(id: string, updateUniversityInput: UpdateUniversityInput): Promise<University> {
    const university = await this.findOne(id);

    Object.assign(university, updateUniversityInput);

    return await this.universityRepository.save(university);
  }

  async remove(id: string): Promise<University> {
    const university = await this.findOne(id);
    const removedUniversity = { ...university };
    await this.universityRepository.remove(university);
    return removedUniversity as University;
  }
}