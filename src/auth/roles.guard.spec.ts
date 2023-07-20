import '../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { errorCodes } from './auth.constants';

const ReflectorMock = mockDeep<Reflector>();

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: DeepMockProxy<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: ReflectorMock }],
    }).compile();
    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should not check for roles', () => {
    const executionContext = mockDeep<ExecutionContext>();
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('should check if the role is matching and let it pass', () => {
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
    reflector.getAllAndOverride.mockReturnValueOnce([Role.admin]);
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('should check if the role is matching and not let it pass', () => {
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
    reflector.getAllAndOverride.mockReturnValueOnce([Role.admin]);
    expect(() => guard.canActivate(executionContext)).toThrow(
      new ForbiddenException({
        error: 'Forbidden',
        statusCode: 403,
        message: errorCodes.AUTHORIZATION_REQUIRED,
      }),
    );
  });

  it('should check for multiple roles are matching and let it pass', () => {
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
    reflector.getAllAndOverride.mockReturnValueOnce([Role.user, Role.admin]);
    expect(guard.canActivate(executionContext)).toBe(true);
  });

  it('should check for empty roles and let it pass', () => {
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
    reflector.getAllAndOverride.mockReturnValueOnce([]);
    expect(guard.canActivate(executionContext)).toBe(true);
  });
});
