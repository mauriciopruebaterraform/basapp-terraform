import '../__test__/winston';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { JwtAuthGuard } from './jwt-auth.guard';

const ReflectorMock = mockDeep<Reflector>();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() => {
    class AuthGuardMock {
      type: string;
      constructor(type) {
        this.type = type;
      }
      async canActivate() {
        return true;
      }
    }

    return AuthGuardMock;
  }),
}));

describe('AuthService', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let reflector: DeepMockProxy<Reflector>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: ReflectorMock },
      ],
    }).compile();

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(jwtAuthGuard).toBeDefined();
  });

  it('should return true if isPublic is present on the execution context', () => {
    const executionContext = mockDeep<ExecutionContext>();
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    expect(jwtAuthGuard.canActivate(executionContext)).toBeTruthy();
  });

  it('should activate if isPublic is not present on the execution context', async () => {
    const executionContext = mockDeep<ExecutionContext>();
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    expect(jwtAuthGuard.canActivate(executionContext)).resolves.toBeTruthy();
  });

  it('should throw custom error if error is provided', () => {
    const user = {
      username: 'test',
      password: 'test',
    };

    expect(() =>
      jwtAuthGuard.handleRequest({ message: 'custom error' }, user, undefined),
    ).toThrow('custom error');
  });

  it('should throw UnauthorizedException if user is not provided', () => {
    expect(() =>
      jwtAuthGuard.handleRequest(undefined, undefined, undefined),
    ).toThrow(UnauthorizedException);
  });

  it('should return user if user is provided', () => {
    const user = {
      username: 'test',
      password: 'test',
    };

    expect(jwtAuthGuard.handleRequest(undefined, user, undefined)).toEqual(
      user,
    );
  });
});
