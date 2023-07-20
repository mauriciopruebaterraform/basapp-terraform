import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { Customer } from '@src/customers/entities/customer.entity';
import { CustomerType, ReservationType, Role, User } from '@prisma/client';
import { createStatesmanUserAndToken, createUserAndToken } from './utils/users';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { errorCodes } from '@src/customers/reservation-type/reservation-type.constants';

describe('ReservationTypeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;
  let finallyUser: { user: User; token: string };
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

    user = result.user;

    customer = await createCustomer(prisma, {
      name: 'harvard',
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
      action: 'list-reservation-types',
      name: 'listado de tipos de reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-reservation-type',
      name: 'crear tipos de reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.permission.create({
      data: {
        name: 'modify-reservation-type',
        category: 'modify-reservation-type',
        action: 'modify-reservation-type',
        monitoring: true,
        statesman: true,
      },
    });
    await prisma.reservationType.createMany({
      data: [
        {
          code: 'Tenis',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
          customerId: customer2.id,
          createdAt: new Date('2021-02-01 13:27:10'),
          updatedAt: new Date('2021-09-04 15:21:14'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
        },
        {
          code: 'Futbol',
          days: 1,
          display: 'day',
          groupCode: 'FU',
          numberOfPending: 0,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:27:28'),
          updatedAt: new Date('2021-02-01 13:27:28'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
        },
        {
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

    finallyUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'raul',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'raul arias',
      role: Role.user,
      active: true,
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

  describe('/v1/customers/${customer}/reservation-types (GET)', () => {
    it('/v1/customers/${customer}/reservation-types (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            active: true,
            code: {
              contains: 'Pileta',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              code: 'Pileta',
              days: 1,
              display: 'day',
              groupCode: 'PI',
              numberOfPending: 0,
              customerId: customer.id,
              termsAndConditions: false,
              minDays: 0,
              maxPerMonth: null,
              minDaysBetweenReservation: null,
              active: true,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              pendingPerLot: false,
              allowsSimultaneous: false,
              requireConfirmation: false,
              daysSecondTime: null,
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

    it('/v1/customers/${customer}/reservation-types (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-types`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            active: true,
            code: {
              contains: 'Pileta',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              code: 'Pileta',
              days: 1,
              display: 'day',
              groupCode: 'PI',
              numberOfPending: 0,
              customerId: customer.id,
              termsAndConditions: false,
              minDays: 0,
              maxPerMonth: null,
              minDaysBetweenReservation: null,
              active: true,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              pendingPerLot: false,
              allowsSimultaneous: false,
              requireConfirmation: false,
              daysSecondTime: null,
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
      ['Futbol', 0],
      ['Golf', 1],
      ['Pileta', 2],
    ])(
      '/v1/customers/${customer}/reservation-types (statesman) allows pagination (GET)',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/reservation-types`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            take: 1,
            skip: b,
            orderBy: JSON.stringify({
              code: 'asc',
            }),
            where: JSON.stringify({
              active: true,
            }),
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.results).toBeInstanceOf(Array);
            expect(res.body.results[0]).toMatchObject({
              code: a,
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

    it('/v1/customers/${customer}/reservation-types (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: ReservationType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('days');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('minDays');
            expect(item).toHaveProperty('maxPerMonth');
            expect(item).toHaveProperty('minDaysBetweenReservation');
            expect(item).toHaveProperty('termsAndConditions');
            expect(item).toHaveProperty('display');
            expect(item).toHaveProperty('groupCode');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('numberOfPending');
            expect(item).toHaveProperty('pendingPerLot');
            expect(item).toHaveProperty('allowsSimultaneous');
            expect(item).toHaveProperty('requireConfirmation');
            expect(item).toHaveProperty('daysSecondTime');
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

    it('/v1/customers/${customer}/reservation-types (GET) 403 forbidden', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-11111@gmail.com',
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
        .get(`/v1/customers/${customer2?.id}/reservation-types`)
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
  });

  describe('/v1/customers/${customer}/reservation-types (POST)', () => {
    it('/v1/customers/${customer}/reservation-types (POST)', async () => {
      const statesman2 = await createStatesmanUserAndToken(prisma, {
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/reservation-types`)
        .set('Authorization', `Bearer ${statesman2.token}`)
        .send({
          code: 'rugby',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            code: 'rugby',
            days: 0,
            display: 'day',
            groupCode: 'TE',
            numberOfPending: 2,
            customerId: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            minDays: null,
            maxPerMonth: null,
            minDaysBetweenReservation: null,
            pendingPerLot: false,
            allowsSimultaneous: false,
            requireConfirmation: false,
            daysSecondTime: null,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-types (POST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'rugby',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
          pendingPerLot: true,
          allowsSimultaneous: true,
          requireConfirmation: true,
          daysSecondTime: 12,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            code: 'rugby',
            days: 0,
            display: 'day',
            groupCode: 'TE',
            numberOfPending: 2,
            customerId: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            minDays: null,
            maxPerMonth: null,
            minDaysBetweenReservation: null,
            pendingPerLot: true,
            allowsSimultaneous: true,
            requireConfirmation: true,
            daysSecondTime: 12,
          });
        });
    });
    it('/v1/customers/${customer}/reservation-types (POST) 403 unprocessable entity', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-types`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'rugby',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_CODE,
          });
        });
    });
    it('/v1/customers/${customer}/reservation-types (POST) 403 forbidden', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'news-customer3es5@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/reservation-types`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          code: 'Tenis',
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

  describe('/v1/customers/${customer}/reservation-types/${id} (PATCH)', () => {
    it('/v1/customers/${customer}/reservation-types/${id} (PATCH)', async () => {
      const reservationType = await prisma.reservationType.create({
        data: {
          code: 'Frisbee',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-types/${reservationType.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 2',
          groupCode: 'TO',
          numberOfPending: 3,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            maxPerMonth: null,
            minDaysBetweenReservation: null,
            days: 0,
            code: 'Frisbee 2',
            display: 'day',
            groupCode: 'TO',
            numberOfPending: 3,
            pendingPerLot: false,
            allowsSimultaneous: false,
            requireConfirmation: false,
            daysSecondTime: null,
          });
        });
    });
    it('/v1/customers/${customer}/reservation-types/${id} (PATCH) (reservation type not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-types/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
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
            message: errorCodes.RESERVATION_TYPE_NOT_FOUND,
          });
        });
    });
    it('/v1/customers/${customer}/reservation-types (patch) 422 code exist', async () => {
      const reservationType = await prisma.reservationType.create({
        data: {
          code: 'Piletazon',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-types/${reservationType.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Futbol',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_CODE,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-types (patch) 200', async () => {
      const reservationType = await prisma.reservationType.create({
        data: {
          code: 'corredor',
          days: 0,
          display: 'day',
          groupCode: 'TE',
          numberOfPending: 2,
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-types/${reservationType.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'corredor',
          days: 1,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            maxPerMonth: null,
            minDaysBetweenReservation: null,
            code: 'corredor',
            days: 1,
            display: 'day',
            groupCode: 'TE',
            numberOfPending: 2,
            customerId: customer.id,
            pendingPerLot: false,
            allowsSimultaneous: false,
            requireConfirmation: false,
            daysSecondTime: null,
          });
        });
    });
  });
});
