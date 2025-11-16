import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupInput } from './dto/signup.input';
import { UsersService } from 'src/users/users.service';
import { AuthReponse } from './types/auth-response.type';
import { LoginInput } from './dto/login.input';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService : JwtService
  ){}
  
   private getJwtToken(payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
  }

  async signup(signupInput: SignupInput): Promise<AuthReponse>{
    const user = await this.userService.create(signupInput);
    const token = this.getJwtToken(
        {id: user.id, 
          email: user.email
        })
    return {
      user,
      token
    };
  }

  async login(loginInput: LoginInput):Promise<AuthReponse>{
    const { email, password} = loginInput;
    const user = await this.userService.findOneByEmail(email);
    if(!user) throw new BadRequestException(`User ${email} not found`);

     if(!bcrypt.compareSync(password, user.password!))
        throw new UnauthorizedException(`Email or password incorrect`);
     
     const token = this.getJwtToken(
        {id: user.id, 
          email: user.email
        })
    return {
      user,
      token
    };
  }

  async validateUser(id: string): Promise<User>{
    const user = await this.userService.findOneById(id);
    if(!user) throw new BadRequestException(`User not found`);
    if(!user.isActive) throw new UnauthorizedException(`User is not active`);
    delete user.password;
    return user;
  }
}
