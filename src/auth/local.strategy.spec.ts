import '../__test__/winston';
import { PrismaService } from '../database/prisma.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { errorCodes } from '@src/users/users.constants';
import { UsersService } from '@src/users/users.service';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { AuthServiceMock } from './mocks/auth.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '@src/config/configuration';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let localStrategy: LocalStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        LocalStrategy,
        JwtService,
        UsersService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
        {
          provide: ConfigurationService,
          useValue: ConfigurationServiceMock,
        },
        {
          provide: SmsService,
          useValue: SmsServiceMock,
        },
      ],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should be defined', () => {
    expect(localStrategy).toBeDefined();
  });

  it('should return user if credentials are valid', async () => {
    const user = await localStrategy.validate({
      body: {
        username: 'test',
        password: '123456',
      },
    });
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe('test');
    expect(user.active).toBe(true);
  });

  it('should throw INVALID_USERNAME_PASSWORD error if credentials are invalid', async () => {
    await localStrategy
      .validate({
        body: {
          username: 'test',
          password: 'invalidPass',
        },
      })
      .catch((error) => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe(errorCodes.INVALID_USERNAME_PASSWORD);
        expect(error.status).toBe(401);
      });

    await localStrategy
      .validate({
        body: {
          username: 'invalidUser',
          password: '123456',
        },
      })
      .catch((error) => {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe(errorCodes.INVALID_USERNAME_PASSWORD);
        expect(error.status).toBe(401);
      });
  });

  it('should throw NOT_ACTIVE_USER error if user is inactive', async () => {
    await localStrategy
      .validate({
        body: {
          username: 'test_inactive',
          password: '123456',
        },
      })
      .catch((error) => {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(errorCodes.NOT_ACTIVE_USER);
        expect(error.status).toBe(403);
      });
  });

  it('should return a user if it has an active customer', async () => {
    const user = await localStrategy.validate({
      body: {
        username: 'customer',
        password: '123456',
      },
    });
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe('customer');
    expect(user.active).toBe(true);
    expect(user.customer).toBeDefined();
    expect(user.customer.active).toBe(true);
  });

  it('should throw NOT_ACTIVE_CUSTOMER error if user has an inactive customer', async () => {
    await localStrategy
      .validate({
        body: {
          username: 'customer_inactive',
          password: '123456',
        },
      })
      .catch((error) => {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(errorCodes.NOT_ACTIVE_CUSTOMER);
        expect(error.status).toBe(403);
      });
  });
});
