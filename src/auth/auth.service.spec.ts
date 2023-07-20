import '../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Role, User } from '@prisma/client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import configuration from '@src/config/configuration';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { PermissionsServiceMock } from '@src/permissions/mocks/permissions.service';
import { PermissionsService } from '@src/permissions/permissions.service';
import { UsersServiceMock } from '@src/users/mocks/users.service';
import { UsersService } from '@src/users/users.service';
import * as dayjs from 'dayjs';
import { mock } from 'jest-mock-extended';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let permissionsService: PermissionsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [configuration] }),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('jwt.secret'),
            signOptions: { expiresIn: config.get('jwt.expiration') },
          }),
        }),
      ],
      providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: FirebaseService,
          useValue: FirebaseServiceMock,
        },
        {
          provide: UsersService,
          useValue: UsersServiceMock,
        },
        {
          provide: PermissionsService,
          useValue: PermissionsServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    permissionsService = module.get(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate user', () => {
    it('should return a valid user', async () => {
      const username = 'test';
      const password = '123456';
      expect(await service.validateUser(username, password)).toMatchObject({
        id: '1',
        username: 'test',
      });
    });

    it('should return null if user is not found', async () => {
      const username = 'notfound';
      const password = '123456';
      expect(await service.validateUser(username, password)).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const username = 'test';
      const password = '1234567';
      expect(await service.validateUser(username, password)).toBeNull();
    });
  });

  describe('login', () => {
    it('should return a valid JWT token', async () => {
      const user: User = {
        id: '1',
        username: 'test',
        password: '123456',
        firstName: 'Test',
        removed: false,
        removedAt: null,
        lastName: 'User',
        fullName: 'Test User',
        role: Role.user,
        active: true,
        customerId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        lastAccessToMenu: null,
        status: null,
        homeAddress: null,
        workAddress: null,
        idCard: null,
        verificationCode: null,
        lastStateUpdatedTime: null,
        stateUpdatedUserId: null,
        comment: null,
        authorizedUserId: null,
        customerType: null,
        alarmNumber: null,
      };

      const result = await service.login(user);
      expect(result).toBeDefined();
      expect(result.access_token).toEqual(expect.any(String));
      const verified = jwtService.verify(result.access_token);
      expect(verified).toEqual({
        sub: '1',
        username: 'test',
        role: 'user',
        active: true,
        customerId: '1',
        exp: expect.any(Number),
        iat: expect.any(Number),
      });

      const diffInYears = dayjs(verified.exp * 1000).diff(
        verified.iat * 1000,
        'years',
      );

      expect(diffInYears).toEqual(9);
    });

    it('should throw an error if user is undefined', async () => {
      const user = undefined;
      await expect(service.login(user)).rejects.toThrow();
    });
  });

  describe('has permission', () => {
    it('should be true if the user is admin', async () => {
      const user = mock<User>({
        role: Role.admin,
      });

      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeTruthy();
    });

    it('should be true if the user with monitoring role has the permission', async () => {
      const user = mock<User>({
        role: Role.monitoring,
      });
      permissionsService.count.mockResolvedValueOnce(2);
      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeTruthy();
    });

    it('should be false if the user with monitoring role has no permissions', async () => {
      const user = mock<User>({
        role: Role.monitoring,
      });
      permissionsService.count.mockResolvedValueOnce(0);
      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeFalsy();
    });

    it('should be true if the user with statesman role has the permission', async () => {
      const user = mock<User>({
        role: Role.statesman,
      });
      permissionsService.count.mockResolvedValueOnce(2);
      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeTruthy();
    });

    it('should be false if the user with statesman role has no permissions', async () => {
      const user = mock<User>({
        role: Role.statesman,
      });
      permissionsService.count.mockResolvedValueOnce(0);
      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeFalsy();
    });

    it('should be false if the user has user role', async () => {
      const user = mock<User>({
        role: Role.user,
      });
      expect(service.hasPermission(user, ['a', 'b'])).resolves.toBeFalsy();
    });
  });
});
