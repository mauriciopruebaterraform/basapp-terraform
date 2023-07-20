import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { Role, User } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { errorCodes } from '@src/auth/auth.constants';
import { cleanData } from './utils/clearData';
import { createPermission } from './utils/permission';
import { PubSub, Topic } from '@google-cloud/pubsub';
import { mockDeep } from 'jest-mock-extended';
import { createCustomer } from './utils/customer';
import { CustomerType } from '@prisma/client';
import { Customer } from '@prisma/client';

describe('ConfigurationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let customer: Customer;
  let statesman: { user: User; token: string };

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    prisma = app.get(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    const result = await createUserAndToken(prisma, {
      username: 'permissions-test-user',
      password: '123456',
      firstName: 'Permissions',
      lastName: 'Test',
      fullName: 'Permissions Test',
      role: Role.admin,
    });

    token = result.token;

    customer = await createCustomer(prisma, {
      name: 'harvard',
      type: CustomerType.business,
      active: true,
      district: 'San Fernando',
      state: 'Buenos Aires',
      country: 'Argentina',
      countryCode: '54',
      updatedBy: {
        connect: {
          id: result.user.id,
        },
      },
    });

    statesman = await createUserAndToken(prisma, {
      username: 'permissions-test-user-not-admin-2',
      password: '123456',
      firstName: 'Permissions',
      lastName: 'Test',
      fullName: 'Permissions Test',
      role: Role.statesman,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/configuration/sms (PATCH)', () => {
    it('/v1/configuration/sms (PATCH)', async () => {
      const worker = await prisma.smsProvider.create({
        data: {
          id: '52b75978-ff1b-4df1-a94a-be87c5fba4c6',
          provider: 'massive',
        },
      });

      await prisma.smsProvider.create({
        data: {
          id: 'fcb06c28-b592-4d1b-9753-4d4686332454',
          provider: 'aws',
        },
      });

      return request(app.getHttpServer())
        .patch(`/v1/configuration/sms`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: worker.id,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: worker.id,
            provider: 'massive',
            active: true,
            description: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('/v1/configuration/sms (PATCH) statesman', async () => {
      return request(app.getHttpServer())
        .patch(`/v1/configuration/sms`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          id: 'fcb06c28-b592-4d1b-9753-4d4686332451',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: errorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/configuration/sms (PATCH) bad request', async () => {
      return request(app.getHttpServer())
        .patch(`/v1/configuration/sms`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          provider: 'sssss',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'property provider should not exist',
              'id must be a UUID',
              'id should not be empty',
            ],
          });
        });
    });
  });

  describe('csv', () => {
    beforeAll(async () => {
      await createPermission(prisma, {
        action: 'list-authorized-users',
        name: 'listado de usuarios habilitados',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'list-events',
        name: 'listado de eventos',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'list-reservations',
        name: 'listado de reservas',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'list-alerts',
        name: 'listado de alertas',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'list-users',
        name: 'listado de usuarios',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
    });
    it('/v1/customers/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);

      await request(app.getHttpServer())
        .get(`/v1/customers/csv`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('/v1/customers/{:customer}/authorized-users/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/authorized-users/csv`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200);

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('/v1/customers/{:customer}/events/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);

      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/events/csv`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200);

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('/v1/customers/{:customer}/reservations/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);

      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservations/csv`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200);

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('/v1/users/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);

      await request(app.getHttpServer())
        .get(`/v1/users/csv`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200);
      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });

    it('/v1/alerts/csv (GET)', async () => {
      const topicMock = mockDeep<Topic>({
        publishMessage: jest.fn(),
      });
      PubSub.prototype.topic = jest.fn().mockReturnValue(topicMock);

      await request(app.getHttpServer())
        .get(`/v1/alerts/csv`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200);

      expect(PubSub.prototype.topic).toBeCalledTimes(1);
      expect(topicMock.publishMessage).toBeCalledTimes(1);
    });
  });
});
