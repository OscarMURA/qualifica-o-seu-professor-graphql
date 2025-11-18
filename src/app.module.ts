import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { ProfessorsModule } from './professors/professors.module';
import { SeedModule } from './seed/seed.module';
import { UniversitiesModule } from './universities/universities.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true, //Solo usarla en ambientes bajos, en prod hacer migraciones
    }),
    AuthModule,
    UsersModule,
    UniversitiesModule,
    ProfessorsModule,
    CommentsModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
