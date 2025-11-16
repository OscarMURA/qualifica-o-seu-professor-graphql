import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Professor } from 'src/professors/entities/professor.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('comments')
@ObjectType()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id: string;

    @Column('text')
    @Field(() => String)
    content: string;

    @Column('int')
    @Field(() => Int)
    rating: number;

    @ManyToOne(() => Professor, (professor) => professor.comments, { eager: true })
    @Field(() => Professor)
    professor: Professor;

    @ManyToOne(() => User, { eager: true })
    @Field(() => User)
    student: User;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    createdAt: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    updatedAt: Date;
}
