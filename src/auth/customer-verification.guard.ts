import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KEY } from './customer-verification.decorator';
import { Role } from '@prisma/client';
import { errorCodes } from './auth.constants';

@Injectable()
export class CustomerVerificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<number>(KEY, context.getHandler());
    if (!required) {
      return true;
    }
    const { user, params } = context.switchToHttp().getRequest();
    if (params.customer !== user.customerId && user.role !== Role.admin) {
      throw new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: errorCodes.AUTHORIZATION_REQUIRED,
      });
    }
    return true;
  }
}
