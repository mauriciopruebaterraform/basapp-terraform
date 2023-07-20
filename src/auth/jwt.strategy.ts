import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { IRequestUser, ITokenPayload } from '@src/interfaces/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  validate(payload: ITokenPayload): IRequestUser {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      customerId: payload.customerId,
      active: payload.active,
    };
  }
}
