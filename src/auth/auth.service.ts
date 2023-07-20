import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { IAccessToken, IRequestUser } from '@src/interfaces/types';
import { PermissionsService } from '@src/permissions/permissions.service';
import { errorCodes } from './auth.constants';
import { omit } from 'lodash';
import { FirebaseService } from '@src/firebase/firebase.service';
import { PrismaService } from '@src/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
    customerType?: 'business' | 'government',
  ) {
    const user = await this.usersService.findByUsername(username, customerType);
    if (user) {
      if (await compare(pass, user.password)) {
        const result = omit(user, 'password');
        return result;
      }
    }
    return null;
  }

  async login(user?: User): Promise<IAccessToken> {
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: errorCodes.AUTHORIZATION_REQUIRED,
      });
    }
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      active: user.active,
      customerId: user.customerId,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
    };
  }

  async firebaseToken(requestUser: IRequestUser) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: requestUser.id,
      },
      include: {
        userPermissions: {
          include: {
            monitoringCustomers: true,
          },
        },
      },
    });

    if (!user) {
      throw new InternalServerErrorException();
    }

    const customerIds =
      user.userPermissions?.monitoringCustomers.map((i) => i.customerId) || [];

    const firebaseToken = await this.firebaseService.createCustomToken(
      user.id,
      {
        username: user.username,
        role: user.role,
        active: user.active,
        customerId: user.customerId || '',
        customerIds,
      },
    );

    return { firebaseToken };
  }

  async hasPermission(
    user: User,
    permissions: string[],
    excludeFinalUser = false,
  ): Promise<boolean> {
    if (user.role === Role.admin) {
      return true;
    }
    if (user.role === Role.monitoring || user.role === Role.statesman) {
      const count = await this.permissionsService.count({
        where: {
          action: {
            in: permissions,
          },
          [user.role]: true,
        },
      });
      if (count > 0) {
        return true;
      }

      return false;
    }

    // if the user has a user role, should be implemented later.
    return excludeFinalUser;
  }
}
