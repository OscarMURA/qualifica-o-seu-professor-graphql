import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/comments/entities/comment.entity';
import { Professor } from 'src/professors/entities/professor.entity';
import { University } from 'src/universities/entities/university.entity';
import { User } from 'src/users/entities/user.entity';
import { SeedResolver } from './seed.resolver';
import { SeedService } from './seed.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, University, Professor, Comment]),
    ],
    providers: [SeedResolver, SeedService],
})
export class SeedModule {}
