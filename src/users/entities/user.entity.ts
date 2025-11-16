import { Field, ID, ObjectType } from "@nestjs/graphql";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @Field(() => ID)
    id:string;

    @Column({
        type: 'text',
        unique: true
    })
    @Field(() => String)
    email:string;

    @Column('text')
    @Field(() => String)
    fullName:string;

    @Column('text')
    @Field(() => String)
    password?:string;

    @Column('bool', {default: true})
    @Field(() => Boolean)
    isActive: boolean;

    @Column({
        type: 'text',
        array: true,
        default: ['teacher']
    })
    @Field(() => [String])
    roles: string[];

    @BeforeInsert()
    @BeforeUpdate()
    checkFieldsBeforeChanges(){
        this.email = this.email.toLowerCase().trim();
    }
}
