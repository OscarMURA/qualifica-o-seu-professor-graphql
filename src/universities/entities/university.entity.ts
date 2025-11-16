import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Professor } from 'src/professors/entities/professor.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('universities')
@ObjectType()
export class University {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id: string;

    @Column('text')
    @Field(() => String)
    name: string;

    @Column('text')
    @Field(() => String)
    location: string;

    @OneToMany(() => Professor, (professor) => professor.university)
    professors?: Professor[];

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    createdAt: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    updatedAt: Date;
}
