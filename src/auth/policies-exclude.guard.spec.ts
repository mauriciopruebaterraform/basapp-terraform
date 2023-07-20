import '../__test__/winston';
import { errorCodes } from '@src/auth/auth.constants';
import { AuthService } from './auth.service';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PoliciesExcludeGuard as PoliciesGuard } from './policies-exclude.guard';
import { AuthServiceMock } from './mocks/auth.service';

const ReflectorMock = mockDeep<Reflector>();

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: DeepMockProxy<Reflector>;
  let authService: DeepMockProxy<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        { provide: AuthService, useValue: AuthServiceMock },
        { provide: Reflector, useValue: ReflectorMock },
      ],
    }).compile();
    guard = module.get<PoliciesGuard>(PoliciesGuard);
    authService = module.get(AuthService);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should not check for policies when guard is no defined', () => {
    const executionContext = mockDeep<ExecutionContext>();
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    expect(guard.canActivate(executionContext)).resolves.toBe(true);
  });

  it('should not check for policies when guard is empty array', () => {
    const executionContext = mockDeep<ExecutionContext>();
    // @ts-ignore
    executionContext.switchToHttp.mockImplementationOnce(() => {
      return {
        getRequest: () => {
          return {
            user: {
              role: Role.admin,
            },
          };
        },
      };
    });
    reflector.getAllAndOverride.mockReturnValueOnce([]);
    authService.hasPermission.mockResolvedValueOnce(true);
    expect(guard.canActivate(executionContext)).resolves.toBe(true);
  });

  it('should let it pass if it has permissions', () => {
    const executionContext = mockDeep<ExecutionContext>();
    // @ts-ignore
    executionContext.switchToHttp.mockImplementationOnce(() => {
      return {
        getRequest: () => {
          return {
            user: {
              role: Role.user,
            },
          };
        },
      };
    });
    reflector.getAllAndOverride.mockReturnValueOnce(['a', 'b']);
    authService.hasPermission.mockResolvedValueOnce(true);
    expect(guard.canActivate(executionContext)).resolves.toBe(true);
  });

  it('should not let it pass if it not has permissions', () => {
    const executionContext = mockDeep<ExecutionContext>();
    // @ts-ignore
    executionContext.switchToHttp.mockImplementationOnce(() => {
      return {
        getRequest: () => {
          return {
            user: {
              role: Role.user,
            },
          };
        },
      };
    });
    reflector.getAllAndOverride.mockReturnValueOnce(['a', 'b']);
    authService.hasPermission.mockResolvedValueOnce(false);
    expect(guard.canActivate(executionContext)).rejects.toEqual(
      new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: errorCodes.AUTHORIZATION_REQUIRED,
      }),
    );
  });
});
