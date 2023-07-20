import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '@src/users/users.service';
import { errorCodes } from '@src/users/users.constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  static key = 'custom';
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {
    super();
  }

  async validate(req: {
    body: {
      username: string;
      password: string;
      customerType?: 'business' | 'government';
    };
  }): Promise<any> {
    const { username, password, customerType } = req.body;

    const user = await this.authService.validateUser(
      username,
      password,
      customerType,
    );
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: errorCodes.INVALID_USERNAME_PASSWORD,
      });
    }
    await this.userService.throwIfUserIsNotValid(user);
    return user;
  }
}
