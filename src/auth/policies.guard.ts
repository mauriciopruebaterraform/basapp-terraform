import { errorCodes, permissionsRoleUser } from '@src/auth/auth.constants';
import { AuthService } from './auth.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICIES_KEY } from './policies.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPolicies = this.reflector.getAllAndOverride<
      string[] | undefined
    >(POLICIES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPolicies || requiredPolicies.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (
      user.role === Role.user &&
      permissionsRoleUser.some((permission) =>
        requiredPolicies.includes(permission),
      )
    ) {
      return true;
    }
    const hasPermission = await this.authService.hasPermission(
      user,
      requiredPolicies,
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: errorCodes.AUTHORIZATION_REQUIRED,
      });
    }

    return hasPermission;
  }
}
