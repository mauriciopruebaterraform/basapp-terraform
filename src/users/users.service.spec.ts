import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { UsersService } from './users.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import * as dayjs from 'dayjs';
import {
  Customer,
  Role,
  User,
  PasswordRecoveryToken,
  EventType,
} from '@prisma/client';
import { errorCodes } from './users.constants';
import {
  ForbiddenException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@src/config/configuration';
import * as bcrypt from 'bcryptjs';
import { IUserWithCustomer } from '@src/interfaces/types';
import { mockDeep } from 'jest-mock-extended';
import { CreateUserDto } from './dto/create-user.dto';
import { User as UserEntity } from './entities/user.entity';
import { plainToClass } from 'class-transformer';
import { NotificationUser } from './entities/notification-user.entity';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';
import { JwtService } from '@nestjs/jwt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaServiceMock;
  let mailer: ConfigurationServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [
        UsersService,
        JwtService,
        {
          provide: ConfigurationService,
          useValue: ConfigurationServiceMock,
        },
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
        {
          provide: SmsService,
          useValue: SmsServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    mailer = module.get(ConfigurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find one user by id', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: '1',
      username: 'test',
      password: '12345',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      removed: false,
      removedAt: null,
      customerId: null,
      lot: null,
      image: null,
      updatedById: null,
      pushId: null,
      emergencyNumber: null,
      alarmNumber: null,
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
    });
    const result = await service.findById('1');
    expect(result).toMatchObject({
      id: '1',
      username: 'test',
      password: '12345',
      role: 'admin',
      active: true,
      customerId: null,
    });
  });

  it('should return null if user not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const result = await service.findById('1');
    expect(result).toBeNull();
  });

  it('should find one user by username', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({
      id: '1',
      username: 'test',
      password: '12345',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      removed: false,
      removedAt: null,
      updatedAt: new Date(),
      customerId: null,
      lot: null,
      image: null,
      updatedById: null,
      pushId: null,
      emergencyNumber: null,
      alarmNumber: null,
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
    });
    const result = await service.findByUsername('test');
    expect(result).toMatchObject({
      id: '1',
      username: 'test',
      password: '12345',
      role: 'admin',
      active: true,
      customerId: null,
    });
  });

  it('should return null if user not found by username', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    const result = await service.findByUsername('test');
    expect(result).toBeNull();
  });

  it('should generate a password reset token and expiry date', async () => {
    const now = new Date();
    const result = service.generatePasswordResetToken();
    expect(result).toMatchObject({
      token: expect.any(String),
      expires: expect.any(Date),
    });

    const token = result.token;
    const expires = result.expires;
    expect(token).toHaveLength(64);
    expect(dayjs(expires).diff(now, 'seconds')).toBe(60 * 60 * 24);
  });

  describe('test send reset password email', () => {
    it('should send an email with the reset token', async () => {
      const user: IUserWithCustomer = {
        id: '1',
        removed: false,
        removedAt: null,
        username: 'test',
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: null,
        customer: null,
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };
      const token = 'hash';
      const result = service.sendResetPasswordEmail(user, token);

      expect(mailer.subscriptionMail).toHaveBeenCalledWith(
        'send-reset-password-email-topic',
        expect.objectContaining({
          username: user.username,
          fullName: user.fullName,
          token,
          customerType: '',
        }),
      );
      expect(result).toBeTruthy();
    });
  });

  describe('test request password reset', () => {
    it('should return error if user not found', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.requestPasswordReset('test')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update the password reset token and expiry date', async () => {
      const user: User = {
        id: '1',
        removed: false,
        removedAt: null,
        username: 'test',
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: '1',
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };
      prisma.user.findFirst.mockResolvedValueOnce(user);
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce({
        id: '1',
        userId: user.id,
        createdAt: new Date(),
        token: 'aPasswordToken',
        expiresAt: new Date(),
      });
      const sendResetPasswordEmailSpy = jest.spyOn(
        service,
        'sendResetPasswordEmail',
      );
      await service.requestPasswordReset(user.username);
      expect(prisma.passwordRecoveryToken.upsert).toHaveBeenCalled();
      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          username: user.username,
        }),
        'aPasswordToken',
      );

      sendResetPasswordEmailSpy.mockRestore();
    });
  });

  describe('test send welcome email', () => {
    it('should send an email with the password token', async () => {
      const user: IUserWithCustomer = {
        id: '1',
        username: 'test',
        removed: false,
        removedAt: null,
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: null,
        customer: null,
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };
      const token = 'hash';
      const result = service.sendWelcomeEmail(user, token);

      expect(mailer.subscriptionMail).toHaveBeenCalledWith(
        'send-welcome-email-topic',
        expect.objectContaining({
          username: user.username,
          fullName: user.fullName,
          token,
          customerType: '',
        }),
      );
      expect(result).toBeTruthy();
    });
  });

  describe('test throwIfUserIsNotValid method', () => {
    it('should throw an error if user is not active', async () => {
      const user: IUserWithCustomer = {
        id: '1',
        username: 'test',
        removed: false,
        removedAt: null,
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: null,
        customer: null,
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };

      await expect(
        async () => await service.throwIfUserIsNotValid(user),
      ).rejects.toThrow(
        new ForbiddenException({
          status: 403,
          message: errorCodes.NOT_ACTIVE_USER,
        }),
      );
    });

    it('should throw an error if user has an inactive customer', async () => {
      const user: IUserWithCustomer = {
        id: '1',
        username: 'test',
        password: '12345',
        removed: false,
        removedAt: null,
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        customerId: '1',
        customer: mockDeep<Customer>({ active: false }),
        createdAt: new Date(),
        updatedAt: new Date(),
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
        customerType: 'business',
      };
      await expect(
        async () => await service.throwIfUserIsNotValid(user),
      ).rejects.toThrow(
        new ForbiddenException({
          status: 403,
          message: errorCodes.NOT_ACTIVE_CUSTOMER,
        }),
      );
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reset password successfully', async () => {
      const user: User = {
        id: '1',
        username: 'test',
        removed: false,
        removedAt: null,
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: null,
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };
      const token = 'hash';
      const newPassword = 'newPassword';
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.passwordRecoveryToken.findFirst.mockResolvedValueOnce({
        id: '1',
        userId: user.id,
        createdAt: new Date(),
        token,
        expiresAt: dayjs().add(1, 'day').toDate(),
      });
      const result = await service.resetPasswordWithToken(token, newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: user.id,
        },
        data: {
          password: expect.any(String),
        },
      });

      // test token delete
      expect(prisma.passwordRecoveryToken.delete).toHaveBeenCalledWith({
        where: {
          id: '1',
        },
      });

      expect(result).toBeTruthy();
    });

    it('should throw an error if token is not valid', async () => {
      const token = 'invalidToken';
      prisma.passwordRecoveryToken.findFirst.mockResolvedValueOnce(null);

      await expect(
        async () => await service.resetPasswordWithToken(token, 'newPassword'),
      ).rejects.toThrow(
        new ForbiddenException({
          status: 403,
          message: errorCodes.INVALID_TOKEN,
        }),
      );
    });

    it('should throw an error if token is expired', async () => {
      const token = 'expiredToken';

      prisma.passwordRecoveryToken.findFirst.mockResolvedValueOnce({
        id: '1',
        userId: '1',
        createdAt: new Date(),
        token: token,
        expiresAt: new Date(new Date().getTime() - 1000),
      });

      await expect(
        async () => await service.resetPasswordWithToken(token, 'newPassword'),
      ).rejects.toThrow(
        new ForbiddenException({
          status: 403,
          message: errorCodes.EXPIRED_TOKEN,
        }),
      );
    });

    it('should throw an error if user is invalid', async () => {
      const token = 'validToken';

      prisma.passwordRecoveryToken.findFirst.mockResolvedValueOnce({
        id: '1',
        userId: '1',
        createdAt: new Date(),
        token: token,
        expiresAt: new Date(new Date().getTime() + 1000),
      });

      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        async () => await service.resetPasswordWithToken(token, 'newPassword'),
      ).rejects.toThrow(
        new ForbiddenException({
          status: 403,
          message: errorCodes.INVALID_USER,
        }),
      );
    });
  });

  describe('createPasswordRecoveryToken', () => {
    it('should create password recovery token successfully', async () => {
      const user: User = {
        id: '1',
        username: 'test',
        password: '12345',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.admin,
        active: true,
        removed: false,
        removedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerId: null,
        lot: null,
        image: null,
        updatedById: null,
        pushId: null,
        emergencyNumber: null,
        alarmNumber: null,
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
      };
      await service.createPasswordRecoveryToken(user);
      expect(prisma.passwordRecoveryToken.upsert).toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'password';
      const result = await service.hashPassword(password);
      expect(typeof result).toBe('string');

      const compareResult = await bcrypt.compare(password, result);
      expect(compareResult).toBeTruthy();
    });
  });

  describe('list users', () => {
    it('should list users', async () => {
      const userMock = plainToClass(UserEntity, {
        username: 'test@mail.com',
      });

      const userMock2 = plainToClass(UserEntity, {
        username: 'test2@mail.com',
      });

      const users = [userMock, userMock2];

      prisma.user.findMany.mockResolvedValueOnce(users);
      prisma.user.count.mockResolvedValueOnce(2);
      const { results, pagination } = await service.findAll({});
      expect(results).toEqual(users);
      expect(pagination).toEqual({
        total: 2,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 2,
      });
    });
  });

  describe('create user', () => {
    it('should create user successfully', async () => {
      const data = {
        username: 'test2@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
      };

      const userMock = mockDeep<User>({
        username: 'test@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });

      prisma.user.create.mockResolvedValueOnce(userMock);

      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';
      const sendWelcomeEmailSpy = jest.spyOn(service, 'sendWelcomeEmail');
      const result = await service.create({ ...data, updatedById: userId });

      sendWelcomeEmailSpy.mockReturnValue(true);
      expect(sendWelcomeEmailSpy).toHaveBeenCalled();
      expect(sendWelcomeEmailSpy).toHaveBeenCalledWith(
        userMock,
        recoveryToken.token,
      );

      expect(result).toMatchObject({
        username: 'test@mail.com',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });
    });

    it('should create user successfully with a customer Id', async () => {
      const data = {
        username: 'test2@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        customerId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      };

      const userMock = mockDeep<IUserWithCustomer>({
        username: 'test@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        customer: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
        active: true,
      });
      prisma.customer.findUnique.mockResolvedValueOnce(
        mockDeep<Customer>({
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        }),
      );
      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';
      const result = await service.create({ ...data, updatedById: userId });
      expect(result).toEqual(plainToClass(UserEntity, userMock));
    });

    it('should create user if permission authorizationEventTypeId is provided', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          authorizationEventTypeId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      const userMock = mockDeep<User>({
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });

      const eventTypeMock = mockDeep<EventType>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        code: 'test',
        title: 'test',
        active: true,
      });
      prisma.eventType.findUnique.mockResolvedValueOnce(eventTypeMock);

      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);
      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';
      const result = await service.create({ ...data, updatedById: userId });
      expect(result).toEqual(plainToClass(UserEntity, userMock));
    });

    it('should create a user with a system generated password', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
      };

      const userMock = mockDeep<User>({
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });

      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';
      const result = await service.create({ ...data, updatedById: userId });

      expect(result).toEqual(plainToClass(UserEntity, userMock));

      expect(prisma.user.create).toBeCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'user@mail.com',
            password: expect.any(String),
            firstName: 'test',
            lastName: 'test',
            fullName: 'test test',
            role: Role.user,
          }),
        }),
      );

      expect(prisma.user.create).toBeCalledTimes(1);
    });

    it('should create user if permission visitorsEventTypeId is provided', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          visitorsEventTypeId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      const userMock = mockDeep<User>({
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });
      const eventTypeMock = mockDeep<EventType>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        code: 'test',
        title: 'test',
        active: true,
      });
      prisma.eventType.findUnique.mockResolvedValueOnce(eventTypeMock);

      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);
      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';
      const result = await service.create({ ...data, updatedById: userId });
      expect(result).toEqual(plainToClass(UserEntity, userMock));
    });

    it('should create user if one monitoringEventTypes id is provided', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          monitoringEventTypes: ['f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8'],
        },
      };

      const userMock = mockDeep<User>({
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });
      const eventTypeMock = mockDeep<EventType>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        code: 'test',
        title: 'test',
        active: true,
      });
      prisma.eventType.findUnique.mockResolvedValueOnce(eventTypeMock);

      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';

      const result = await service.create({ ...data, updatedById: userId });
      expect(result).toEqual(plainToClass(UserEntity, userMock));
    });

    it('should create user if multiple monitoringAlertTypes ids are provided', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          monitoringAlertTypes: ['f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8'],
        },
      };

      const userMock = mockDeep<User>({
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      });

      prisma.alertType.findUnique.mockResolvedValueOnce({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        type: 'test',
        name: 'test',
      });

      prisma.user.create.mockResolvedValueOnce(userMock);
      const recoveryToken = mockDeep<PasswordRecoveryToken>({ token: 'token' });
      prisma.passwordRecoveryToken.upsert.mockResolvedValueOnce(recoveryToken);

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';

      const result = await service.create({ ...data, updatedById: userId });
      expect(result).toEqual(plainToClass(UserEntity, userMock));
    });

    it('should fail if username already exists', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      });

      const userId = 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8';

      await expect(
        async () => await service.create({ ...data, updatedById: userId }),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.USERNAME_ALREADY_TAKEN),
      );
    });

    it('should fail create user if customer Id does not exist', async () => {
      const data = {
        username: 'test@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        customerId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      };

      prisma.customer.findUnique.mockResolvedValueOnce(null);

      await expect(
        async () =>
          await service.create({
            ...data,
            updatedById: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_CUSTOMER,
        }),
      );

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail create user if permission authorizationEventTypeId Id does not exist', async () => {
      const data: CreateUserDto = {
        username: 'test@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          authorizationEventTypeId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };
      prisma.eventType.findUnique.mockResolvedValueOnce(null);
      await expect(
        async () =>
          await service.create({
            ...data,
            updatedById: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_EVENT_TYPE,
        }),
      );
      expect(prisma.eventType.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail create user if permission visitorsEventTypeId Id does not exist', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          visitorsEventTypeId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      prisma.eventType.findUnique.mockResolvedValueOnce(null);
      await expect(
        async () =>
          await service.create({
            ...data,
            updatedById: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_EVENT_TYPE,
        }),
      );

      expect(prisma.eventType.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail create user if one monitoringEventTypes id does not exist', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          monitoringEventTypes: ['f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8'],
        },
      };

      prisma.eventType.findUnique.mockResolvedValueOnce(null);
      await expect(
        async () =>
          await service.create({
            ...data,
            updatedById: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_EVENT_TYPE,
        }),
      );

      expect(prisma.eventType.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail create user if one monitoringAlertTypes id does not exist', async () => {
      const data: CreateUserDto = {
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        role: Role.user,
        permissions: {
          monitoringAlertTypes: ['f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8'],
        },
      };
      prisma.alertType.count.mockResolvedValueOnce(0);
      await expect(
        async () =>
          await service.create({
            ...data,
            updatedById: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          }),
      ).rejects.toThrow(
        new UnprocessableEntityException({
          statusCode: 422,
          message: errorCodes.INVALID_ALERT_TYPE,
        }),
      );

      expect(prisma.alertType.count).toHaveBeenCalledWith({
        where: { OR: [{ id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8' }] },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('find one', () => {
    it('should return a user', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const user: User = {
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        username: 'user@mail.com',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
      };

      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.findOne(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      );

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.findOne(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
      );

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return a user with customer', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const user: User = {
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        username: 'user@mail.com',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        customer: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          name: 'test',
        },
      };

      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.findOne(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        {
          include: {
            customer: true,
          },
        },
      );

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
        include: {
          customer: true,
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should select a field', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const user: User = {
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        firstName: 'test',
      };

      prisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.findOne(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        {
          select: {
            id: true,
            firstName: true,
          },
        },
      );

      expect(result).toEqual({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        firstName: 'test',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
        select: {
          id: true,
          firstName: true,
        },
      });
    });
  });

  describe('update password', () => {
    it('should update password', async () => {
      const user = mockDeep<User>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        password: bcrypt.hashSync('oldPassword', 10),
      });

      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };
      const result = await service.updatePassword(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        body,
      );

      expect(result).toBe(true);
    });

    it('should not update', async () => {
      const user = mockDeep<User>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        password: bcrypt.hashSync('differentPassword', 10),
      });

      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };

      expect(
        service.updatePassword('f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8', body),
      ).rejects.toThrow(
        new UnauthorizedException(errorCodes.PASSWORDS_DONT_MATCH),
      );
    });

    it('should not find user to update', async () => {
      prisma.user.findUnique.mockRejectedValueOnce(
        new UnauthorizedException({
          statusCode: 404,
          message: errorCodes.USER_NOT_FOUND,
        }),
      );

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };

      expect(
        service.updatePassword('f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8', body),
      ).rejects.toThrow(
        new UnauthorizedException({
          statusCode: 404,
          message: errorCodes.USER_NOT_FOUND,
        }),
      );
    });
  });
  describe('update user', () => {
    it('should update a user', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const user: User = {
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        username: 'user@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        customerId: 'e4c09cce-8a6d-433e-acdd-27118d65fb14',
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const updatedBy: User = {
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f9',
        username: 'modifier@mail.com',
        password: 'password',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        customerId: 'e4c09cce-8a6d-433e-acdd-27118d65fb14',
      };

      prisma.customer.findUnique.mockResolvedValueOnce(
        mockDeep<Customer>({
          id: 'e4c09cce-8a6d-433e-acdd-27118d65fb14',
        }),
      );
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      prisma.user.findUnique.mockResolvedValueOnce(updatedBy);

      const result = await service.update(
        'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        {
          firstName: 'test2',
          updatedById: updatedBy.id,
          reqUserCustomerId: 'e4c09cce-8a6d-433e-acdd-27118d65fb14',
        },
      );

      expect(result).toEqual(plainToClass(UserEntity, user));
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
        data: expect.objectContaining({
          firstName: 'test2',
          updatedBy: {
            connect: {
              id: updatedBy.id,
            },
          },
        }),
        include: {
          userPermissions: {
            include: {
              authorizationEventType: true,
              visitorsEventType: true,
              monitoringEventTypes: true,
              monitoringAlertTypes: true,
              monitoringCustomers: true,
            },
          },
        },
      });

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('notification', () => {
    it('list notification', async () => {
      const user = mockDeep<User>({
        id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        username: '541166480626',
        firstName: 'test',
        lastName: 'test',
        fullName: 'test test',
        role: Role.user,
        active: true,
        customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
      });
      const mock = mockDeep<NotificationUser>({
        read: false,
        notification: {
          title: 'Ud. tiene una visita esperando en la guardia',
          description:
            'PEDIDOS YA se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
          emergency: false,
          fromLot: null,
          toLot: null,
          image: null,
          locationId: null,
          notificationType: 'authorization',
        },
      });

      prisma.notificationUser.findMany.mockResolvedValueOnce([mock]);
      prisma.notificationUser.count.mockResolvedValueOnce(1);
      prisma.user.findFirst.mockResolvedValueOnce({
        ...user,
      });
      const { results, pagination } = await service.findAllNotifications(
        {
          where: {
            userId: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          },
        },
        '0589141d-ef1c-4c39-a8c7-30aef555003f',
      );
      expect(results).toEqual([mock]);
      expect(pagination).toEqual({
        total: 1,
        take: 100,
        skip: 0,
        hasMore: false,
        size: 1,
      });
    });
  });
});
