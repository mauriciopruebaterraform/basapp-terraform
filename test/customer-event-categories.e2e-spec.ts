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
import { FakeCustomer } from './fakes/customer.fake';
import {
  Customer as CustomerPrisma,
  Role,
  User,
  EventCategory,
  CustomerEventCategory,
} from '@prisma/client';
import { createFinalUserAndToken, createUserAndToken } from './utils/users';
import { cleanData } from './utils/clearData';

describe('CustomerEventCategoriesController (e2e)', () => {
  const customerData = new FakeCustomer().getMockFactory().plain().many(10);
  let app: INestApplication;
  let prisma: PrismaService;
  const listEventCategories: EventCategory[] = [];
  const customersCreated: CustomerPrisma[] = [];
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

    for await (const alertType of [
      'un evento',
      'un evento dos',
      'un evento tres',
    ]) {
      const event = await prisma.eventCategory.create({
        data: {
          title: alertType,
        },
      });
      listEventCategories.push(event);
    }
    await prisma.permission.create({
      data: {
        id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
        action: 'configure-category',
        name: 'configuracion de eventos',
        category: 'customer',
        statesman: false,
        monitoring: true,
      },
    });
    for await (const customer of customerData) {
      const customerCreated = await prisma.customer.create({
        data: {
          ...customer,
          image: undefined,
          updatedById: result.user.id,
          eventCategories: {
            create: listEventCategories.map((eventCategory, idx) => ({
              category: { connect: { id: eventCategory.id } },
              order: idx,
              updatedBy: {
                connect: {
                  id: result.user.id,
                },
              },
            })),
          },
        },
        include: {
          eventCategories: {
            include: {
              category: true,
            },
            orderBy: {
              order: 'asc',
            },
            where: {
              active: true,
            },
          },
        },
      });
      customersCreated.push(customerCreated);
    }
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  it('/v1/customers-event-categories (GET) customer list', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customersCreated[0].id}/event-categories`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: CustomerEventCategory) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('order');
          expect(item).toHaveProperty('active');
          expect(item).toHaveProperty('reservationTypeId');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('updatedById');
          expect(item).toHaveProperty('customerId');
          expect(item).toHaveProperty('categoryId');
        });
        expect(res.body.pagination).toBeInstanceOf(Object);
        expect(res.body.pagination).toEqual({
          total: listEventCategories.length,
          take: 100,
          skip: 0,
          size: listEventCategories.length,
          hasMore: false,
        });
      });
  });

  it('/v1/customers-event-categories (GET) customer list with final user', async () => {
    const finalUser = await createFinalUserAndToken(prisma, {
      customer: {
        connect: {
          id: customersCreated[0].id,
        },
      },
    });
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customersCreated[0].id}/event-categories`)
      .set('Authorization', `Bearer ${finalUser.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: CustomerEventCategory) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('order');
          expect(item).toHaveProperty('active');
          expect(item).toHaveProperty('reservationTypeId');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('updatedById');
          expect(item).toHaveProperty('customerId');
          expect(item).toHaveProperty('categoryId');
        });
        expect(res.body.pagination).toBeInstanceOf(Object);
        expect(res.body.pagination).toEqual({
          total: listEventCategories.length,
          take: 100,
          skip: 0,
          size: listEventCategories.length,
          hasMore: false,
        });
      });
  });

  it('/v1/customers-event-categories (GET) customer list statesman', async () => {
    const userStatesman = await createUserAndToken(prisma, {
      username: 'new-customer2@gmail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.statesman,
      active: true,
    });

    return await request(app.getHttpServer())
      .get(`/v1/customers/${customersCreated[0].id}/event-categories`)
      .set('Authorization', `Bearer ${userStatesman.token}`)
      .expect(403)
      .expect((res) => {
        expect(res.body).toMatchObject({
          error: 'Forbidden',
          statusCode: 403,
          message: 'AUTHORIZATION_REQUIRED',
        });
      });
  });

  it('/v1/customers-event-categories (GET) customer list monitoring', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'new-customer3@gmail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.monitoring,
      active: true,
      customer: {
        connect: {
          id: customersCreated[0].id,
        },
      },
    });

    return await request(app.getHttpServer())
      .get(`/v1/customers/${customersCreated[0].id}/event-categories`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: CustomerEventCategory) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('order');
          expect(item).toHaveProperty('active');
          expect(item).toHaveProperty('reservationTypeId');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('updatedById');
          expect(item).toHaveProperty('customerId');
          expect(item).toHaveProperty('categoryId');
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

  describe('/v1/customers-event-categories (PATCH)', () => {
    it('/v1/customers-event-categories (PATCH)', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer4@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customersCreated[0].id,
          },
        },
      });

      const findCustomerEvent = await prisma.customerEventCategory.findFirst({
        where: {
          customerId: customersCreated[0].id,
        },
      });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${findCustomerEvent?.id}/event-categories`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          order: 3,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            ...findCustomerEvent,
            order: 3,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
          });
        });
    });

    it('/v1/customers-event-categories (PATCH) 403 forbidden', async () => {
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
            id: customersCreated[1].id,
          },
        },
      });

      const findCustomerEvent = await prisma.customerEventCategory.findFirst({
        where: {
          customerId: customersCreated[0].id,
        },
      });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${findCustomerEvent?.id}/event-categories`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          order: 3,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 403,
            error: 'Forbidden',
            message: 'INVALID_UPDATE_EVENT',
          });
        });
    });
  });
});
