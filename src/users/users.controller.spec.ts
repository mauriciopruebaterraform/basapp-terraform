import '../__test__/winston';
import { UnprocessableEntityException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ConfigModule } from '@nestjs/config';
import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PrismaGirovisionServiceMock,
  PrismaServiceMock,
} from '@src/database/mocks/prisma.service';
import {
  PrismaGirovisionService,
  PrismaService,
} from '@src/database/prisma.service';
import { UsersServiceMock } from './mocks/users.service';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { errorCodes } from './users.constants';
import configuration from '@src/config/configuration';
import { Role, User } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserEntity } from './entities/user.entity';
import { NotificationUser } from './entities/notification-user.entity';
import { DatabaseModule } from '@src/database/database.module';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';
import { JwtModule } from '@nestjs/jwt';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        UsersModule,
        ConfigurationModule,
        JwtModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
      controllers: [UsersController],
    })
      .overrideProvider(ConfigurationService)
      .useValue(ConfigurationServiceMock)
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(PrismaGirovisionService)
      .useValue(PrismaGirovisionServiceMock)
      .overrideProvider(UsersService)
      .useValue(UsersServiceMock)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should check if getMe is defined and returns a user', () => {
    expect(controller.getMe).toBeDefined();

    const userMock = mockDeep<User>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      username: 'user@mail.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: Role.user,
    });

    UsersServiceMock.findOne.mockResolvedValueOnce(userMock);
    const req = {
      user: {
        id: userMock.id,
      },
    };

    expect(controller.getMe(req)).resolves.toEqual(userMock);
    expect(UsersServiceMock.findOne).toHaveBeenCalled();
  });

  it('should check if requestPasswordReset is defined and can send email', async () => {
    expect(controller.requestPasswordReset).toBeDefined();

    const req = {
      username: 'valid@mail.com',
    };
    expect(await controller.requestPasswordReset(req)).toEqual({
      message: 'Password reset email sent',
    });
  });

  it("should check if requestPasswordReset can't send email", async () => {
    const req = {
      username: 'invalid@mail.com',
    };
    expect(controller.requestPasswordReset(req)).rejects.toThrow(
      new InternalServerErrorException(errorCodes.MAIL_DELIVERY_FAILED),
    );
  });

  it('should throw an error if user is not exists', async () => {
    const req = {
      username: 'notfound@mail.com',
    };

    await expect(controller.requestPasswordReset(req)).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('reset password', () => {
    it('should check if resetPassword is defined and can reset password', async () => {
      expect(controller.resetPassword).toBeDefined();
      const req = {
        token: 'token',
        password: 'newpassword',
      };

      expect(await controller.resetPassword(req)).toEqual({
        status: 'success',
        message: 'Password updated',
      });
    });

    it('should throw an error if token is not valid', async () => {
      expect(controller.resetPassword).toBeDefined();
      const req = {
        token: 'invalid_token',
        password: 'newpassword',
      };

      await expect(controller.resetPassword(req)).rejects.toThrow(
        new ForbiddenException({
          statusCode: 403,
          message: errorCodes.INVALID_TOKEN,
        }),
      );
    });

    it('should throw an error if token is expired', async () => {
      expect(controller.resetPassword).toBeDefined();
      const req = {
        token: 'expired_token',
        password: 'newpassword',
      };

      await expect(controller.resetPassword(req)).rejects.toThrow(
        new ForbiddenException({
          statusCode: 403,
          message: errorCodes.EXPIRED_TOKEN,
        }),
      );
    });

    it('should throw an error if user is not valid', async () => {
      expect(controller.resetPassword).toBeDefined();
      const req = {
        token: 'invalid_user',
        password: 'newpassword',
      };

      await expect(controller.resetPassword(req)).rejects.toThrow(
        new ForbiddenException({
          statusCode: 403,
          message: errorCodes.INVALID_USER,
        }),
      );
    });

    it('should change password', async () => {
      expect(controller.updatePassword).toBeDefined();
      const req = {
        user: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };
      service.updatePassword.mockResolvedValueOnce(true);

      expect(
        await controller.updatePassword(
          req,
          'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          body,
        ),
      ).toEqual({ message: 'Password updated', status: 'success' });
    });

    it('should not change password', async () => {
      expect(controller.updatePassword).toBeDefined();
      const req = {
        user: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };
      service.updatePassword.mockResolvedValueOnce(true);

      expect(
        controller.updatePassword(req, 'f3a8f8f8-f3a8-f3a8-f3a8s', body),
      ).rejects.toThrow(
        new ForbiddenException(errorCodes.ONLY_SELF_PASSWORD_UPDATE_ALLOWED),
      );
    });

    it('should not find user', async () => {
      expect(controller.updatePassword).toBeDefined();
      const req = {
        user: {
          id: 'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
        },
      };

      const body = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };
      service.updatePassword.mockRejectedValueOnce(
        new UnauthorizedException({
          statusCode: 404,
          message: errorCodes.USER_NOT_FOUND,
        }),
      );
      expect(
        controller.updatePassword(
          req,
          'f3a8f8f8-f3a8-f3a8-f3a8-f3a8f8f8f8f8',
          body,
        ),
      ).rejects.toThrow(
        new UnauthorizedException({
          statusCode: 404,
          message: errorCodes.USER_NOT_FOUND,
        }),
      );
    });
  });

  describe('list users', () => {
    it('should return a list of users (admin user) ', async () => {
      const users: UserEntity[] = [
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          username: 'Test',
        }),
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
          username: 'Test2',
        }),
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
          username: 'Test3',
        }),
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
          username: 'Test4',
        }),
      ];

      UsersServiceMock.findAll.mockResolvedValueOnce({
        results: users,
        pagination: {
          total: 4,
          size: 4,
          skip: 0,
          take: 10,
        },
      });

      const req = {
        user: {
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          role: Role.admin,
        },
      };

      const { results, pagination } = await controller.findAll(req, {});
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(4);

      results.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('username');
      });

      expect(pagination).toBeDefined();
      expect(pagination).toBeInstanceOf(Object);
      expect(pagination).toEqual({
        size: 4,
        total: 4,
        take: 10,
        skip: 0,
      });

      expect(UsersServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(UsersServiceMock.findAll).toHaveBeenCalledWith({});
    });

    it('should return a list of users (statesman user)', async () => {
      const users: UserEntity[] = [
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          username: 'Test',
        }),
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
          username: 'Test2',
        }),
      ];

      UsersServiceMock.findAll.mockResolvedValueOnce({
        results: users,
        pagination: {
          total: 2,
          size: 2,
          skip: 0,
          take: 10,
        },
      });

      const req = {
        user: {
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          role: Role.statesman,
          customerId: 'customerId',
        },
      };

      const { results, pagination } = await controller.findAll(req, {});
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);

      results.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('username');
      });

      expect(pagination).toBeDefined();
      expect(pagination).toBeInstanceOf(Object);
      expect(pagination).toEqual({
        size: 2,
        total: 2,
        take: 10,
        skip: 0,
      });

      expect(UsersServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(UsersServiceMock.findAll).toHaveBeenCalledWith({
        where: { NOT: [{ customer: null }], customerId: 'customerId' },
      });
    });

    it('should return a list of users (monitoring user)', async () => {
      const users: UserEntity[] = [
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          username: 'Test',
        }),
        new UserEntity({
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
          username: 'Test2',
        }),
      ];

      UsersServiceMock.findAll.mockResolvedValueOnce({
        results: users,
        pagination: {
          total: 2,
          size: 2,
          skip: 0,
          take: 10,
        },
      });

      const req = {
        user: {
          id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          role: Role.monitoring,
          customerId: 'customerId',
        },
      };

      const { results, pagination } = await controller.findAll(req, {});
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);

      results.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('username');
      });

      expect(pagination).toBeDefined();
      expect(pagination).toBeInstanceOf(Object);
      expect(pagination).toEqual({
        size: 2,
        total: 2,
        take: 10,
        skip: 0,
      });

      expect(UsersServiceMock.findAll).toHaveBeenCalledTimes(1);
      expect(UsersServiceMock.findAll).toHaveBeenCalledWith({
        where: { NOT: [{ customer: null }], customerId: 'customerId' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
      };
      // @ts-ignore
      UsersServiceMock.findOne.mockResolvedValueOnce(user);
      const result = await controller.findOne(
        {
          user: {
            customerId: 'it should not matter',
            role: Role.admin,
          },
        },
        '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        {},
      );
      expect(result).toBeDefined();
      expect(result).toEqual(user);
      expect(UsersServiceMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return a user (as statesman user) if customerId matches', async () => {
      const user = {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        customerId: 'customerId',
      };
      // @ts-ignore
      UsersServiceMock.findOne.mockResolvedValueOnce(user);
      const result = await controller.findOne(
        {
          user: {
            customerId: 'customerId',
            role: Role.statesman,
          },
        },
        '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        {},
      );
      expect(result).toBeDefined();
      expect(result).toEqual(user);
      expect(UsersServiceMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if user not found', async () => {
      // @ts-ignore
      UsersServiceMock.findOne.mockResolvedValueOnce(null);
      expect(
        controller.findOne(
          {
            user: {
              customerId: 'customerId',
            },
          },
          '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          {},
        ),
      ).rejects.toThrow(NotFoundException);
      expect(UsersServiceMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if user is found (as statesman user) but customerId does not match', async () => {
      // @ts-ignore
      UsersServiceMock.findOne.mockResolvedValueOnce({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        customerId: 'customerId2',
      });
      expect(
        controller.findOne(
          {
            user: {
              customerId: 'customerId',
              role: Role.statesman,
            },
          },
          '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
          {},
        ),
      ).rejects.toThrow(NotFoundException);
      expect(UsersServiceMock.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('create user', () => {
    it('should create a customer', async () => {
      expect(controller.create).toBeDefined();

      const userData = mockDeep<CreateUserDto>({
        username: 'Test',
        password: 'password',
        firstName: 'Test',
        lastName: 'Test',
      });
      const user = mockDeep<User>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        firstName: 'Test',
        lastName: 'Test',
      });
      UsersServiceMock.create.mockResolvedValueOnce(user);

      const result = await controller.create(
        {
          user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
        },
        userData,
      );

      expect(result).toMatchObject({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    });
  });

  describe('update user', () => {
    it('should update a user', async () => {
      expect(controller.update).toBeDefined();

      const userData = mockDeep<UpdateUserDto>({
        username: 'Test',
        password: 'password',
        firstName: 'Test',
        lastName: 'Test',
      });
      const user = mockDeep<User & { access_token: string }>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        firstName: 'Test',
        lastName: 'Test',
      });
      UsersServiceMock.update.mockResolvedValueOnce(user);

      const result = await controller.update(
        {
          user: { id: 'b0273fda-1977-469e-b376-6b49cceb0a6f' },
        },
        user.id,
        userData,
      );

      expect(result).toMatchObject({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      expect(UsersServiceMock.update).toHaveBeenCalledTimes(1);
    });

    it('should throw trying to update self', async () => {
      expect(controller.update).toBeDefined();

      const userData = mockDeep<UpdateUserDto>({
        username: 'Test',
        password: 'password',
        firstName: 'Test',
        lastName: 'Test',
      });
      const user = mockDeep<User & { access_token: string }>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        firstName: 'Test',
        lastName: 'Test',
      });
      UsersServiceMock.update.mockResolvedValueOnce(user);

      await expect(
        controller.update(
          {
            user: { id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8' },
          },
          user.id,
          userData,
        ),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.USER_CANNOT_UPDATE_SELF),
      );
    });

    it('should throw trying to upgrade to admin (as statesman user)', async () => {
      expect(controller.update).toBeDefined();

      const userData = mockDeep<UpdateUserDto>({
        username: 'Test',
        password: 'password',
        firstName: 'Test',
        lastName: 'Test',
        role: Role.admin,
      });
      const user = mockDeep<User & { access_token: string }>({
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        username: 'Test',
        firstName: 'Test',
        lastName: 'Test',
      });
      UsersServiceMock.update.mockResolvedValueOnce(user);

      await expect(
        controller.update(
          {
            user: {
              id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
              role: Role.statesman,
            },
          },
          user.id,
          userData,
        ),
      ).rejects.toThrow(
        new UnprocessableEntityException(errorCodes.INVALID_USER_ROLE),
      );
    });
  });

  describe('notification', () => {
    it('list notification', async () => {
      const mockList: NotificationUser[] = mockDeep<NotificationUser[]>([
        {
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
        },
        {
          read: false,
          notification: {
            title: 'Ud. tiene una visita esperando en la casa',
            description:
              'RAPPI se encuentra esperando en la casa. Por favor ingrese a Basapp CyB para autorizarlo.',
            emergency: false,
            image: null,
            locationId: null,
            fromLot: null,
            authorizationRequestId: null,
            toLot: null,
            notificationType: 'authorization',
          },
        },
      ]);

      service.findAllNotifications.mockResolvedValueOnce({
        results: mockList,
        pagination: {
          total: 2,
          size: 2,
          skip: 0,
          take: 10,
        },
      });

      const { results, pagination } = await controller.findAllNotifications(
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        {},
      );
      expect(results).toBeDefined();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);

      results.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('read');
        expect(item).toHaveProperty('userId');
        expect(item).toHaveProperty('notificationId');
        expect(item).toHaveProperty('notification');
        expect(item.notification).toHaveProperty('id');
        expect(item.notification).toHaveProperty('title');
        expect(item.notification).toHaveProperty('description');
        expect(item.notification).toHaveProperty('image');
        expect(item.notification).toHaveProperty('userId');
        expect(item.notification).toHaveProperty('customerId');
        expect(item.notification).toHaveProperty('authorizationRequestId');
        expect(item.notification).toHaveProperty('locationId');
        expect(item.notification).toHaveProperty('emergency');
        expect(item.notification).toHaveProperty('createdAt');
        expect(item.notification).toHaveProperty('sendAt');
        expect(item.notification).toHaveProperty('fromLot');
        expect(item.notification).toHaveProperty('toLot');
      });

      expect(pagination).toBeDefined();
      expect(pagination).toBeInstanceOf(Object);
      expect(pagination).toEqual({
        size: mockList.length,
        total: mockList.length,
        take: 10,
        skip: 0,
      });
    });
  });
});
