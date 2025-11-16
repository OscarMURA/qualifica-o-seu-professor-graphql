import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { SignupInput } from 'src/auth/dto/signup.input';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {

  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const adminEmail = 'admin@example.com';
    
    try {
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail }
      });

      if (existingAdmin) {
        this.logger.log('✅ Default admin user exists');
        return;
      }

      const defaultAdmin = this.userRepository.create({
        email: adminEmail,
        fullName: 'System Administrator',
        password: bcrypt.hashSync('admin123', 10),
        roles: [ValidRoles.admin],
        isActive: true,
      });

      await this.userRepository.save(defaultAdmin);
      this.logger.log('✅ Default admin user created successfully');
      this.logger.log(`   📧 Email: ${adminEmail}`);
      this.logger.log(`   🔑 Password: admin123`);
    } catch (error) {
      this.logger.error('❌ Failed to create default admin user', error);
    }
  }

  async create(signupInput: SignupInput): Promise<User> {
    try{
      const newUser = this.userRepository.create(
        {
          ...signupInput,
          password: bcrypt.hashSync(signupInput.password, 10)
        }
      );
      return await this.userRepository.save(newUser);
      
    }catch(error){
      this.handleExceptions(error);
    }
  }

  async createUser(createUserInput: CreateUserInput): Promise<User> {
    try {
      const newUser = this.userRepository.create({
        ...createUserInput,
        password: bcrypt.hashSync(createUserInput.password, 10),
      });
      return await this.userRepository.save(newUser);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneById(id: string) {
    try{
      return await this.userRepository.findOneByOrFail({id});
    }catch(error){
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  async findOneByEmail(email: string) {
    try{
      return await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'fullName', 'password', 'isActive', 'roles', 'createdAt', 'updatedAt'],
      });
    }catch(error){
      throw new NotFoundException(`User ${email} not found`);
    }
  }

  async update(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    if (updateUserInput.password) {
      updateUserInput.password = bcrypt.hashSync(updateUserInput.password, 10);
    }

    const user = await this.userRepository.preload({
      id,
      ...updateUserInput,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string): Promise<User> {
    const user = await this.findOneById(id);
    const removedUser = { ...user };
    await this.userRepository.remove(user);
    return removedUser as User;
  }

  private handleExceptions(error: any): never{
    if(error.code === '23505'){
      throw new BadRequestException(error.detail.replace('key', ''));
    }
    if(error.code === 'error-001'){
      throw new BadRequestException(error.detail.replace('key', ''));
    }
    throw new InternalServerErrorException('Please check server logs');
  }


}
