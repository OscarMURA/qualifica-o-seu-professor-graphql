import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ProfessorsModule } from 'src/professors/professors.module';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment]),
        AuthModule,
        ProfessorsModule,
    ],
    providers: [CommentsResolver, CommentsService],
    exports: [CommentsService, TypeOrmModule],
})
export class CommentsModule {}
