import { CreateUserDto } from './../src/users/dto/create-user.dto';
import { errorCodes, notificationUsers } from './../src/users/users.constants';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '@src/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UsersModule } from '@src/users/users.module';
import { AuthModule } from '@src/auth/auth.module';
import { AppModule } from '@src/app.module';
import { Role, CustomerType, Prisma } from '@prisma/client';
import { FakeCustomer } from './fakes/customer.fake';
import {
  createAdminUser,
  createAdminUserAndToken,
  createFinalUserAndToken,
  createStatesmanUserAndToken,
  createMonitoringUserAndToken,
  createUserAndToken,
  createUserToken,
  createFinalUser,
  createStatesmanUser,
} from './utils/users';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { UpdateUserDto } from '@src/users/dto/update-user.dto';
import { cleanData } from './utils/clearData';
import {
  createBusinessCustomer,
  createCustomer,
  createGovernmentCustomer,
} from './utils/customer';
import { omit } from 'lodash';
import { Contact } from '@src/users/contacts/entities/contact.entity';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';
import { Customer } from '@prisma/client';
import { User } from '@prisma/client';

const STATESMAN_CUSTOMER_ID_1 = 'f5b8f8f0-f8f8-4f8f-8f8f-f8f8f8f8f8f8';
const MONITORING_CUSTOMER_ID_2 = 'f5b8f8f0-f8f8-4f8f-8f8f-f8f8f8f8f8f9';

