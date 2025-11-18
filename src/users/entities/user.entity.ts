import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ValidRoles } from "src/auth/enums/valid-roles.enum";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
@ObjectType()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id: string;

    @Column({
        type: 'text',
        unique: true
    })
    @Field(() => String)
    email: string;

    @Column('text')
    @Field(() => String)
    fullName: string;

    @Column('text', { select: false })
    password?: string;

    @Column('bool', { default: true })
    @Field(() => Boolean)
    isActive: boolean;

    @Column({
        type: 'text',
        array: true,
        default: [ValidRoles.student]
    })
    @Field(() => [String])
    roles: string[];

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    createdAt: Date;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    @Field(() => Date)
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    checkFieldsBeforeChanges() {
        this.email = this.email.toLowerCase().trim();
    }
}
