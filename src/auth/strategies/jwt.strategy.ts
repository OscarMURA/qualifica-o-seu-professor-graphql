import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "src/users/entities/user.entity";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        private readonly authService: AuthService,
        configService:ConfigService
    ){
        super({
            secretOrKey: configService.get('JWT_SECRET') as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }


    async validate(payload: JwtPayload): Promise<User> {
        const {id} = payload;
        const user = await this.authService.validateUser(id);
        return user;
    }
    
}