const loadListData = async (prisma) => {
  const user = await createAdminUser(prisma, {
    username: 'admin-list@mail.com',
    password: '123456',
    firstName: 'Admin',
    lastName: 'List',
    fullName: 'Admin List',
    role: Role.admin,
  });

  const statesman = await prisma.customer.create({
    data: {
      id: STATESMAN_CUSTOMER_ID_1,
      name: 'statesman',
      country: 'US',
      state: 'CA',
      district: 'San Francisco',
      updatedById: user.id,
    },
  });

  const monitoring = await prisma.customer.create({
    data: {
      id: MONITORING_CUSTOMER_ID_2,
      name: 'monitoring',
      country: 'US',
      state: 'CA',
      district: 'San Francisco',
      updatedById: user.id,
    },
  });

  await prisma.user.createMany({
    data: [
      {
        username: 'list-test1@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Test1',
        fullName: 'List Test1',
      },
      {
        username: 'list-test2@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Test2',
        fullName: 'List Test2',
      },
      {
        username: 'list-test3@mail.com',
        password: '123456',
        customerId: statesman.id,
        firstName: 'List',
        lastName: 'Test3',
        fullName: 'List Test3',
      },
      {
        username: 'list-test4@mail.com',
        password: '123456',
        customerId: monitoring.id,
        firstName: 'List',
        lastName: 'Test4',
        fullName: 'List Test4',
      },
    ],
  });
};

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule, UsersModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(ConfigurationService)
      .useValue(ConfigurationServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await cleanData(prisma, app);
    await app.close();
  });

  it('/v1/users/me (GET) (statesman)', async () => {
    const { user } = await createAdminUserAndToken(prisma, {
      username: 'test_me',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      active: true,
    });

    const customer = await createBusinessCustomer(prisma, {
      name: 'papa',
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
    });

    const statesman = await createStatesmanUserAndToken(prisma, {
      username: 'test_me_statesman',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      role: 'admin',
      active: true,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    return request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: statesman.user.id,
          username: statesman.user.username,
          role: statesman.user.role,
          customerId: expect.any(String),
          active: statesman.user.active,
          removed: false,
          removedAt: null,
          createdAt: expect.any(String),
          firstName: 'Test',
          fullName: 'Test Me',
          image: null,
          lastName: 'Me',
          lot: null,
          updatedAt: expect.any(String),
          updatedById: null,
          customer: {
            active: true,
            id: expect.any(String),
            image: null,
            name: 'papa',
          },
        });
      });
  });

  it('/v1/users/user/me (GET) (user)', async () => {
    const { user } = await createUserAndToken(prisma, {
      username: 'test_me',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      role: 'admin',
      active: true,
    });

    const customer = await createCustomer(prisma, {
      name: 'av 9 de julio',
      type: CustomerType.business,
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      countryCode: '54',
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
    });
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        username: '1166480626',
        firstName: 'olga',
        lastName: 'avila',
        lot: '2222',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    const finalUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'olga',
      lastName: 'avila',
      lot: '2222',
      fullName: 'olga avila',
      role: 'user',
      active: true,
      customer: {
        connect: {
          id: customer.id,
        },
      },
      authorizedUser: {
        connect: {
          id: authorizedUser.id,
        },
      },
    });

    const customerModify = omit(customer, [
      'eventCategories',
      'integrations',
      'settings',
    ]);

    return request(app.getHttpServer())
      .get('/v1/users/user/me')
      .set('Authorization', `Bearer ${finalUser.token}`)
      .query({
        include: JSON.stringify({
          authorizedUser: true,
          customer: {
            include: {
              alertTypes: true,
              sections: true,
            },
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: finalUser.user.id,
          username: finalUser.user.username,
          role: finalUser.user.role,
          customerId: expect.any(String),
          active: finalUser.user.active,
          createdAt: expect.any(String),
          removed: false,
          removedAt: null,
          firstName: finalUser.user.firstName,
          fullName: finalUser.user.fullName,
          image: null,
          lastName: finalUser.user.lastName,
          lot: '2222',
          updatedAt: expect.any(String),
          updatedById: null,
          customer: {
            ...customerModify,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            image: null,
          },
          authorizedUser: {
            ...authorizedUser,
            lot: '2222',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });
      });
  });

  it('/v1/users/user/me (GET) (user) inactive', async () => {
    const { user } = await createUserAndToken(prisma, {
      username: 'admin',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      role: 'admin',
      active: true,
    });

    const customer = await createCustomer(prisma, {
      name: 'av 9 de julio',
      type: CustomerType.business,
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      countryCode: '54',
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
    });
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        username: '1166480626',
        firstName: 'olga',
        lastName: 'avila',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    const finalUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'olga',
      lastName: 'avila',
      fullName: 'olga avila',
      role: 'user',
      active: false,
      customer: {
        connect: {
          id: customer.id,
        },
      },
      authorizedUser: {
        connect: {
          id: authorizedUser.id,
        },
      },
    });

    const customerModify = omit(customer, [
      'eventCategories',
      'integrations',
      'settings',
    ]);

    return request(app.getHttpServer())
      .get('/v1/users/user/me')
      .set('Authorization', `Bearer ${finalUser.token}`)
      .query({
        include: JSON.stringify({
          authorizedUser: true,
          customer: {
            include: {
              alertTypes: true,
              sections: true,
            },
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: finalUser.user.id,
          username: finalUser.user.username,
          role: finalUser.user.role,
          customerId: expect.any(String),
          active: finalUser.user.active,
          createdAt: expect.any(String),
          firstName: finalUser.user.firstName,
          fullName: finalUser.user.fullName,
          image: null,
          removed: false,
          removedAt: null,
          lastName: finalUser.user.lastName,
          lot: null,
          updatedAt: expect.any(String),
          updatedById: null,
          customer: {
            ...customerModify,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            image: null,
          },
          authorizedUser: {
            ...authorizedUser,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });
      });
  });

  it('/v1/users/me (GET) (admin)', async () => {
    const { user, token } = await createAdminUserAndToken(prisma, {
      username: 'test_me',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      active: true,
    });

    return request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: user.id,
          username: user.username,
          role: user.role,
          customerId: null,
          active: user.active,
          createdAt: expect.any(String),
          firstName: 'Test',
          fullName: 'Test Me',
          image: null,
          removed: false,
          removedAt: null,
          lastName: 'Me',
          lot: null,
          updatedAt: expect.any(String),
          updatedById: null,
          customer: null,
        });
      });
  });

  it('/v1/users/me (GET) (inactive customer)', async () => {
    const { user } = await createAdminUserAndToken(prisma, {
      username: 'admin',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      active: true,
    });

    const customer = await createBusinessCustomer(prisma, {
      name: 'papa',
      active: false,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
    });

    const statesman = await createUserAndToken(prisma, {
      username: 'inactive customer',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      role: 'statesman',
      active: true,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    return request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: authErrorCodes.AUTHORIZATION_REQUIRED,
        });
      });
  });

  it('/v1/users/me (GET) (inactive user)', async () => {
    const { token } = await createUserAndToken(prisma, {
      username: 'inactive user',
      password: '123456',
      firstName: 'Test',
      lastName: 'Me',
      fullName: 'Test Me',
      role: 'admin',
      active: false,
    });

    return request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: authErrorCodes.AUTHORIZATION_REQUIRED,
        });
      });
  });

  it('/v1/users/me (GET)(Unauthorized)', async () => {
    return request(app.getHttpServer())
      .get('/v1/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: authErrorCodes.AUTHORIZATION_REQUIRED,
        });
      });
  });

  it('/v1/users/me (GET)(Unauthorized)', async () => {
    return request(app.getHttpServer())
      .get('/v1/users/me')
      .set(
        'Authorization',
        `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYjEyMWM5ZS1mMzhkLTRiMjgtYTE2OS01MGQ3Yjk1YzFkNTMiLCJ1c2VybmFtZSI6ImFkbWluaXN0cmFkb3JAc3lzZ2FyYWdlLmNvbSIsInJvbGUiOiJhZG1pbiIsImFjdGl2ZSI6dHJ1ZSwiY3VzdG9tZXJJZCI6bnVsbCwiaWF0IjoxNjQ1MDU3NDQzLCJleHAiOjE5NjA2MzM0NDN9.LfMYWwYmkuR0iAXyzorx3UVUeeBwYfprld63G3jahxY`,
      )
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 401,
          error: 'Unauthorized',
          message: authErrorCodes.AUTHORIZATION_REQUIRED,
        });
      });
  });

  describe('Request password reset', () => {
    it('/v1/users/request-password-reset (POST) successful', async () => {
      await createAdminUser(prisma, {
        username: 'test-mail@mail.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        role: Role.admin,
        active: true,
      });

      return request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'test-mail@mail.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Password reset email sent',
          });
        });
    });

    it('/v1/users/request-password-reset (POST) unauthorized', async () => {
      return request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'unauthorized@mail.com' })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: errorCodes.INVALID_USERNAME,
          });
        });
    });

    it('/v1/users/request-password-reset (POST) user inactive', async () => {
      await createAdminUser(prisma, {
        username: 'inactive@mail.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        role: Role.admin,
        active: false,
      });

      return request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'inactive@mail.com' })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: errorCodes.NOT_ACTIVE_USER,
          });
        });
    });

    it('/v1/users/request-password-reset (POST) user with inactive customer', async () => {
      const user = await createAdminUser(prisma, {
        username: `customer-inactive@mail.com`,
        password: '123456',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        active: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parentId, image, updatedById, ...customer } = new FakeCustomer()
        .getMockFactory()
        .plain()
        .one();

      await createGovernmentCustomer(prisma, {
        ...customer,
        name: 'Customer Inactive',
        active: false,
        users: {
          connect: {
            id: user.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });

      return request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'customer-inactive@mail.com' })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: errorCodes.NOT_ACTIVE_CUSTOMER,
          });
        });
    });

    it('/v1/users/request-password-reset (POST) create token, then update it with a new request successfully', async () => {
      await createAdminUser(prisma, {
        username: 'test-mail-2@mail.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        role: Role.admin,
        active: true,
      });

      await request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'test-mail-2@mail.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Password reset email sent',
          });
        });

      // this request should override the previous token
      await request(app.getHttpServer())
        .post('/v1/users/request-password-reset')
        .send({ username: 'test-mail-2@mail.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Password reset email sent',
          });
        });
    });
  });

  describe('password reset', () => {
    it('/v1/users/reset-password (POST) invalid token', async () => {
      return request(app.getHttpServer())
        .post('/v1/users/reset-password')
        .send({
          token: 'invalid-token',
          password: '123456',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: errorCodes.INVALID_TOKEN,
          });
        });
    });

    it('/v1/users/reset-password (POST) token expired', async () => {
      const user = await createAdminUser(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        role: Role.admin,
        active: true,
      });

      const token = await prisma.passwordRecoveryToken.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          token: 'expired token',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      return request(app.getHttpServer())
        .post('/v1/users/reset-password')
        .send({
          token: token.token,
          password: '123456',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: errorCodes.EXPIRED_TOKEN,
          });
        });
    });

    it('/v1/users/reset-password (POST) successful', async () => {
      const user = await createAdminUser(prisma, {
        username: `test_${Date.now()}@mail.com`,
        password: '123456789',
        firstName: 'Test',
        lastName: 'Mail',
        fullName: 'Test Mail',
        role: Role.admin,
        active: true,
      });

      const token = await prisma.passwordRecoveryToken.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 1000),
        },
      });

      await request(app.getHttpServer())
        .post('/v1/users/reset-password')
        .send({
          token: token.token,
          password: '123456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            status: 'success',
            message: 'Password updated',
          });
        });

      const userUpdated = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      expect(userUpdated?.password).toBeDefined();

      if (userUpdated?.password) {
        const isPasswordValid = await bcrypt.compare(
          '123456',
          userUpdated.password,
        );
        expect(isPasswordValid).toBeTruthy();
      }

      const tokenDeleted = await prisma.passwordRecoveryToken.findUnique({
        where: {
          id: token.id,
        },
      });

      expect(tokenDeleted).toBeNull();
    });

    it('/v1/users/{id}/reset-password (PATCH) successful', async () => {
      const dataUser: Prisma.UserCreateInput = {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      };
      const { token, user } = await createAdminUserAndToken(prisma, dataUser);

      await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: dataUser.password,
          newPassword: 'mama1521',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Password updated',
            status: 'success',
          });
        });
    });

    it('/v1/users/{id}/reset-password (PATCH) different id and user logged', async () => {
      const dataUser: Prisma.UserCreateInput = {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      };
      const { token } = await createAdminUserAndToken(prisma, dataUser);

      await request(app.getHttpServer())
        .patch(`/v1/users/4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: dataUser.password,
          newPassword: 'mama1521',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toMatchObject({
            message: 'ONLY_SELF_PASSWORD_UPDATE_ALLOWED',
            statusCode: 403,
          });
        });
    });
  });

  describe('list users', () => {
    it('/v1/users (GET) users list (user)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });

      const customer = await createCustomer(prisma, {
        name: 'av 9 de julio',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const { token } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'List',
        lastName: 'User',
        fullName: 'List User',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await createUserAndToken(prisma, {
        username: '541166480625',
        password: '123456',
        firstName: 'olga',
        lastName: 'avila',
        lot: '2222',
        fullName: 'olga avila',
        role: 'user',
        active: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(1);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user).toStrictEqual({
              firstName: expect.any(String),
              lastName: expect.any(String),
              id: expect.any(String),
              fullName: expect.any(String),
              lot: expect.any(String),
              customerId: expect.any(String),
            });
          });
          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 1,
            total: 1,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (admin)', async () => {
      await loadListData(prisma);

      const { token } = await createAdminUserAndToken(prisma, {
        username: 'list-admin@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Admin',
        fullName: 'List Admin',
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(6);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user.username).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.customerId).toBeDefined();
          });

          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 6,
            total: 6,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (statesman)', async () => {
      await loadListData(prisma);

      const { token } = await createStatesmanUserAndToken(prisma, {
        username: 'list-statesman@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Statesman',
        fullName: 'List Statesman',
        customer: {
          connect: {
            id: STATESMAN_CUSTOMER_ID_1,
          },
        },
      });

      await prisma.permission.create({
        data: {
          name: 'list users',
          category: 'users',
          action: 'list-users',
          statesman: true,
        },
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(2);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user.username).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.customerId).toBeDefined();
          });

          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 2,
            total: 2,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (monitoring)', async () => {
      await loadListData(prisma);

      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'list-monitoring@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Monitoring',
        fullName: 'List Monitoring',
        customer: {
          connect: {
            id: MONITORING_CUSTOMER_ID_2,
          },
        },
      });

      await prisma.permission.create({
        data: {
          name: 'list users',
          category: 'users',
          action: 'list-users',
          monitoring: true,
        },
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(2);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user.username).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.customerId).toBeDefined();
          });

          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 2,
            total: 2,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (statesman without customerId)', async () => {
      await loadListData(prisma);

      const { token } = await createStatesmanUserAndToken(prisma, {
        username: 'list-statesman@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Statesman',
        fullName: 'List Statesman',
      });

      await prisma.permission.create({
        data: {
          name: 'list users',
          category: 'users',
          action: 'list-users',
          statesman: true,
        },
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(0);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user.username).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.customerId).toBeDefined();
          });

          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 0,
            total: 0,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (monitoring without customerId)', async () => {
      await loadListData(prisma);

      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'list-monitoring@mail.com',
        password: '123456',
        firstName: 'List',
        lastName: 'Monitoring',
        fullName: 'List Monitoring',
      });

      await prisma.permission.create({
        data: {
          name: 'list users',
          category: 'users',
          action: 'list-users',
          monitoring: true,
        },
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.results).toHaveLength(0);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((user) => {
            expect(user.username).toBeDefined();
            expect(user.role).toBeDefined();
            expect(user.customerId).toBeDefined();
          });

          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            size: 0,
            total: 0,
            take: 100,
            skip: 0,
            hasMore: false,
          });
        });
    });

    it('/v1/users (GET) users list (statesman) without permission', async () => {
      await loadListData(prisma);

      const { token } = await createStatesmanUserAndToken(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/users (GET) users list (monitoring) without permission', async () => {
      await loadListData(prisma);

      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });
  });

  describe('create user', () => {
    it('/v1/users (POST) user create (admin)', async () => {
      const { token } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });

      const userData = {
        username: 'newUser@mail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'User',
        role: Role.user,
        homeAddress: {
          neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
          apartment: '6',
          floor: 'B',
          fullAddress: {
            formatted_address: 'avenida belgrano 1657',
            number: '1657',
            street: 'avenida belgrano',
            city: 'Caba',
            district: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            geolocation: {
              lat: '54.123',
              lng: '-54.12354',
            },
          },
        },
      };

      const result = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            customerType: null,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customer: null,
            removed: false,
            removedAt: null,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: null,
            workAddress: null,
            idCard: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
            homeAddress: expect.objectContaining({
              neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
              apartment: '6',
              floor: 'B',
              fullAddress: expect.objectContaining({
                formatted_address: 'avenida belgrano 1657',
                number: '1657',
                street: 'avenida belgrano',
                city: 'Caba',
                district: 'Buenos Aires',
                state: 'Buenos Aires',
                country: 'Argentina',
                geolocation: expect.objectContaining({
                  lat: '54.123',
                  lng: '-54.12354',
                }),
              }),
            }),
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringAlertTypes: [],
              monitoringEventTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });

      const permissions = await prisma.userPermission.findFirst({
        where: {
          user: {
            id: result.body.id,
          },
        },
      });

      expect(permissions).toBeDefined();
    });

    it('/v1/users (POST) user create (statesman)', async () => {
      const adminUser = await createAdminUser(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });

      const customer = await createBusinessCustomer(prisma, {
        name: 'Customer',
        country: 'US',
        state: 'CA',
        district: 'San Francisco',
        active: true,
        updatedBy: {
          connect: {
            id: adminUser.id,
          },
        },
      });

      const { token } = await createUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
        role: Role.statesman,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.statesman,
        customerId: 'f5585aa0-4c8a-456d-bb12-84ded913a2eb',
      };

      await prisma.permission.create({
        data: {
          name: 'create user',
          category: 'users',
          action: 'create-user',
          statesman: true,
        },
      });

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customerId: customer.id,
            removed: false,
            customerType: null,
            removedAt: null,
            customer: {
              active: true,
              country: 'US',
              countryCode: customer.countryCode,
              createdAt: expect.any(String),
              district: 'San Francisco',
              id: customer.id,
              image: customer.image,
              name: 'Customer',
              notes: customer.notes,
              parentId: customer.parentId,
              verifyBySms: false,
              phoneLength: customer.phoneLength,
              secretKey: customer.secretKey,
              speed: customer.speed,
              state: 'CA',
              timezone: customer.timezone,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: adminUser.id,
              url: customer.url,
              isClient: false,
            },
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringAlertTypes: [],
              monitoringEventTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });
    });

    it('/v1/users (POST) user create (monitoring)', async () => {
      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'monitoring@mail.com',
        password: '123456',
        firstName: 'Monitoring',
        lastName: 'Monitoring',
        fullName: 'Monitoring Monitoring',
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.monitoring,
      };

      await prisma.permission.create({
        data: {
          name: 'create user',
          category: 'users',
          action: 'create-user',
          monitoring: true,
        },
      });

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            removed: false,
            removedAt: null,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customerType: null,
            customer: null,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringAlertTypes: [],
              monitoringEventTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });
    });

    it('/v1/users (POST) user create (statesman) without permission', async () => {
      const { token } = await createStatesmanUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.user,
      };

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/users (POST) user create (monitoring) without permission', async () => {
      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'monitoring@mail.com',
        password: '123456',
        firstName: 'Monitoring',
        lastName: 'Monitoring',
        fullName: 'Monitoring Monitoring',
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.user,
      };

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/users (POST) user create (admin) with some user permissions and customer Id', async () => {
      const { user, token } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });

      const customer = await createBusinessCustomer(prisma, {
        name: 'customer',
        country: 'US',
        state: 'CA',
        district: 'San Francisco',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });

      const userData: CreateUserDto = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.user,
        customerId: customer.id,
        permissions: {
          cameras: true,
          users: true,
          lots: true,
        },
      };

      const result = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            customerType: null,
            role: userData.role,
            removed: false,
            removedAt: null,
            customerId: customer.id,
            customer: {
              active: true,
              country: 'US',
              countryCode: customer.countryCode,
              createdAt: expect.any(String),
              district: 'San Francisco',
              id: customer.id,
              image: customer.image,
              verifyBySms: false,
              name: 'customer',
              notes: customer.notes,
              parentId: customer.parentId,
              phoneLength: customer.phoneLength,
              secretKey: customer.secretKey,
              speed: customer.speed,
              state: 'CA',
              timezone: customer.timezone,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: user.id,
              url: customer.url,
              isClient: false,
            },
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              cameras: true,
              users: true,
              lots: true,
              monitoringAlertTypes: [],
              monitoringEventTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });

      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: result.body.id,
        },
      });

      expect(userPermission).toBeDefined();
      expect(userPermission).toMatchObject({
        cameras: true,
        users: true,
        lots: true,
      });
    });

    it('/v1/users (POST) user create (admin) with some monitoringEventTypes permissions', async () => {
      const { token, user } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'customer1',
        state: 'Capital Federal',
        district: 'Buenos Aires',
        country: 'Argentina',
        settings: {
          create: {
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const eventType = await prisma.eventType.create({
        data: {
          code: 'eventType',
          title: 'eventType',
          active: true,
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const eventType2 = await prisma.eventType.create({
        data: {
          code: 'eventType2',
          title: 'eventType2',
          active: true,
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const userData: CreateUserDto = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.user,
        customerId: customer.id,
        permissions: {
          monitoringEventTypes: [eventType.id, eventType2.id],
        },
      };

      const result = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            removed: false,
            customerType: null,
            removedAt: null,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customer: expect.any(Object),
            customerId: customer.id,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringEventTypes: expect.arrayContaining([
                eventType,
                eventType2,
              ]),
              monitoringAlertTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });

      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: result.body.id,
        },
        include: {
          monitoringEventTypes: true,
        },
      });

      expect(userPermission).toBeDefined();
      expect(userPermission).toMatchObject({
        monitoringEventTypes: expect.arrayContaining([eventType, eventType2]),
      });
    });

    it('/v1/users (POST) user create (monitoring) with admin role', async () => {
      const { token } = await createMonitoringUserAndToken(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      await prisma.permission.create({
        data: {
          action: 'create-user',
          category: 'user',
          name: 'create-user',
          monitoring: true,
        },
      });

      const userData: CreateUserDto = {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        role: Role.admin,
      };

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: 'ACTION_NOT_ALLOWED',
          });
        });
    });

    it('/v1/users (POST) user create (admin) should not set user permissions', async () => {
      const { token } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });

      const userData: CreateUserDto = {
        username: 'admin2@mail.com',
        password: '123456',
        firstName: 'Admin2',
        lastName: 'Admin2',
        role: Role.admin,
      };

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            removed: false,
            removedAt: null,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customerType: null,
            customer: null,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            userPermissions: null,
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
          });
        });
    });

    it('/v1/users (POST) user create (admin) should set a system generated password', async () => {
      const { token } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });

      const userData: CreateUserDto = {
        username: 'user@mail.com',
        firstName: 'User',
        lastName: 'User',
        role: Role.user,
      };

      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            removed: false,
            removedAt: null,
            lastName: userData.lastName,
            customerType: null,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customer: null,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            userPermissions: expect.any(Object),
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
          });
        });
    });

    it('/v1/users (POST) user create (monitoring) and add monitoring customers', async () => {
      const { user } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createBusinessCustomer(prisma, {
        name: 'parent',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });

      const child = await createBusinessCustomer(prisma, {
        name: 'child',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        parent: {
          connect: {
            id: parent.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        role: Role.monitoring,
        customerId: parent.id,
        permissions: {
          monitoringCustomers: [child.id],
        },
      };

      await prisma.permission.create({
        data: {
          name: 'create user',
          category: 'users',
          action: 'create-user',
          monitoring: true,
        },
      });
      const { token } = await createUserAndToken(prisma, {
        username: 'monitoring@mail.com',
        password: '123456',
        firstName: 'Monitoring',
        lastName: 'Monitoring',
        fullName: 'Monitoring Monitoring',
        role: Role.monitoring,
        customer: {
          connect: {
            id: parent.id,
          },
        },
      });
      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            username: userData.username,
            firstName: userData.firstName,
            removed: false,
            removedAt: null,
            lastName: userData.lastName,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            customerType: null,
            customer: expect.any(Object),
            customerId: expect.any(String),
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringAlertTypes: [],
              monitoringEventTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
              monitoringCustomers: [
                {
                  id: expect.any(String),
                  customerId: child.id,
                  userPermissionId: expect.any(String),
                },
              ],
            }),
          });
        });
    });
  });

  describe('find user', () => {
    it('/v1/users (GET) user find (admin)', async () => {
      const { token } = await createAdminUserAndToken(prisma, {
        username: 'amin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
      });

      const userData = {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
        role: Role.user,
      };

      const user = await prisma.user.create({
        data: userData,
      });

      return request(app.getHttpServer())
        .get(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName,
            removed: false,
            removedAt: null,
            role: userData.role,
            customerType: null,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
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
          });
        });
    });

    it('/v1/users (GET) user find (user)', async () => {
      const { token } = await createFinalUserAndToken(prisma, {
        username: '541166452632',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      const userData = {
        username: 'user2@mail.com',
        password: '123456',
        firstName: 'User2',
        lastName: 'User2',
        fullName: 'User2 User2',
        role: Role.user,
      };

      const user = await prisma.user.create({
        data: userData,
      });

      return request(app.getHttpServer())
        .get(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });

    it('/v1/users (GET) user not found', async () => {
      const { token } = await createAdminUserAndToken(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      return request(app.getHttpServer())
        .get('/v1/users/not-found')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: errorCodes.USER_NOT_FOUND,
            statusCode: 404,
          });
        });
    });

    it('/v1/users (GET) user find (statesman)', async () => {
      const admin = await createAdminUser(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });

      const customer = await createBusinessCustomer(prisma, {
        name: 'customer',
        country: 'US',
        state: 'CA',
        district: 'San Francisco',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { token } = await createStatesmanUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      const userData = {
        username: '541166480626',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
        role: Role.user,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      };

      const { id } = await createFinalUser(prisma, {
        ...userData,
      });

      const include = JSON.stringify({
        customer: true,
      });
      return request(app.getHttpServer())
        .get(`/v1/users/${id}?include=${include}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: id,
            removed: false,
            removedAt: null,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName,
            customerType: null,
            role: userData.role,
            customerId: customer.id,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
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
            customer: expect.objectContaining({
              id: customer.id,
            }),
          });
        });
    });

    it('/v1/users (GET) user find (as statesman) should return not found if the user belongs to other customer', async () => {
      const admin = await createAdminUser(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'customer',
        country: 'US',
        state: 'CA',
        district: 'San Francisco',
        updatedBy: { connect: { id: admin.id } },
        active: true,
      });
      const user = await createStatesmanUser(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
      });

      const token = createUserToken({
        ...user,
        customerId: 'fake-customer',
      });

      const userData = {
        username: '541166482595',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
        role: Role.user,
        customer: {
          connect: {
            id: customer.id as string,
          },
        },
      };

      const { id } = await createFinalUser(prisma, {
        ...userData,
      });

      return request(app.getHttpServer())
        .get(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: errorCodes.USER_NOT_FOUND,
            statusCode: 404,
          });
        });
    });
  });

  describe('update user', () => {
    it('/v1/users (PATCH) user update (admin)', async () => {
      const { user: admin, token } = await createAdminUserAndToken(prisma, {
        username: 'user@mail.com',
        password: '123456',
        firstName: 'User',
        lastName: 'User',
        fullName: 'User User',
        role: Role.admin,
      });

      const alertType = await prisma.alertType.create({
        data: {
          type: 'alert-type',
          name: 'alert-type',
        },
      });

      const customer = await createBusinessCustomer(prisma, {
        name: 'customer',
        country: 'US',
        state: 'CA',
        district: 'San Francisco',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
        active: true,
      });

      const eventCategory = await prisma.eventCategory.create({
        data: {
          title: 'title event',
        },
      });
      const customerEventCategory = await prisma.customerEventCategory.create({
        data: {
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
          category: {
            connect: {
              id: eventCategory.id,
            },
          },
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      const eventType = await prisma.eventType.create({
        data: {
          title: 'test 12',
          code: 'test 12',
          eventCategoryId: customerEventCategory.id,
          updatedById: admin.id,
          customerId: customer.id,
        },
      });
      const user = await createFinalUser(prisma, {
        username: '541166482255',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: {
          connect: {
            id: customer.id,
          },
        },
        userPermissions: {
          create: {
            authorizationEventType: {
              connect: {
                id: eventType.id,
              },
            },
            visitorsEventType: {
              connect: {
                id: eventType.id,
              },
            },
            monitoringAlertTypes: {
              connect: {
                id: alertType.id,
              },
            },
          },
        },
      });

      const alertType2 = await prisma.alertType.create({
        data: {
          type: 'alert-type2',
          name: 'alert-type2',
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        role: Role.user,
        workAddress: {
          neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
          floor: 'B',
          fullAddress: {
            formatted_address: 'avenida belgrano 1657',
            number: '1657',
            street: 'avenida belgrano',
            city: 'Caba',
            district: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            geolocation: {
              lat: '54.123',
              lng: '-54.12354',
            },
          },
        },
        permissions: {
          alerts: true,
          visitorsEventTypeId: null,
          authorizationEventTypeId: null,
          monitoringAlertTypes: [alertType2.id],
        },
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            removed: false,
            removedAt: null,
            username: user.username,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: 'first last',
            customerType: null,
            role: data.role,
            customerId: customer.id,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: admin.id,
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: null,
            homeAddress: null,
            workAddress: expect.objectContaining({
              neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
              floor: 'B',
              fullAddress: expect.objectContaining({
                formatted_address: 'avenida belgrano 1657',
                number: '1657',
                street: 'avenida belgrano',
                city: 'Caba',
                district: 'Buenos Aires',
                state: 'Buenos Aires',
                country: 'Argentina',
                geolocation: expect.objectContaining({
                  lat: '54.123',
                  lng: '-54.12354',
                }),
              }),
            }),
            idCard: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringEventTypes: [],
              monitoringAlertTypes: expect.arrayContaining([
                {
                  id: alertType2.id,
                  type: alertType2.type,
                  name: alertType2.name,
                },
              ]),
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });
    });

    it('/v1/users (PATCH) user update (statesman) with permission', async () => {
      const admin = await prisma.user.create({
        data: {
          username: 'admin@mail.com',
          password: '123456',
          firstName: 'admin',
          lastName: 'admin',
          fullName: 'admin admin',
          role: Role.admin,
          userPermissions: {
            create: {},
          },
        },
      });
      const customer = await createCustomer(prisma, {
        name: 'san fernando',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });
      const { user: statesman, token } = await createUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
        role: Role.statesman,
        customer: { connect: { id: customer.id } },
      });
      const user = await prisma.user.create({
        data: {
          username: '541166480626',
          password: '123456',
          firstName: 'carlos',
          lastName: 'alberto',
          fullName: 'carlos alberto',
          role: Role.user,
          customer: { connect: { id: customer.id } },
          userPermissions: {
            create: {},
          },
        },
      });

      await prisma.permission.create({
        data: {
          action: 'modify-user',
          name: 'modify-user',
          category: 'users',
          statesman: true,
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        role: Role.monitoring,
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: user.username,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: 'first last',
            customerType: null,
            role: data.role,
            customerId: customer.id,
            active: true,
            image: null,
            removed: false,
            removedAt: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: statesman.id,
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringEventTypes: [],
              monitoringAlertTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
            }),
          });
        });
    });

    it('/v1/users (PATCH) user update (statesman) without permission', async () => {
      const { token } = await createUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
        role: Role.statesman,
      });

      const user = await prisma.user.create({
        data: {
          username: 'newUser@mail.com',
          password: '123456',
          firstName: 'New User',
          lastName: 'New User',
          fullName: 'New User New User',
          role: Role.user,
          userPermissions: {
            create: {},
          },
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        role: Role.user,
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });

    it('/v1/users (PATCH) user update (monitoring) without users permission entry', async () => {
      const admin = await prisma.user.create({
        data: {
          username: 'admin@mail.com',
          password: '123456',
          firstName: 'admin',
          lastName: 'admin',
          fullName: 'admin admin',
          role: Role.admin,
          userPermissions: {
            create: {},
          },
        },
      });
      const customer = await createCustomer(prisma, {
        name: 'san fernando',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user: monitoring, token } = await createUserAndToken(prisma, {
        username: 'monitoring@mail.com',
        password: '123456',
        firstName: 'Monitoring',
        lastName: 'Monitoring',
        fullName: 'Monitoring Monitoring',
        role: Role.monitoring,
        customer: { connect: { id: customer.id } },
      });
      const user = await prisma.user.create({
        data: {
          username: '541166480626',
          password: '123456',
          firstName: 'User',
          lastName: 'User',
          fullName: 'User User',
          role: Role.user,
          customer: { connect: { id: customer.id } },
        },
      });

      await prisma.permission.create({
        data: {
          action: 'modify-user',
          name: 'modify-user',
          category: 'users',
          monitoring: true,
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        permissions: {
          alerts: true,
        },
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            removed: false,
            removedAt: null,
            username: user.username,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: 'first last',
            role: user.role,
            customerType: null,
            customerId: customer.id,
            active: true,
            image: null,
            lot: null,
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
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: monitoring.id,
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              alerts: data.permissions?.alerts,
              userId: expect.any(String),
            }),
          });
        });
    });

    it('/v1/users (PATCH) user update (monitoring) cannot self update', async () => {
      const { user: monitoring, token } = await createUserAndToken(prisma, {
        username: 'monitoring@mail.com',
        password: '123456',
        firstName: 'Monitoring',
        lastName: 'Monitoring',
        fullName: 'Monitoring Monitoring',
        role: Role.monitoring,
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
      };

      await prisma.permission.create({
        data: {
          action: 'modify-user',
          name: 'modify-user',
          category: 'users',
          monitoring: true,
        },
      });

      return request(app.getHttpServer())
        .patch(`/v1/users/${monitoring.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(422)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Unprocessable Entity',
            message: 'USER_CANNOT_UPDATE_SELF',
            statusCode: 422,
          });
        });
    });

    it('/v1/users (PATCH) user update (statesman) with permission', async () => {
      const { user: admin } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createBusinessCustomer(prisma, {
        name: 'parent',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const child = await createCustomer(prisma, {
        name: 'child',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        parent: {
          connect: {
            id: parent.id,
          },
        },
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });
      const { user: statesman, token } = await createUserAndToken(prisma, {
        username: 'statesman@mail.com',
        password: '123456',
        firstName: 'Statesman',
        lastName: 'Statesman',
        fullName: 'Statesman Statesman',
        role: Role.statesman,
      });

      const user = await prisma.user.create({
        data: {
          username: 'newUser@mail.com',
          password: '123456',
          firstName: 'New User',
          lastName: 'New User',
          fullName: 'New User New User',
          role: Role.monitoring,
          userPermissions: {
            create: {
              monitoringCustomers: {
                create: [
                  {
                    customerId: child.id,
                  },
                ],
              },
            },
          },
        },
      });

      await prisma.permission.create({
        data: {
          action: 'modify-user',
          name: 'modify-user',
          category: 'users',
          statesman: true,
          monitoring: true,
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        role: Role.monitoring,
        permissions: {
          monitoringCustomers: [],
        },
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: user.username,
            removed: false,
            removedAt: null,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: 'first last',
            role: data.role,
            customerId: null,
            active: true,
            image: null,
            lot: null,
            customerType: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: statesman.id,
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
            userPermissions: expect.objectContaining({
              id: expect.any(String),
              monitoringEventTypes: [],
              monitoringAlertTypes: [],
              authorizationEventType: null,
              authorizationEventTypeId: null,
              userId: expect.any(String),
              visitorsEventType: null,
              visitorsEventTypeId: null,
              monitoringCustomers: [],
            }),
          });
        });
    });

    it('/v1/users (PATCH) user update (user)', async () => {
      const { user: admin } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user, token } = await createUserAndToken(prisma, {
        username: 'newUser@mail.com',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: { connect: { id: parent.id } },
        role: Role.user,
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        emergencyNumber: '1166480626',
        alarmNumber: '1166480622',
        pushId: 'ExponentPushToken[d6jiw2D7FeQt-CSumHPdHA]',
        workAddress: {
          neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
          apartment: '6',
          floor: 'B',
          fullAddress: {
            formatted_address: 'avenida belgrano 1657',
            number: '1657',
            street: 'avenida belgrano',
            city: 'Caba',
            district: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            geolocation: {
              lat: '54.123',
              lng: '-54.12354',
            },
          },
        },
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: user.username,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: 'first last',
            role: Role.user,
            customerType: null,
            customerId: parent.id,
            active: true,
            image: null,
            lot: null,
            removed: false,
            removedAt: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: data.pushId,
            emergencyNumber: data.emergencyNumber,
            alarmNumber: data.alarmNumber,
            lastAccessToMenu: null,
            status: null,
            homeAddress: null,
            workAddress: data.workAddress,
            idCard: null,
            userPermissions: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
          });
        });
    });

    it('/v1/users (PATCH) update user sending notification when active is false (user)', async () => {
      const { user: admin, token } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user } = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        customer: { connect: { id: parent.id } },
        role: Role.user,
      });

      const data: UpdateUserDto = {
        active: false,
      };

      await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            removed: false,
            removedAt: null,
            lastName: user.lastName,
            fullName: user.fullName,
            role: Role.user,
            customerId: parent.id,
            active: data.active,
            image: null,
            customerType: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: null,
            homeAddress: null,
            workAddress: user.workAddress,
            idCard: null,
            userPermissions: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
          });
        });

      const notification = await prisma.notificationUser.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          notification: true,
        },
      });

      expect(notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        notificationId: expect.any(String),
        read: false,
        userId: expect.any(String),
      });
      expect(notification?.notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        title: notificationUsers.title.active.false,
        description: notificationUsers.message.active.false,
      });
    });

    it('/v1/users (PATCH) update user sending notification when active is true (user)', async () => {
      const { user: admin, token } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user } = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        customer: { connect: { id: parent.id } },
        role: Role.user,
        active: false,
      });

      const data: UpdateUserDto = {
        active: true,
      };

      await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            removed: false,
            removedAt: null,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: Role.user,
            customerId: parent.id,
            active: data.active,
            customerType: null,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: null,
            homeAddress: null,
            workAddress: user.workAddress,
            idCard: null,
            userPermissions: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
          });
        });

      const notification = await prisma.notificationUser.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          notification: true,
        },
      });

      expect(notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        notificationId: expect.any(String),
        read: false,
        userId: expect.any(String),
      });
      expect(notification?.notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        title: notificationUsers.title.active.true,
        description: notificationUsers.message.active.true,
      });
    });

    it('/v1/users (PATCH) update user sending notification when status is active (user)', async () => {
      const { user: admin, token } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user } = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        customer: { connect: { id: parent.id } },
        role: Role.user,
      });

      const data: UpdateUserDto = {
        status: 'active',
        comment: 'felicidades amigo',
      };

      await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: Role.user,
            removed: false,
            customerType: null,
            removedAt: null,
            customerId: parent.id,
            active: user.active,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: data.status,
            homeAddress: null,
            workAddress: user.workAddress,
            idCard: null,
            userPermissions: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: data.comment,
            authorizedUserId: null,
          });
        });

      const notification = await prisma.notificationUser.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          notification: true,
        },
      });

      expect(notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        notificationId: expect.any(String),
        read: false,
        userId: expect.any(String),
      });
      expect(notification?.notification).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(Date),
        title: notificationUsers.title.status.active,
        description: data.comment,
      });
    });

    it('/v1/users (PATCH) user update (user) (AUTHORIZATION_REQUIRED)', async () => {
      const { user: admin } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { token } = await createUserAndToken(prisma, {
        username: 'newUser@mail.com',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: { connect: { id: parent.id } },
        role: Role.user,
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        emergencyNumber: '1166480626',
        alarmNumber: '1166480622',
        workAddress: {
          neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
          apartment: '6',
          floor: 'B',
          fullAddress: {
            formatted_address: 'avenida belgrano 1657',
            number: '1657',
            street: 'avenida belgrano',
            city: 'Caba',
            district: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            geolocation: {
              lat: '54.123',
              lng: '-54.12354',
            },
          },
        },
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${admin.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });

    it('/v1/users (PATCH) user update (user) clean object properties', async () => {
      const { user: admin } = await createUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'Admin',
        lastName: 'Admin',
        fullName: 'Admin Admin',
        role: Role.admin,
      });
      const parent = await createCustomer(prisma, {
        name: 'parent',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user, token } = await createUserAndToken(prisma, {
        username: 'newUser@mail.com',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: { connect: { id: parent.id } },
        role: Role.user,
        image: {},
        workAddress: {
          neighborhoodId: 'd8205dd1-97c1-42e5-bf63-a5aadef27c24',
          apartment: '6',
          floor: 'B',
          fullAddress: {
            formatted_address: 'avenida belgrano 1657',
            number: '1657',
            street: 'avenida belgrano',
            city: 'Caba',
            district: 'Buenos Aires',
            state: 'Buenos Aires',
            country: 'Argentina',
            geolocation: {
              lat: '54.123',
              lng: '-54.12354',
            },
          },
        },
      });

      const data: UpdateUserDto = {
        firstName: 'first',
        lastName: 'last',
        workAddress: null,
        image: null,
      };

      return request(app.getHttpServer())
        .patch(`/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: user.id,
            removed: false,
            removedAt: null,
            username: user.username,
            firstName: data.firstName,
            lastName: data.lastName,
            customerType: null,
            fullName: 'first last',
            role: Role.user,
            customerId: parent.id,
            active: true,
            image: null,
            lot: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
            pushId: null,
            emergencyNumber: null,
            alarmNumber: null,
            lastAccessToMenu: null,
            status: null,
            homeAddress: null,
            workAddress: data.workAddress,
            idCard: null,
            userPermissions: null,
            verificationCode: null,
            lastStateUpdatedTime: null,
            stateUpdatedUserId: null,
            comment: null,
            authorizedUserId: null,
          });
        });
    });

    describe('secret key user', () => {
      it('/v1/users (SECRET KEY) (CUSTOMER_NOT_FOUND)', async () => {
        const { user: admin } = await createUserAndToken(prisma, {
          username: 'admin@mail.com',
          password: '123456',
          firstName: 'Admin',
          lastName: 'Admin',
          fullName: 'Admin Admin',
          role: Role.admin,
        });
        const customer = await createCustomer(prisma, {
          name: 'customer',
          type: CustomerType.business,
          active: true,
          district: 'San Fernando',
          state: 'Buenos Aires',
          country: 'Argentina',
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
        });

        const { user, token } = await createUserAndToken(prisma, {
          username: '541166480624',
          password: '123456',
          firstName: 'Carlitos',
          lastName: 'Tevez',
          fullName: 'Carlitos Tevez',
          customer: { connect: { id: customer.id } },
          role: Role.user,
          image: {},
        });

        const data: UpdateUserDto = {
          firstName: 'first',
          lastName: 'last',
          workAddress: null,
          image: null,
          secretKey: 'ergosrijdfm',
        };

        await request(app.getHttpServer())
          .patch(`/v1/users/${user.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(data)
          .expect(422)
          .expect((res) => {
            expect(res.body).toEqual({
              error: 'Unprocessable Entity',
              message: 'CUSTOMER_NOT_FOUND',
              statusCode: 422,
            });
          });
      });

      it('/v1/users (SECRET KEY) (AUTHORIZED_USER_NOT_FOUND)', async () => {
        const { user: admin } = await createUserAndToken(prisma, {
          username: 'admin@mail.com',
          password: '123456',
          firstName: 'Admin',
          lastName: 'Admin',
          fullName: 'Admin Admin',
          role: Role.admin,
        });
        const customer = await createCustomer(prisma, {
          name: 'customer',
          type: CustomerType.business,
          active: true,
          district: 'San Fernando',
          state: 'Buenos Aires',
          country: 'Argentina',
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
        });

        await createCustomer(prisma, {
          name: 'customer2',
          type: CustomerType.business,
          active: true,
          district: 'San patricio',
          secretKey: 'this-is-a-secret-key',
          state: 'Buenos Aires',
          country: 'Argentina',
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
        });

        const { user, token } = await createUserAndToken(prisma, {
          username: '541166480624',
          password: '123456',
          firstName: 'Carlitos',
          lastName: 'Tevez',
          fullName: 'Carlitos Tevez',
          customer: { connect: { id: customer.id } },
          role: Role.user,
          image: {},
        });

        const data: UpdateUserDto = {
          firstName: 'first',
          lastName: 'last',
          workAddress: null,
          image: null,
          secretKey: 'this-is-a-secret-key',
        };

        await request(app.getHttpServer())
          .patch(`/v1/users/${user.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(data)
          .expect(422)
          .expect((res) => {
            expect(res.body).toEqual({
              error: 'Unprocessable Entity',
              message: 'USER_AUTHORIZED_NOT_FOUND',
              statusCode: 422,
            });
          });
      });

      it('/v1/users (SECRET KEY)', async () => {
        const { user: admin } = await createUserAndToken(prisma, {
          username: 'admin@mail.com',
          password: '123456',
          firstName: 'Admin',
          lastName: 'Admin',
          fullName: 'Admin Admin',
          role: Role.admin,
        });
        const customer = await createCustomer(prisma, {
          name: 'customer',
          type: CustomerType.business,
          active: true,
          district: 'San Fernando',
          state: 'Buenos Aires',
          country: 'Argentina',
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
        });

        const customer2 = await createCustomer(prisma, {
          name: 'customer2',
          type: CustomerType.business,
          active: true,
          secretKey: 'this-is-a-secret-key',
          district: 'San patricio',
          countryCode: '54',
          state: 'Buenos Aires',
          country: 'Argentina',
          updatedBy: {
            connect: {
              id: admin.id,
            },
          },
        });

        const { user, token } = await createUserAndToken(prisma, {
          username: '541166480624',
          password: '123456',
          firstName: 'Carlitos',
          lot: 'A21',
          lastName: 'Tevez',
          fullName: 'Carlitos Tevez',
          customer: { connect: { id: customer.id } },
          role: Role.user,
          image: {},
          authorizedUsers: {
            createMany: {
              data: [
                {
                  username: '1166480624',
                  firstName: 'Carlitos',
                  lot: 'A21',
                  lastName: 'Tevez',
                  customerId: customer.id,
                },
                {
                  username: '1166480624',
                  lot: 'B1',
                  firstName: 'Carlitos',
                  lastName: 'Tevez',
                  customerId: customer2.id,
                },
              ],
            },
          },
        });

        const data: UpdateUserDto = {
          firstName: 'first',
          lastName: 'last',
          workAddress: null,
          image: null,
          secretKey: 'this-is-a-secret-key',
        };

        await request(app.getHttpServer())
          .patch(`/v1/users/${user.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(data)
          .expect(200)
          .expect((res) => {
            expect(res.body).toEqual({
              id: user.id,
              removed: false,
              removedAt: null,
              username: user.username,
              firstName: data.firstName,
              lastName: data.lastName,
              customerType: null,
              fullName: 'first last',
              role: Role.user,
              customerId: customer2.id,
              active: true,
              image: null,
              lot: 'B1',
              access_token: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              pushId: null,
              emergencyNumber: null,
              alarmNumber: null,
              lastAccessToMenu: null,
              status: null,
              homeAddress: null,
              workAddress: data.workAddress,
              idCard: null,
              userPermissions: null,
              verificationCode: null,
              lastStateUpdatedTime: null,
              stateUpdatedUserId: null,
              comment: null,
              authorizedUserId: expect.any(String),
            });
          });
      });
    });
  });

  describe('register', () => {
    it('/v1/users/register change only password an verification code (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalAuthorizedUser = await prisma.authorizedUser.create({
        data: {
          firstName: 'mauricio',
          username: '1166480626',
          lastName: 'gallego',
          reservationTypes: {
            create: [
              {
                reservationType: {
                  create: {
                    code: 'Tenis',
                    days: 0,
                    display: 'day',
                    groupCode: 'TE',
                    numberOfPending: 2,
                    customerId: customer.id,
                    createdAt: new Date('2021-02-01 13:27:10'),
                    updatedAt: new Date('2021-09-04 15:21:14'),
                    minDays: 0,
                    maxPerMonth: null,
                    minDaysBetweenReservation: null,
                  },
                },
              },
            ],
          },
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        role: 'user',
        customerType: 'business',
        active: true,
        authorizedUser: {
          connect: {
            id: finalAuthorizedUser.id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      await request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: finalUser.user.username,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              ...omit(finalUser.user, ['customer']),
              password: null,
              id: expect.any(String),
              authorizedUserId: finalAuthorizedUser.id,
              customerType: 'business',
              verificationCode: expect.any(String),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
            },
            customer: {
              ...omit(customer, [
                'eventCategories',
                'integrations',
                'settings',
              ]),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              settings: null,
              sections: null,
            },
            authorizedUser: {
              ...finalAuthorizedUser,
              reservationTypes: [
                {
                  authorizedUserId: expect.any(String),
                  id: expect.any(String),
                  reservationTypeId: expect.any(String),
                },
              ],
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/users/register change all data user (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia123122',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const customer2 = await createCustomer(prisma, {
        name: 'caba',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '55',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'patricio',
        lastName: 'medina',
        fullName: 'patricio medina',
        customerType: 'business',
        role: 'user',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
      const finalAuthorizedUser = await prisma.authorizedUser.create({
        data: {
          firstName: 'mauricio',
          username: '1166480626',
          lastName: 'gallego',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: finalUser.user.username,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              ...omit(finalUser.user, ['customer']),
              password: null,
              customerType: 'business',
              verificationCode: expect.any(String),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              lastName: finalAuthorizedUser.lastName,
              fullName: `${finalAuthorizedUser.firstName} ${finalAuthorizedUser.lastName}`,
              firstName: finalAuthorizedUser.firstName,
              customerId: customer.id,
              authorizedUserId: finalAuthorizedUser.id,
            },
            customer: {
              ...omit(customer, ['eventCategories', 'integrations']),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              sections: null,
              settings: null,
            },
            authorizedUser: {
              ...finalAuthorizedUser,
              reservationTypes: [],
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/users/register create user (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia123122',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalAuthorizedUser = await prisma.authorizedUser.create({
        data: {
          firstName: 'mauricio',
          username: '1166480626',
          lastName: 'gallego',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: '541166480626',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              id: expect.any(String),
              active: true,
              comment: null,
              emergencyNumber: null,
              alarmNumber: null,
              homeAddress: null,
              idCard: null,
              image: null,
              lastAccessToMenu: null,
              lastStateUpdatedTime: null,
              lot: null,
              pushId: null,
              role: 'user',
              removed: false,
              removedAt: null,
              stateUpdatedUserId: null,
              status: null,
              customerType: 'business',
              updatedById: null,
              username: '541166480626',
              workAddress: null,
              password: null,
              verificationCode: expect.any(String),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              lastName: finalAuthorizedUser.lastName,
              fullName: `${finalAuthorizedUser.firstName} ${finalAuthorizedUser.lastName}`,
              firstName: finalAuthorizedUser.firstName,
              customerId: customer.id,
              authorizedUserId: finalAuthorizedUser.id,
            },
            customer: {
              ...omit(customer, [
                'eventCategories',
                'integrations',
                'settings',
              ]),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              settings: null,
              sections: null,
            },
            authorizedUser: {
              ...finalAuthorizedUser,
              reservationTypes: [],
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/users/register create user (GOVERNMENT)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.government,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        settings: {
          create: {
            validateUsers: true,
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      });

      const { body } = await request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: '541166480625',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              removed: false,
              removedAt: null,
              username: '541166480625',
              active: true,
              authorizedUserId: null,
              comment: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergencyNumber: null,
              alarmNumber: null,
              homeAddress: null,
              id: expect.any(String),
              idCard: null,
              image: null,
              lastAccessToMenu: null,
              customerType: 'government',
              lastStateUpdatedTime: null,
              lot: null,
              password: null,
              pushId: null,
              stateUpdatedUserId: null,
              updatedAt: expect.any(String),
              updatedById: null,
              workAddress: null,
              verificationCode: expect.any(String),
              firstName: '',
              lastName: '',
              fullName: '',
              status: 'registered',
              role: 'user',
            },
            customer: {
              ...omit(customer, ['eventCategories', 'integrations']),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              sections: null,
              settings: {
                ...customer.settings,
                updatedAt: expect.any(String),
                createdAt: expect.any(String),
              },
            },
          });
        });

      await prisma.user.updateMany({
        where: {
          id: body.id,
        },
        data: {
          status: 'active',
        },
      });

      await request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: '541166480625',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              removed: false,
              removedAt: null,
              username: '541166480625',
              active: true,
              authorizedUserId: null,
              comment: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergencyNumber: null,
              alarmNumber: null,
              homeAddress: null,
              id: expect.any(String),
              idCard: null,
              image: null,
              lastAccessToMenu: null,
              customerType: 'government',
              lastStateUpdatedTime: null,
              lot: null,
              password: null,
              pushId: null,
              stateUpdatedUserId: null,
              updatedAt: expect.any(String),
              updatedById: null,
              workAddress: null,
              verificationCode: expect.any(String),
              firstName: '',
              lastName: '',
              fullName: '',
              status: 'active',
              role: 'user',
            },
            customer: {
              ...omit(customer, ['eventCategories', 'integrations']),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              sections: null,
              settings: {
                ...customer.settings,
                updatedAt: expect.any(String),
                createdAt: expect.any(String),
              },
            },
          });
        });
    });

    it('/v1/users/register change all data user (GOVERNMENT)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia123122',
        type: CustomerType.government,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        settings: {
          create: {
            validateUsers: true,
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      });

      const customer2 = await createCustomer(prisma, {
        name: 'caba',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '55',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'patricio',
        lastName: 'medina',
        fullName: 'patricio medina',
        role: 'user',
        customerType: 'government',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });

      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: finalUser.user.username,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            user: {
              ...omit(finalUser.user, ['customer']),
              password: null,
              status: 'registered',
              verificationCode: expect.any(String),
              customerType: 'government',
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              customerId: customer.id,
            },
            customer: {
              ...omit(customer, ['eventCategories', 'integrations']),
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              alertTypes: [],
              sections: null,
              settings: {
                ...customer.settings,
                updatedAt: expect.any(String),
                createdAt: expect.any(String),
              },
            },
          });
        });
    });

    it('/v1/users/register create user (INVALID_CUSTOMER_SETTINGS) (GOVERNMENT)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.government,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });

      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: '541166480625',
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'INVALID_CUSTOMER_SETTINGS',
          });
        });
    });

    it('/v1/users/register (USER_AUTHORIZED_NOT_FOUND) (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const customer2 = await createCustomer(prisma, {
        name: 'caba',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '55',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'patricio',
        lastName: 'medina',
        fullName: 'patricio medina',
        role: 'user',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: finalUser.user.username,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'USER_AUTHORIZED_NOT_FOUND',
            statusCode: 404,
          });
        });
    });

    it('/v1/users/register (USER_AUTHORIZED_INACTIVE) (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const customer2 = await createCustomer(prisma, {
        name: 'caba',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '55',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'patricio',
        lastName: 'medina',
        fullName: 'patricio medina',
        role: 'user',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
      await prisma.authorizedUser.create({
        data: {
          firstName: 'mauricio',
          username: '1166480626',
          active: false,
          lastName: 'gallego',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: customer.id,
          username: finalUser.user.username,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'USER_AUTHORIZED_INACTIVE',
            statusCode: 403,
          });
        });
    });

    it('/v1/users/register (INVALID_CUSTOMER) (BUSINESS)', async () => {
      const { user } = await createUserAndToken(prisma, {
        username: 'test_me',
        password: '123456',
        firstName: 'Test',
        lastName: 'Me',
        fullName: 'Test Me',
        role: 'admin',
        active: true,
      });
      const customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.business,
        district: 'San Fernando',
        state: 'Buenos Aires',
        active: false,
        country: 'Argentina',
        countryCode: '54',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const customer2 = await createCustomer(prisma, {
        name: 'caba',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        countryCode: '55',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const finalUser = await createUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'patricio',
        lastName: 'medina',
        fullName: 'patricio medina',
        role: 'user',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
      await prisma.authorizedUser.create({
        data: {
          firstName: 'mauricio',
          username: '1166480626',
          active: false,
          lastName: 'gallego',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      return request(app.getHttpServer())
        .post(`/v1/users/register`)
        .send({
          customerId: finalUser.user.id,
          username: finalUser.user.username,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'INVALID_CUSTOMER',
            statusCode: 404,
          });
        });
    });
  });

  describe('contacts', () => {
    it('/v1/users/{:user}/contacts (GET) contact user list (user)', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'varsovia',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });
      const { user, token } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'List',
        lastName: 'User',
        fullName: 'List User',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await prisma.contact.createMany({
        data: [
          {
            phoneNumber: '541166480626',
            userId: user.id,
            deviceContact: {
              id: '28',
              rawId: '36',
              displayName: 'Fer Bello',
              name: {
                familyName: 'Bello',
                givenName: 'Fer',
                formatted: 'Fer Bello',
              },
              nickname: null,
              phoneNumbers: [
                {
                  id: '276',
                  pref: false,
                  value: '+5491150281459',
                  type: 'other',
                },
              ],
              emails: null,
              addresses: null,
              ims: null,
              organizations: null,
              birthday: null,
              note: '',
              photos: null,
              categories: null,
              urls: null,
            },
          },
          {
            phoneNumber: '5412312312312',
            userId: user.id,
            deviceContact: {
              id: '28',
              rawId: '36',
              displayName: 'Fer Bello',
              name: {
                familyName: 'Bello',
                givenName: 'Fer',
                formatted: 'Fer Bello',
              },
              nickname: null,
              phoneNumbers: [
                {
                  id: '276',
                  pref: false,
                  value: '+5491150281459',
                  type: 'other',
                },
              ],
              emails: null,
              addresses: null,
              ims: null,
              organizations: null,
              birthday: null,
              note: '',
              photos: null,
              categories: null,
              urls: null,
            },
          },
          {
            phoneNumber: '54112233445',
            userId: user.id,
            deviceContact: {
              id: '28',
              rawId: '36',
              displayName: 'Fer Bello',
              name: {
                familyName: 'Bello',
                givenName: 'Fer',
                formatted: 'Fer Bello',
              },
              nickname: null,
              phoneNumbers: [
                {
                  id: '276',
                  pref: false,
                  value: '+5491150281459',
                  type: 'other',
                },
              ],
              emails: null,
              addresses: null,
              ims: null,
              organizations: null,
              birthday: null,
              note: '',
              photos: null,
              categories: null,
              urls: null,
            },
          },
        ],
      });

      return request(app.getHttpServer())
        .get(`/v1/users/${user.id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .query({
          orderBy: JSON.stringify({
            phoneNumber: 'asc',
          }),
          take: 20,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              id: expect.any(String),
              phoneNumber: '54112233445',
              userId: user.id,
              createdAt: expect.any(String),
              contactUserId: null,
              updatedAt: expect.any(String),
              deviceContact: {
                id: '28',
                rawId: '36',
                displayName: 'Fer Bello',
                name: {
                  familyName: 'Bello',
                  givenName: 'Fer',
                  formatted: 'Fer Bello',
                },
                nickname: null,
                phoneNumbers: [
                  {
                    id: '276',
                    pref: false,
                    value: '+5491150281459',
                    type: 'other',
                  },
                ],
                emails: null,
                addresses: null,
                ims: null,
                organizations: null,
                birthday: null,
                note: '',
                photos: null,
                categories: null,
                urls: null,
              },
            },
            {
              id: expect.any(String),
              phoneNumber: '541166480626',
              userId: user.id,
              contactUserId: null,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              deviceContact: {
                id: '28',
                rawId: '36',
                displayName: 'Fer Bello',
                name: {
                  familyName: 'Bello',
                  givenName: 'Fer',
                  formatted: 'Fer Bello',
                },
                nickname: null,
                phoneNumbers: [
                  {
                    id: '276',
                    pref: false,
                    value: '+5491150281459',
                    type: 'other',
                  },
                ],
                emails: null,
                addresses: null,
                ims: null,
                organizations: null,
                birthday: null,
                note: '',
                photos: null,
                categories: null,
                urls: null,
              },
            },
            {
              id: expect.any(String),
              phoneNumber: '5412312312312',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              contactUserId: null,
              userId: user.id,
              deviceContact: {
                id: '28',
                rawId: '36',
                displayName: 'Fer Bello',
                name: {
                  familyName: 'Bello',
                  givenName: 'Fer',
                  formatted: 'Fer Bello',
                },
                nickname: null,
                phoneNumbers: [
                  {
                    id: '276',
                    pref: false,
                    value: '+5491150281459',
                    type: 'other',
                  },
                ],
                emails: null,
                addresses: null,
                ims: null,
                organizations: null,
                birthday: null,
                note: '',
                photos: null,
                categories: null,
                urls: null,
              },
            },
          ]);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 20,
            skip: 0,
            size: 3,
            hasMore: false,
          });
        });
    });

    it('/v1/users/${:users}/contacts (GET) properties', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
        role: Role.admin,
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'varsovia',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { user, token } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'List',
        lastName: 'User',
        fullName: 'List User',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await prisma.contact.createMany({
        data: [
          {
            phoneNumber: '5491150281459',
            userId: user.id,
            deviceContact: {
              id: '28',
              rawId: '36',
              displayName: 'Fer Bello',
              name: {
                familyName: 'Bello',
                givenName: 'Fer',
                formatted: 'Fer Bello',
              },
              nickname: null,
              phoneNumbers: [
                {
                  id: '276',
                  pref: false,
                  value: '+5491150281459',
                  type: 'other',
                },
              ],
              emails: null,
              addresses: null,
              ims: null,
              organizations: null,
              birthday: null,
              note: '',
              photos: null,
              categories: null,
              urls: null,
            },
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/users/${user.id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Contact) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('phoneNumber');
            expect(item).toHaveProperty('contactUserId');
            expect(item).toHaveProperty('userId');
            expect(item).toHaveProperty('deviceContact');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 1,
            take: 100,
            skip: 0,
            size: 1,
            hasMore: false,
          });
        });
    });

    it('/v1/users/${:users}/contacts (GET) 404 user not found', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
      });

      const customer2 = await createBusinessCustomer(prisma, {
        name: 'san fernando',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { token: token2 } = await createFinalUserAndToken(prisma, {
        username: '5411666480626',
        password: '123456',
        firstName: 'List 2',
        lastName: 'User 2',
        fullName: 'List User 2',
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .get(`/v1/users/4c1405b8-5b82-4265-8a6b-87847a2cbfdc/contacts`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            error: 'Not Found',
            message: 'USER_NOT_FOUND',
          });
        });
    });

    it('/v1/users/${:users}/contacts (POST) create contact with user in common', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
      });
      const alertType = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'varsovia',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        alertTypes: {
          createMany: {
            data: [
              {
                alertTypeId: alertType.id,
                order: 0,
              },
            ],
          },
        },
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      const { user: contact } = await createFinalUserAndToken(prisma, {
        username: '541166490626',
        password: '123456',
        firstName: 'andres',
        lastName: 'gallego',
        fullName: 'andres gallego',
      });

      const data = {
        phoneNumber: '541166490626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'andres gallego',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491166490626',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      };

      return await request(app.getHttpServer())
        .post(`/v1/users/${user.id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            phoneNumber: data.phoneNumber,
            deviceContact: data.deviceContact,
            userId: user.id,
            contactUserId: contact.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            contactAlertTypes: [
              {
                id: expect.any(String),
                alertTypeId: expect.any(String),
                alertType: {
                  id: expect.any(String),
                  name: 'Violación de perímetro',
                  type: 'perimeter-violation',
                },
                contactId: expect.any(String),
              },
            ],
          });
        });
    });

    it('/v1/users/${:users}/contacts (POST) (CONTACT_AND_USERNAME_ARE_THE_SAME)', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
        role: Role.admin,
      });
      const alertType = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });
      const customer = await createBusinessCustomer(prisma, {
        name: 'varsovia',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        alertTypes: {
          createMany: {
            data: [
              {
                alertTypeId: alertType.id,
                order: 0,
              },
            ],
          },
        },
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      const data = {
        phoneNumber: '541166480626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'andres gallego',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491166490626',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      };

      return await request(app.getHttpServer())
        .post(`/v1/users/${user.id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            error: 'Unprocessable Entity',
            message: 'CONTACT_AND_USERNAME_ARE_THE_SAME',
          });
        });
    });

    it('/v1/users/${:users}/contacts (POST) create contact without user in common', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const data = {
        phoneNumber: '541166490626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'andres gallego',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491166490626',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      };

      return await request(app.getHttpServer())
        .post(`/v1/users/${user.id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            ...data,
            userId: user.id,
            contactUserId: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            contactAlertTypes: [],
          });
        });
    });

    it('/v1/users/${:users}/contacts (POST) 404 user not found', async () => {
      const { user: admin } = await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
      });

      const customer2 = await createBusinessCustomer(prisma, {
        name: 'san fernando',
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: admin.id,
          },
        },
      });

      const { token: token2 } = await createFinalUserAndToken(prisma, {
        username: '5411666480626',
        password: '123456',
        firstName: 'List 2',
        lastName: 'User 2',
        fullName: 'List User 2',
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });

      const data = {
        phoneNumber: '541166490626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'andres gallego',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491166490626',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      };
      return await request(app.getHttpServer())
        .post(`/v1/users/4c1405b8-5b82-4265-8a6b-87847a2cbfdc/contacts`)
        .set('Authorization', `Bearer ${token2}`)
        .send(data)
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            error: 'Not Found',
            message: 'USER_NOT_FOUND',
          });
        });
    });

    it('/v1/users/${:users}/contacts (PATCH) update', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const alertType = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });

      const contactCreated = await prisma.contact.create({
        data: {
          phoneNumber: '541166490626',
          user: {
            connect: {
              id: user.id,
            },
          },
          contactAlertTypes: {
            createMany: {
              data: [
                {
                  alertTypeId: alertType.id,
                },
              ],
            },
          },
          deviceContact: {
            id: '28',
            rawId: '36',
            displayName: 'andres gallego',
            name: {
              familyName: 'gallego',
              givenName: 'andres',
              formatted: 'andres gallego',
            },
            nickname: null,
            phoneNumbers: [
              {
                id: '276',
                pref: false,
                value: '+5491166490626',
                type: 'other',
              },
            ],
            emails: null,
            addresses: null,
            ims: null,
            organizations: null,
            birthday: null,
            note: '',
            photos: null,
            categories: null,
            urls: null,
          },
        },
      });

      return await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}/contacts/${contactCreated.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '54123123123',
          alertTypes: [],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            phoneNumber: '54123123123',
            deviceContact: contactCreated.deviceContact,
            userId: user.id,
            contactUserId: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            contactAlertTypes: [],
          });
        });
    });

    it('/v1/users/${:users}/contacts (PATCH) contact not found', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      return await request(app.getHttpServer())
        .patch(
          `/v1/users/${user.id}/contacts/73f776dc-deaf-4e0e-b47f-406c6a1db4aa`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '5411234458',
          alertTypes: [],
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Not Found',
            message: 'CONTACT_NOT_FOUND',
          });
        });
    });

    it('/v1/users/${:users}/contacts (PATCH) user not found', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const contactCreated = await prisma.contact.create({
        data: {
          phoneNumber: '541166490626',
          user: {
            connect: {
              id: user.id,
            },
          },
          deviceContact: {
            id: '28',
            rawId: '36',
            displayName: 'andres gallego',
            name: {
              familyName: 'gallego',
              givenName: 'andres',
              formatted: 'andres gallego',
            },
            nickname: null,
            phoneNumbers: [
              {
                id: '276',
                pref: false,
                value: '+5491166490626',
                type: 'other',
              },
            ],
            emails: null,
            addresses: null,
            ims: null,
            organizations: null,
            birthday: null,
            note: '',
            photos: null,
            categories: null,
            urls: null,
          },
        },
      });

      return await request(app.getHttpServer())
        .patch(
          `/v1/users/73f776dc-deaf-4e0e-b47f-406c6a1db4aa/contacts/${contactCreated.id}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '11334422',
          alertTypes: [],
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Not Found',
            message: 'USER_NOT_FOUND',
          });
        });
    });

    it('/v1/users/${:users}/contacts (PATCH) alert type invalid', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const contactCreated = await prisma.contact.create({
        data: {
          phoneNumber: '541166490626',
          user: {
            connect: {
              id: user.id,
            },
          },
          deviceContact: {
            id: '28',
            rawId: '36',
            displayName: 'andres gallego',
            name: {
              familyName: 'gallego',
              givenName: 'andres',
              formatted: 'andres gallego',
            },
            nickname: null,
            phoneNumbers: [
              {
                id: '276',
                pref: false,
                value: '+5491166490626',
                type: 'other',
              },
            ],
            emails: null,
            addresses: null,
            ims: null,
            organizations: null,
            birthday: null,
            note: '',
            photos: null,
            categories: null,
            urls: null,
          },
        },
      });

      return await request(app.getHttpServer())
        .patch(`/v1/users/${user.id}/contacts/${contactCreated.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          alertTypes: ['73f776dc-deaf-4e0e-b47f-406c6a1db4aa'],
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Unprocessable Entity',
            message: 'INVALID_ALERT_TYPE',
          });
        });
    });

    it('/v1/users/${:users}/contacts (DELETE) user not authorized', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const contactCreated = await prisma.contact.create({
        data: {
          phoneNumber: '541166490626',
          user: {
            connect: {
              id: user.id,
            },
          },
          deviceContact: {
            id: '28',
            rawId: '36',
            displayName: 'andres gallego',
            name: {
              familyName: 'gallego',
              givenName: 'andres',
              formatted: 'andres gallego',
            },
            nickname: null,
            phoneNumbers: [
              {
                id: '276',
                pref: false,
                value: '+5491166490626',
                type: 'other',
              },
            ],
            emails: null,
            addresses: null,
            ims: null,
            organizations: null,
            birthday: null,
            note: '',
            photos: null,
            categories: null,
            urls: null,
          },
        },
      });

      return await request(app.getHttpServer())
        .delete(
          `/v1/users/73f776dc-deaf-4e0e-b47f-406c6a1db4aa/contacts/${contactCreated.id}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '11334422',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
          });
        });
    });

    it('/v1/users/${:users}/contacts (DELETE) contact not found', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      return await request(app.getHttpServer())
        .delete(
          `/v1/users/${user.id}/contacts/73f776dc-deaf-4e0e-b47f-406c6a1db4aa`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          phoneNumber: '541111490626',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            message: 'CONTACT_NOT_FOUND',
          });
        });
    });

    it('/v1/users/${:users}/contacts (DELETE) delete contact', async () => {
      const { token, user } = await createFinalUserAndToken(prisma, {
        username: '541166480626',
        password: '123456',
        firstName: 'mauricio',
        lastName: 'gallego',
        fullName: 'mauricio gallego',
      });

      const alertType = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });

      const contactCreated = await prisma.contact.create({
        data: {
          phoneNumber: '541166490626',
          user: {
            connect: {
              id: user.id,
            },
          },
          contactAlertTypes: {
            createMany: {
              data: [
                {
                  alertTypeId: alertType.id,
                },
              ],
            },
          },
          deviceContact: {
            id: '28',
            rawId: '36',
            displayName: 'andres gallego',
            name: {
              familyName: 'gallego',
              givenName: 'andres',
              formatted: 'andres gallego',
            },
            nickname: null,
            phoneNumbers: [
              {
                id: '276',
                pref: false,
                value: '+5491166490626',
                type: 'other',
              },
            ],
            emails: null,
            addresses: null,
            ims: null,
            organizations: null,
            birthday: null,
            note: '',
            photos: null,
            categories: null,
            urls: null,
          },
        },
      });

      return await request(app.getHttpServer())
        .delete(`/v1/users/${user.id}/contacts/${contactCreated.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

describe('UsersController (e2e) (delete user)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customer: Customer;
  let admin: User;
  const ATENDIDO = '4479724b-0825-45a4-87d0-d6e916c90d98';
  const EMITIDO = '2defbd37-1d64-4321-83cc-776ae6b011de';
  const CANCELLED = 'b69e4f8f-529c-4f51-a0e8-28caaa3568f8';
  const GOLF = 'd0128144-17ac-47e7-8080-a52847712c2c';
  const PRACTICE_9_HOLES = '5e357d4a-f457-4fa1-9980-0f690c443d7e';
  const MATCH = 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a';
  const SUPPLIERS = '2de3865c-51e2-4270-aa26-8f653eaa848c';
  const POOL = '2f56ce53-06c7-4d88-8e49-9d6c7c5792e6';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule, UsersModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(ConfigurationService)
      .useValue(ConfigurationServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();

    admin = (
      await createAdminUserAndToken(prisma, {
        username: 'admin@mail.com',
        password: '123456',
        firstName: 'admin',
        lastName: 'User',
        fullName: 'admin User',
      })
    ).user;

    customer = await createBusinessCustomer(prisma, {
      name: 'varsovia',
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      updatedBy: {
        connect: {
          id: admin.id,
        },
      },
    });

    await prisma.eventState.createMany({
      data: [
        {
          id: CANCELLED,
          name: 'Cancelado',
        },
        {
          id: EMITIDO,
          name: 'Emitido',
        },
        {
          id: ATENDIDO,
          name: 'Atendido',
        },
      ],
    });
    await prisma.eventType.createMany({
      data: [
        {
          id: SUPPLIERS,
          code: 'AA130',
          updatedById: admin.id,
          title: 'PROVEEDORES',
          active: true,
          description: false,
          attachment: false,
          monitor: true,
          addToStatistics: true,
          notifyUser: true,
          notifySecurityChief: false,
          notifySecurityGuard: false,
          additionalNotifications: '',
          customerId: customer.id,
          autoCancelAfterExpired: true,
          allowsMultipleAuthorized: false,
          requiresDni: false,
          isPermanent: false,
          lotFrom: null,
          lotTo: null,
          emergency: false,
          requiresPatent: false,
          generateQr: false,
          reservation: false,
          notifyGiroVision: false,
          gvEntryTypeId: null,
          gvGuestTypeId: null,
        },
      ],
    });
    await prisma.reservationType.createMany({
      data: [
        {
          id: GOLF,
          code: 'Golf',
          days: 5,
          display: 'day',
          groupCode: 'GO',
          numberOfPending: 5,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:27:48'),
          updatedAt: new Date('2021-02-01 13:27:48'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
        },
        {
          id: POOL,
          code: 'Pileta',
          days: 1,
          display: 'day',
          groupCode: 'PI',
          numberOfPending: 0,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:28:18'),
          updatedAt: new Date('2021-02-01 13:28:18'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
        },
      ],
    });
    await prisma.reservationSpace.createMany({
      data: [
        {
          id: MATCH,
          code: 'Cancha',
          schedule: {
            mon: { from: '0800', to: '1700' },
            tue: { from: '0800', to: '1700' },
            wed: { from: '0800', to: '1700' },
            thu: { from: '0800', to: '1700' },
            fri: { from: '0800', to: '1700' },
            sat: { from: '0800', to: '1700' },
            sun: { from: '0800', to: '1700' },
          },
          interval: 12,
          notifyParticipants: true,
          additionalNumbers: '166480644',
          active: true,
          reservationTypeId: GOLF,
          eventTypeId: SUPPLIERS,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    await prisma.reservationMode.createMany({
      data: [
        {
          id: PRACTICE_9_HOLES,
          name: 'PRACTICE_9_HOLES',
          maxDuration: 90,
          maxPeople: 4,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          updatedById: admin.id,
          inactivityTime: 90,
          reservationTypeId: GOLF,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
    await app.close();
  });

  it('/v1/users/{:user}/delete (DELETE) remove empty user', async () => {
    const { user, token } = await createFinalUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'List',
      lastName: 'User',
      fullName: 'List User',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await request(app.getHttpServer())
      .delete(`/v1/users/${user.id}/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: user.username.substring(user.username.length - 4),
      })
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          customerId: customer.id,
          deletedAt: null,
          authorizedUserId: null,
          deletionRequestedAt: expect.any(String),
          id: expect.any(String),
          userId: user.id,
          username: user.username,
        });
      });

    const userDeleted = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(userDeleted).toMatchObject({
      username: `Deleted[${user.username}]`,
      removed: true,
      active: false,
      pushId: null,
      removedAt: expect.any(Date),
    });
  });

  it('/v1/users/{:user}/delete (DELETE) remove empty user (invalid user)', async () => {
    const { user, token } = await createFinalUserAndToken(prisma, {
      username: '541166480622',
      password: '123456',
      firstName: 'List',
      lastName: 'User',
      fullName: 'List User',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await request(app.getHttpServer())
      .delete(`/v1/users/${user.id}/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: '12312312',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          error: 'Unprocessable Entity',
          message: 'INVALID_USERNAME',
          statusCode: 422,
        });
      });
  });

  it('/v1/users/{:user}/delete (DELETE) remove empty user (ACTION_NOT_ALLOWED)', async () => {
    const { user, token } = await createFinalUserAndToken(prisma, {
      username: '5411664822626',
      password: '123456',
      firstName: 'List',
      lastName: 'User',
      fullName: 'List User',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await request(app.getHttpServer())
      .delete(`/v1/users/${admin.id}/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: user.username.substring(user.username.length - 4),
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          error: 'Unprocessable Entity',
          message: 'ACTION_NOT_ALLOWED',
          statusCode: 422,
        });
      });
  });

  it('/v1/users/{:user}/delete (DELETE) user with reservation', async () => {
    const { user, token } = await createFinalUserAndToken(prisma, {
      username: '3112311759',
      password: '123456',
      firstName: 'camilo',
      lastName: 'gallego',
      fullName: 'camilo gallego',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    await prisma.reservation.createMany({
      data: [
        {
          fromDate: new Date('2021-02-01 16:00:00'),
          toDate: new Date('2021-02-01 16:12:00'),
          inactiveToDate: new Date('2021-02-01 18:00:00'),
          numberOfGuests: 1,
          createdById: user.id,
          lot: 'DS123456',
          customerId: customer.id,
          reservationTypeId: GOLF,
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          eventStateId: EMITIDO,
        },
        {
          fromDate: new Date('2021-02-02 16:00:00'),
          toDate: new Date('2021-02-02 16:12:00'),
          inactiveToDate: new Date('2021-02-02 18:00:00'),
          numberOfGuests: 1,
          createdById: user.id,
          lot: 'DS123456',
          customerId: customer.id,
          reservationTypeId: POOL,
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          eventStateId: ATENDIDO,
        },
      ],
    });
    await request(app.getHttpServer())
      .delete(`/v1/users/${user.id}/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: user.username.substring(user.username.length - 4),
      })
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          customerId: customer.id,
          deletedAt: null,
          authorizedUserId: null,
          deletionRequestedAt: expect.any(String),
          id: expect.any(String),
          userId: user.id,
          username: user.username,
        });
      });

    const count = await prisma.reservation.count({
      where: {
        eventStateId: CANCELLED,
      },
    });

    expect(count).toBe(2);
  });

  it('/v1/users/{:user}/delete (DELETE) user with events', async () => {
    const { user, token } = await createFinalUserAndToken(prisma, {
      username: '1126657907',
      password: '123456',
      firstName: 'jose',
      lastName: 'gallego',
      fullName: 'jose gallego',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await prisma.event.createMany({
      data: [
        {
          eventTypeId: SUPPLIERS,
          from: new Date('2020-04-22 03:00:00'),
          to: new Date('2020-04-23 02:59:00'),
          changeLog: '',
          eventStateId: EMITIDO,
          customerId: customer.id,
          userId: user.id,
        },
        {
          eventTypeId: SUPPLIERS,
          eventStateId: ATENDIDO,
          customerId: customer.id,
          userId: user.id,
          from: new Date('2020-04-13 03:00:00'),
          to: new Date('2020-04-14 02:59:00'),
          changeLog: '',
        },
      ],
    });
    await request(app.getHttpServer())
      .delete(`/v1/users/${user.id}/delete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: user.username.substring(user.username.length - 4),
      })
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          authorizedUserId: null,
          customerId: customer.id,
          deletedAt: null,
          deletionRequestedAt: expect.any(String),
          id: expect.any(String),
          userId: user.id,
          username: user.username,
        });
      });

    const count = await prisma.event.count({
      where: {
        eventStateId: CANCELLED,
      },
    });

    expect(count).toBe(2);
  });
});
