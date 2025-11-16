import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Comment } from 'src/comments/entities/comment.entity';
import { University } from 'src/universities/entities/university.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('professors')
@ObjectType()
export class Professor {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id: string;

    @Column('text')
    @Field(() => String)
    name: string;

    @Column('text')
    @Field(() => String)
    department: string;

    @ManyToOne(() => University, (university) => university.professors, { eager: true })
    @Field(() => University)
    university: University;

    @OneToMany(() => Comment, (comment) => comment.professor)
    comments?: Comment[];

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    createdAt: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    updatedAt: Date;
}
