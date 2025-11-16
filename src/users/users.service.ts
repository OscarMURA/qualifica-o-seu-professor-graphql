import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SignupInput } from 'src/auth/dto/signup.input';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

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

  async findOneById(id: string) {
    try{
      return await this.userRepository.findOneByOrFail({id});
    }catch(error){
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  async findOneByEmail(email: string) {
    try{
      return await this.userRepository.findOneByOrFail({email});
    }catch(error){
      throw new NotFoundException(`User ${email} not found`);
    }
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
