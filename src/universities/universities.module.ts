import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { University } from './entities/university.entity';
import { UniversitiesResolver } from './universities.resolver';
import { UniversitiesService } from './universities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([University]),
    AuthModule,
  ],
  providers: [UniversitiesResolver, UniversitiesService],
  exports: [UniversitiesService, TypeOrmModule],
})
export class UniversitiesModule {}