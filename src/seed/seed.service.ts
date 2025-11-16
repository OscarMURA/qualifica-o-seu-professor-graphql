import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Comment } from 'src/comments/entities/comment.entity';
import { Professor } from 'src/professors/entities/professor.entity';
import { University } from 'src/universities/entities/university.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(University)
        private readonly universityRepository: Repository<University>,
        @InjectRepository(Professor)
        private readonly professorRepository: Repository<Professor>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {}

    async executeSeed() {
        // Verificar si ya hay datos del seed (ignorando el admin predeterminado)
        const universityCount = await this.universityRepository.count();
        const professorCount = await this.professorRepository.count();
        const commentCount = await this.commentRepository.count();
        
        // Contar estudiantes (usuarios que NO son el admin predeterminado)
        const studentCount = await this.userRepository
            .createQueryBuilder('user')
            .where('user.email != :adminEmail', { adminEmail: 'admin@example.com' })
            .getCount();

        if (universityCount > 0 || professorCount > 0 || studentCount > 0 || commentCount > 0) {
            return {
                message: 'Database already has seed data. Use unseed first.',
                admin: null,
                universities: universityCount,
                professors: professorCount,
                students: studentCount,
                comments: commentCount,
            };
        }

        // Obtener el admin predeterminado (ya debe existir gracias a UsersService)
        const admin = await this.userRepository.findOne({
            where: { email: 'admin@example.com' }
        });

        if (!admin) {
            throw new Error('Default admin user not found. Please restart the application.');
        }

        // Crear 80 universidades
        const universities: University[] = [];
        for (let i = 0; i < 80; i++) {
            const university = await this.universityRepository.save({
                name: faker.company.name() + ' University',
                location: faker.location.city() + ', ' + faker.location.state(),
            });
            universities.push(university);
        }

        // Crear 150 profesores
        const professors: Professor[] = [];
        for (let i = 0; i < 150; i++) {
            const professor = await this.professorRepository.save({
                name: faker.person.fullName(),
                department: faker.commerce.department(),
                university: faker.helpers.arrayElement(universities),
            });
            professors.push(professor);
        }

        // Crear 99 estudiantes (100 usuarios totales contando el admin)
        const students: User[] = [];
        for (let i = 0; i < 99; i++) {
            const student = await this.userRepository.save({
                email: faker.internet.email().toLowerCase(),
                fullName: faker.person.fullName(),
                password: await bcrypt.hash('password123', 10),
                roles: [ValidRoles.student],
                isActive: true,
            });
            students.push(student);
        }

        // Crear 400 comentarios
        for (let i = 0; i < 400; i++) {
            await this.commentRepository.save({
                content: faker.lorem.paragraph(),
                rating: faker.number.int({ min: 1, max: 5 }),
                professor: faker.helpers.arrayElement(professors),
                student: faker.helpers.arrayElement(students),
            });
        }

        return {
            message: 'Seed executed successfully',
            admin: {
                id: admin.id,
                email: admin.email,
            },
            universities: universities.length,
            professors: professors.length,
            students: students.length,
            comments: 400,
        };
    }

    async executeUnseed() {
        // Delete in order to respect foreign key constraints
        // First delete comments (has FK to professors and users)
        await this.commentRepository
            .createQueryBuilder()
            .delete()
            .execute();

        // Then delete professors (has FK to universities)
        await this.professorRepository
            .createQueryBuilder()
            .delete()
            .execute();

        // Then delete universities
        await this.universityRepository
            .createQueryBuilder()
            .delete()
            .execute();
        
        // Delete all users EXCEPT the default admin
        await this.userRepository
            .createQueryBuilder()
            .delete()
            .where('email != :adminEmail', { adminEmail: 'admin@example.com' })
            .execute();

        return {
            message: 'Unseed executed successfully',
        };
    }
}
