/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, Lot } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';

describe('NotificationTemplatesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };

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
      username: 'new-customer@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.admin,
      active: true,
    });

    token = result.token;
    user = result.user;

    customer = await createCustomer(prisma, {
      name: 'divercity',
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
    customer2 = await createCustomer(prisma, {
      name: 'bogota',
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
    statesman = await createUserAndToken(prisma, {
      username: 'james@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.statesman,
      active: true,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await createPermission(prisma, {
      action: 'list-notification-templates',
      name: 'listado de notificationes',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-notification-template',
      name: 'listado de notificationes',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'modify-notification-template',
      name: 'modifica la plantilla de notificationes',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.notificationTemplate.createMany({
      data: [
        {
          title: 'alertas',
          description: 'hay que estar pendiente de los alertas',
          customerId: customer.id,
        },
        {
          title: 'robo',
          description: 'hay que estar pendiente de los robos',
          customerId: customer.id,
        },
        {
          title: 'violacion',
          description: 'hay que estar pendiente de los violacion',
          customerId: customer.id,
        },
        {
          title: 'ladrones',
          description: 'hay que estar pendiente de los ladrones',
          customerId: customer2.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${id}/notification-templates (GET)', () => {
    it('/v1/customers/${id}/notification-templates (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/notification-templates`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            title: {
              contains: 'robo',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              title: 'robo',
              description: 'hay que estar pendiente de los robos',
              image: null,
              active: true,
              customerId: customer.id,
            },
          ]);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 1,
            take: 20,
            skip: 0,
            size: 1,
            hasMore: false,
          });
        });
    });

    it.each([
      ['alertas', 0],
      ['robo', 1],
    ])(
      '/v1/customers/${id}/notification-templates (statesman) allows pagination (GET)',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/notification-templates`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            take: 1,
            skip: b,
            orderBy: JSON.stringify({
              title: 'asc',
            }),
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.results).toBeInstanceOf(Array);
            expect(res.body.results[0]).toMatchObject({
              title: a,
              customerId: customer.id,
            });
            expect(res.body.pagination).toBeInstanceOf(Object);
            expect(res.body.pagination).toEqual({
              total: 3,
              take: 1,
              skip: b,
              size: 1,
              hasMore: b !== 2,
            });
          });
      },
    );

    it('/v1/customers/${id}/notification-templates (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/notification-templates`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Lot) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('image');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 100,
            skip: 0,
            size: 3,
            hasMore: false,
          });
        });
    });
  });

  describe('/v1/customers/${id}/notification-templates (POST)', () => {
    it('/v1/customers/${id}/notification-templates (POST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/notification-templates`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'alerta numero 3',
          description: 'esto sirve para hacer otra template de notifiacicion',
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            id: expect.any(String),
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            active: true,
            title: 'alerta numero 3',
            description: 'esto sirve para hacer otra template de notifiacicion',
            customerId: customer.id,
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          });
        });
    });

    it('/v1/customers/${id}/notification-templates (POST) 403 forbidden', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/notification-templates`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'Tenis',
          description: 'otra descripcion mas',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 403,
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
          });
        });
    });
  });

  describe('/v1/customers/${customer}/notification-templates/${id} (PATCH)', () => {
    it('/v1/customers/${customer}/notification-templates/${id} (PATCH)', async () => {
      const notificationTemplate = await prisma.notificationTemplate.create({
        data: {
          title: 'gritos',
          description: 'cuando una persona grita mucho, se activa la alarma',
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer?.id}/notification-templates/${notificationTemplate.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            id: expect.any(String),
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            active: false,
            title: 'gritos',
            description: 'cuando una persona grita mucho, se activa la alarma',
            customerId: customer.id,
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          });
        });
    });

    it('/v1/customers/${customer}/notification-templates/${id} (PATCH)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer?.id}/notification-templates/d4451c9a-827e-4a08-95eb-35a95d5f1c24`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 422,
            message: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/notification-templates/${id} (PATCH)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer2?.id}/notification-templates/d4451c9a-827e-4a08-95eb-35a95d5f1c24`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 403,
            message: 'AUTHORIZATION_REQUIRED',
            error: 'Forbidden',
          });
        });
    });
  });
});
