import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniversitiesService } from 'src/universities/universities.service';
import { ILike, Repository } from 'typeorm';
import { CreateProfessorInput } from './dto/create-professor.input';
import { FilterProfessorInput } from './dto/filter-professor.input';
import { UpdateProfessorInput } from './dto/update-professor.input';
import { Professor } from './entities/professor.entity';

@Injectable()
export class ProfessorsService {
    constructor(
        @InjectRepository(Professor)
        private readonly professorRepository: Repository<Professor>,
        private readonly universitiesService: UniversitiesService,
    ) {}

    async create(createProfessorInput: CreateProfessorInput): Promise<Professor> {
        const { universityId, ...professorData } = createProfessorInput;

        const university = await this.universitiesService.findOne(universityId);

        const professor = this.professorRepository.create({
            ...professorData,
            university,
        });

        return await this.professorRepository.save(professor);
    }

    async findAll(filterInput?: FilterProfessorInput): Promise<Professor[]> {
        const where: any = {};

        if (filterInput?.universityId) {
            where.university = { id: filterInput.universityId };
        }

        if (filterInput?.search) {
            return await this.professorRepository.find({
                where: [
                    { ...where, name: ILike(`%${filterInput.search}%`) },
                    { ...where, department: ILike(`%${filterInput.search}%`) },
                ],
                relations: ['university'],
            });
        }

        return await this.professorRepository.find({
            where,
            relations: ['university'],
        });
    }

    async findOne(id: string): Promise<Professor> {
        const professor = await this.professorRepository.findOne({
            where: { id },
            relations: ['university'],
        });

        if (!professor) {
            throw new NotFoundException(`Professor with ID ${id} not found`);
        }

        return professor;
    }

    async update(id: string, updateProfessorInput: UpdateProfessorInput): Promise<Professor> {
        const professor = await this.findOne(id);

        const { universityId, ...updateData } = updateProfessorInput;

        if (universityId) {
            const university = await this.universitiesService.findOne(universityId);
            professor.university = university;
        }

        Object.assign(professor, updateData);

        return await this.professorRepository.save(professor);
    }

    async remove(id: string): Promise<Professor> {
        const professor = await this.findOne(id);
        const removedProfessor = { ...professor };
        await this.professorRepository.remove(professor);
        return removedProfessor as Professor;
    }
}
