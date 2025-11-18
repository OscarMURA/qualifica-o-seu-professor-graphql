import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth/auth.decorator';
import { CurrentUser } from './decorators/current-user/current-user.decorator';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { AuthReponse } from './types/auth-response.type';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthReponse, { name: 'signup' })
  signup(@Args('signupInput') signupInput: SignupInput) {
    return this.authService.signup(signupInput);
  }

  @Mutation(() => AuthReponse, { name: 'login' })
  login(@Args('loginInput') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }

  @Query(() => User, { name: 'me' })
  @Auth()
  me(@CurrentUser() user: User): User {
    return user;
  }
}