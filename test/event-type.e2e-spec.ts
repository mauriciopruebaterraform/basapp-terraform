import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, EventType } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';

describe('EventTypeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
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
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${customer}/event-types', () => {
    let customer: Customer;
    let statesman: { user: User; token: string };
    beforeAll(async () => {
      customer = await createCustomer(prisma, {
        name: 'papa',
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
        username: 'new-customer2@mail.com',
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

      await prisma.eventType.createMany({
        data: [
          {
            title: 'test 1',
            code: 'test 1',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            title: 'test 2',
            code: 'test 2',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            title: 'test 3',
            code: 'test 3',
            customerId: customer.id,
            updatedById: user.id,
          },
        ],
      });
    });
    it('/v1/customers/${customer}/event-types (admin)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/event-types`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('lotFrom');
            expect(item).toHaveProperty('lotTo');
            expect(item).toHaveProperty('additionalNotifications');
            expect(item).toHaveProperty('qrFormat');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('attachment');
            expect(item).toHaveProperty('monitor');
            expect(item).toHaveProperty('addToStatistics');
            expect(item).toHaveProperty('notifyUser');
            expect(item).toHaveProperty('notifySecurityChief');
            expect(item).toHaveProperty('notifySecurityGuard');
            expect(item).toHaveProperty('autoCancelAfterExpired');
            expect(item).toHaveProperty('allowsMultipleAuthorized');
            expect(item).toHaveProperty('requiresDni');
            expect(item).toHaveProperty('isPermanent');
            expect(item).toHaveProperty('emergency');
            expect(item).toHaveProperty('requiresPatent');
            expect(item).toHaveProperty('generateQr');
            expect(item).toHaveProperty('reservation');
            expect(item).toHaveProperty('notifyGiroVision');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('gvEntryTypeId');
            expect(item).toHaveProperty('gvGuestTypeId');
            expect(item).toHaveProperty('updatedById');
            expect(item).toHaveProperty('eventCategoryId');
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
    it('/v1/customers/${customer}/event-types (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/event-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('lotFrom');
            expect(item).toHaveProperty('lotTo');
            expect(item).toHaveProperty('additionalNotifications');
            expect(item).toHaveProperty('qrFormat');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('attachment');
            expect(item).toHaveProperty('monitor');
            expect(item).toHaveProperty('addToStatistics');
            expect(item).toHaveProperty('notifyUser');
            expect(item).toHaveProperty('notifySecurityChief');
            expect(item).toHaveProperty('notifySecurityGuard');
            expect(item).toHaveProperty('autoCancelAfterExpired');
            expect(item).toHaveProperty('allowsMultipleAuthorized');
            expect(item).toHaveProperty('requiresDni');
            expect(item).toHaveProperty('isPermanent');
            expect(item).toHaveProperty('emergency');
            expect(item).toHaveProperty('requiresPatent');
            expect(item).toHaveProperty('generateQr');
            expect(item).toHaveProperty('reservation');
            expect(item).toHaveProperty('notifyGiroVision');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('gvEntryTypeId');
            expect(item).toHaveProperty('gvGuestTypeId');
            expect(item).toHaveProperty('updatedById');
            expect(item).toHaveProperty('eventCategoryId');
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
    it('/v1/customers/${customer}/event-types (GET) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'lanus',
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
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer5@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer2?.id}/event-types`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
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

    it('/v1/customers/${customer}/event-types (POST)', async () => {
      await prisma.permission.create({
        data: {
          name: 'create event type',
          category: 'create event',
          action: 'create-event-type',
          monitoring: true,
        },
      });
      const customer2 = await createCustomer(prisma, {
        name: 'papa222',
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
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer63@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/event-types`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test code',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            eventCategoryId: null,
            title: 'test',
            code: 'test code',
          });
        });
    });

    it('/v1/customers/${customer}/event-types (POST) 422 code exist', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer6d3@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-types`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test 1',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'ER_DUP_ENTRY',
          });
        });
    });
    it('/v1/customers/${customer}/event-types (POST) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'papa23',
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
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer35@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/event-types`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test code',
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

    it('/v1/customers/${customer}/event-types (POST) 403 forbidden', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'test',
          code: 'test 1',
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
    it('/v1/customer/${customer}/event-types/${id} (PATCH)', async () => {
      await prisma.permission.create({
        data: {
          name: 'modify-event-type',
          category: 'modify-event-type',
          action: 'modify-event-type',
          monitoring: true,
          statesman: true,
        },
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
              id: user.id,
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
      const eventCreate = await prisma.eventType.create({
        data: {
          title: 'test 12',
          code: 'test 12',
          eventCategoryId: customerEventCategory.id,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/event-types/${eventCreate.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
          eventCategoryId: null,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: false,
            id: expect.any(String),
            updatedById: statesman.user.id,
            customerId: customer.id,
            eventCategoryId: null,
          });
        });
    });

    it('/v1/customer/${customer}/event-types/${id} (PATCH) validate event category field', async () => {
      const eventCategory = await prisma.eventCategory.create({
        data: {
          title: 'Visitass',
        },
      });
      const customerEventCategory = await prisma.customerEventCategory.create({
        data: {
          updatedBy: {
            connect: {
              id: user.id,
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
      const eventCreate = await prisma.eventType.create({
        data: {
          title: 'Basquet',
          code: 'Basquet',
          eventCategoryId: customerEventCategory.id,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/event-types/${eventCreate.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
          eventCategoryId: customerEventCategory.id,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: false,
            id: expect.any(String),
            updatedById: statesman.user.id,
            customerId: customer.id,
            eventCategoryId: customerEventCategory.id,
          });
        });
    });
    it('/v1/customer/${customer}/event-types/${id} (PATCH) (event not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/event-types/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 404,
            error: 'Not Found',
            message: 'EVENT_TYPE_NOT_FOUND',
          });
        });
    });
    it('/v1/customers/${customer}/event-types (patch) 422 code exist', async () => {
      const eventCreate = await prisma.eventType.create({
        data: {
          title: 'test 13',
          code: 'test 13',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer6d13@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/event-types/${eventCreate.id}`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test 1',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'ER_DUP_ENTRY',
          });
        });
    });
  });
});
