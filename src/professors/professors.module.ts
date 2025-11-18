import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UniversitiesModule } from 'src/universities/universities.module';
import { Professor } from './entities/professor.entity';
import { ProfessorsResolver } from './professors.resolver';
import { ProfessorsService } from './professors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Professor]),
    AuthModule,
    UniversitiesModule,
  ],
  providers: [ProfessorsResolver, ProfessorsService],
  exports: [ProfessorsService, TypeOrmModule],
})
export class ProfessorsModule {}