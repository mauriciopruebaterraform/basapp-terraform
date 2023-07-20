import { errorCodes } from '@src/auth/auth.constants';
import { AuthService } from './auth.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICIES_KEY } from './policies-exclude.decorator';

@Injectable()
export class PoliciesExcludeGuard implements CanActivate {
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

    const hasPermission = await this.authService.hasPermission(
      user,
      requiredPolicies,
      true,
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
