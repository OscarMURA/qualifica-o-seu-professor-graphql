import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfessorsService } from 'src/professors/professors.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCommentInput } from './dto/create-comment.input';
import { FilterCommentInput } from './dto/filter-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Comment } from './entities/comment.entity';
import { PaginatedComments, ProfessorRating } from './types/comment-response.type';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        private readonly professorsService: ProfessorsService,
    ) {}

    async create(createCommentInput: CreateCommentInput, user: User): Promise<Comment> {
        const { professorId, ...commentData } = createCommentInput;

        const professor = await this.professorsService.findOne(professorId);

        // Check if user already commented on this professor
        const existingComment = await this.commentRepository.findOne({
            where: {
                professor: { id: professorId },
                student: { id: user.id },
            },
        });

        if (existingComment) {
            throw new ConflictException('You have already commented and rated this professor');
        }

        const comment = this.commentRepository.create({
            ...commentData,
            professor,
            student: user,
        });

        return await this.commentRepository.save(comment);
    }

    async findAll(filterInput?: FilterCommentInput): Promise<PaginatedComments> {
        const { professorId, userId, search, page = 1, limit = 20 } = filterInput || {};

        const where: any = {};

        if (professorId) {
            where.professor = { id: professorId };
        }

        if (userId) {
            where.student = { id: userId };
        }

        let query = this.commentRepository.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.professor', 'professor')
            .leftJoinAndSelect('comment.student', 'student')
            .leftJoinAndSelect('professor.university', 'university');

        if (professorId) {
            query = query.where('professor.id = :professorId', { professorId });
        }

        if (userId) {
            query = query.andWhere('student.id = :userId', { userId });
        }

        if (search) {
            query = query.andWhere('comment.content ILIKE :search', { search: `%${search}%` });
        }

        const total = await query.getCount();

        const data = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data,
            page,
            limit,
            total,
        };
    }

    async findOne(id: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['professor', 'student', 'professor.university'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        return comment;
    }

    async update(id: string, updateCommentInput: UpdateCommentInput, user: User): Promise<Comment> {
        const comment = await this.findOne(id);

        // Check if user is owner or admin
        if (comment.student.id !== user.id && !user.roles.includes('admin')) {
            throw new ForbiddenException('Only the comment owner or administrators can update this comment');
        }

        Object.assign(comment, updateCommentInput);

        return await this.commentRepository.save(comment);
    }

    async remove(id: string, user: User): Promise<Comment> {
        const comment = await this.findOne(id);

        // Check if user is owner or admin
        if (comment.student.id !== user.id && !user.roles.includes('admin')) {
            throw new ForbiddenException('Only the comment owner or administrators can delete this comment');
        }

        const removedComment = { ...comment };
        await this.commentRepository.remove(comment);
        return removedComment as Comment;
    }

    async getProfessorRating(professorId: string): Promise<ProfessorRating> {
        const professor = await this.professorsService.findOne(professorId);

        const result = await this.commentRepository
            .createQueryBuilder('comment')
            .select('AVG(comment.rating)', 'averageRating')
            .addSelect('COUNT(comment.id)', 'totalComments')
            .where('comment.professorId = :professorId', { professorId })
            .getRawOne();

        if (!result || result.totalComments === '0') {
            throw new NotFoundException('No ratings available for this professor');
        }

        return {
            averageRating: parseFloat(result.averageRating),
            totalComments: parseInt(result.totalComments),
        };
    }
}
