import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';
import { CustomerType, Role, User } from '@prisma/client';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });

    // Set the validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();

    const result = await createUserAndToken(prisma, {
      username: 'admin@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.admin,
      active: true,
    });

    user = result.user;
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/users/${id}/notifications', () => {
    let customer, finalUser, finalUser2;
    const notification1 = '908f71de-ad14-4698-b808-27b64e60b446';
    const notification2 = '59e7cbd8-a0ac-435e-9073-04810560faae';
    const notification3 = '39f14445-0ee5-47a1-8b3e-1a2dde2833a6';
    beforeAll(async () => {
      customer = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.business,
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

      finalUser = await createUserAndToken(prisma, {
        username: '54112311755',
        password: '123456',
        firstName: 'List',
        lastName: 'User',
        fullName: 'List User',
        role: Role.user,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      finalUser2 = await createUserAndToken(prisma, {
        username: '54112311759',
        password: '123456',
        firstName: 'List',
        lastName: 'User',
        fullName: 'List User',
        role: Role.user,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await prisma.notification.createMany({
        data: [
          {
            id: notification1,
            title: 'Ud. tiene una visita esperando en la guardia',
            description:
              'PEDIDOS YA se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
            createdAt: new Date('2021-12-05 20:00:32'),
            userId: finalUser2.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            notificationType: 'authorization',
          },
          {
            id: notification3,
            title: 'Ud. tiene una visita esperando en la armario',
            description:
              'Remis se encuentra esperando en el armario. Por favor ingrese a Basapp CyB para autorizarlo.',

            createdAt: new Date('2021-12-04 20:00:32'),
            userId: finalUser2.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            notificationType: 'authorization',
          },
          {
            id: notification2,
            title: 'Ud. tiene una visita esperando en la casa',
            description:
              'RAPPI se encuentra esperando en la casa. Por favor ingrese a Basapp CyB para autorizarlo.',
            createdAt: new Date('2021-12-03 20:00:32'),
            userId: finalUser.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            notificationType: 'authorization',
          },
        ],
      });

      await prisma.notificationUser.createMany({
        data: [
          {
            userId: finalUser.user.id,
            notificationId: notification1,
          },
        ],
      });
      await prisma.notificationUser.createMany({
        data: [
          {
            userId: finalUser.user.id,
            notificationId: notification2,
          },
          {
            userId: finalUser2.user.id,
            notificationId: notification3,
          },
        ],
      });
    });

    it('/v1/users/{id}/notifications (GET) contact user list (user)', async () => {
      return request(app.getHttpServer())
        .get(`/v1/users/${finalUser.user.id}/notifications`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .query({
          orderBy: JSON.stringify({
            createdAt: 'asc',
          }),
          take: 20,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              id: expect.any(String),
              notificationId: expect.any(String),
              userId: expect.any(String),
              read: false,
              createdAt: expect.any(String),
              notification: {
                id: notification1,
                title: 'Ud. tiene una visita esperando en la guardia',
                description:
                  'PEDIDOS YA se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
                customerId: customer.id,
                emergency: false,
                fromLot: null,
                eventId: null,
                toLot: null,
                alertId: null,
                trialPeriod: false,
                image: null,
                sendAt: expect.any(String),
                authorizationRequestId: null,
                locationId: null,
                notificationType: 'authorization',
                userId: expect.any(String),
                createdAt: expect.any(String),
              },
            },
            {
              id: expect.any(String),
              notificationId: expect.any(String),
              read: false,
              userId: expect.any(String),
              createdAt: expect.any(String),
              notification: {
                id: notification2,
                title: 'Ud. tiene una visita esperando en la casa',
                description:
                  'RAPPI se encuentra esperando en la casa. Por favor ingrese a Basapp CyB para autorizarlo.',
                createdAt: expect.any(String),
                customerId: customer.id,
                eventId: null,
                trialPeriod: false,
                emergency: false,
                image: null,
                alertId: null,
                locationId: null,
                sendAt: expect.any(String),
                fromLot: null,
                authorizationRequestId: null,
                userId: expect.any(String),
                toLot: null,
                notificationType: 'authorization',
              },
            },
          ]);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 2,
            take: 20,
            skip: 0,
            size: 2,
            hasMore: false,
          });
        });
    });

    it('/v1/users/${id}/notifications (GET) properties', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/users/${finalUser.user.id}/notifications`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item) => {
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
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 2,
            take: 100,
            skip: 0,
            size: 2,
            hasMore: false,
          });
        });
    });

    it('/v1/users/${id}/notifications (GET) 404 user not found', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/users/4c1405b8-5b82-4265-8a6b-87847a2cbfdc/notifications`)
        .set('Authorization', `Bearer ${finalUser2.token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            error: 'Not Found',
            message: 'USER_NOT_FOUND',
          });
        });
    });
  });
});
