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
import { CustomerType, ReservationSpace, Role, User } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { errorCodes } from '@src/customers/reservation-space/reservation-space.constants';

describe('ReservationSpaceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;
  let finallyUser: { user: User; token: string };
  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };
  const SUM = '00aff1c1-4a8d-4406-be16-178ed2aff60c';
  const GOLF = 'd0128144-17ac-47e7-8080-a52847712c2c';
  const TENNIS = 'ba639b6b-df68-48e5-bfbb-a5bb06052b7e';
  const SUPPLIERS = '2de3865c-51e2-4270-aa26-8f653eaa848c';
  const LIST_VISITORS = '4c1405b8-5b82-4265-8a6b-87847a2cbfdc';

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
      action: 'list-reservation-spaces',
      name: 'listado de espacios para reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-reservation-spaces',
      name: 'crear de espacio para reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'modify-reservation-spaces',
      name: 'modificar de espacio para reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.reservationType.createMany({
      data: [
        {
          id: SUM,
          code: 'SUM',
          days: 30,
          display: 'month',
          groupCode: 'SU',
          numberOfPending: 0,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:29:12'),
          updatedAt: new Date('2021-02-01 13:29:12'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
        },
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
          id: TENNIS,
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
      ],
    });
    await prisma.eventType.createMany({
      data: [
        {
          id: LIST_VISITORS,
          code: 'AA101',
          updatedById: user.id,
          title: 'LISTA DE VISITAS',
          active: true,
          description: false,
          attachment: false,
          monitor: true,
          addToStatistics: true,
          notifyUser: true,
          notifySecurityChief: false,
          notifySecurityGuard: false,
          additionalNotifications: '',
          customerId: customer2.id,
          autoCancelAfterExpired: true,
          allowsMultipleAuthorized: true,
          requiresDni: false,
          isPermanent: false,
          lotFrom: null,
          lotTo: null,
          emergency: false,
          requiresPatent: false,
          generateQr: false,
          reservation: false,
          notifyGiroVision: true,
          gvEntryTypeId: null,
          gvGuestTypeId: null,
        },
        {
          id: SUPPLIERS,
          code: 'AA130',
          updatedById: user.id,
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
    await prisma.reservationSpace.createMany({
      data: [
        {
          code: 'Cancha 1',
          schedule: {
            mon: { from: '0800', to: '2200' },
            tue: { from: '0800', to: '2200' },
            wed: { from: '0800', to: '2200' },
            thu: { from: '0800', to: '2200' },
            fri: { from: '0800', to: '2200' },
            sat: { from: '0800', to: '2200' },
            sun: { from: '0800', to: '2100' },
          },
          interval: 60,
          notifyParticipants: true,
          additionalNumbers: '',
          active: true,
          reservationTypeId: TENNIS, // ID de Tipo de Reserva Tenis
          eventTypeId: LIST_VISITORS,
          customerId: customer2.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: '1SUM Tarde',
          schedule: {
            mon: { from: '1400', to: '1800' },
            tue: { from: '1400', to: '1800' },
            wed: { from: '1400', to: '1800' },
            thu: { from: '1400', to: '1800' },
            fri: { from: '1400', to: '1800' },
            sat: { from: '1400', to: '1800' },
            sun: { from: '1400', to: '1800' },
          },
          interval: 240,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          active: true,
          reservationTypeId: SUM,
          eventTypeId: SUPPLIERS,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: '2SUM Noche',
          schedule: {
            mon: { from: '1930', to: '0300' },
            tue: { from: '1930', to: '0300' },
            wed: { from: '1930', to: '0300' },
            thu: { from: '1930', to: '0300' },
            fri: { from: '1930', to: '0300' },
            sat: { from: '1930', to: '0300' },
            sun: { from: '1930', to: '0300' },
          },
          interval: 450,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          active: true,
          reservationTypeId: SUM,
          eventTypeId: SUPPLIERS,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
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

  describe('/v1/customers/${customer}/reservation-spaces (GET)', () => {
    it('/v1/customers/${customer}/reservation-spaces (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            active: true,
            code: {
              contains: '1SUM Tarde',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              code: '1SUM Tarde',
              schedule: {
                mon: { from: '1400', to: '1800' },
                tue: { from: '1400', to: '1800' },
                wed: { from: '1400', to: '1800' },
                thu: { from: '1400', to: '1800' },
                fri: { from: '1400', to: '1800' },
                sat: { from: '1400', to: '1800' },
                sun: { from: '1400', to: '1800' },
              },
              interval: 240,
              notifyParticipants: false,
              additionalNumbers: '166480644',
              active: true,
              reservationTypeId: SUM,
              eventTypeId: SUPPLIERS,
              customerId: customer.id,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
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

    it('/v1/customers/${customer}/reservation-spaces (user) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            active: true,
            code: {
              contains: '1SUM Tarde',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              code: '1SUM Tarde',
              schedule: {
                mon: { from: '1400', to: '1800' },
                tue: { from: '1400', to: '1800' },
                wed: { from: '1400', to: '1800' },
                thu: { from: '1400', to: '1800' },
                fri: { from: '1400', to: '1800' },
                sat: { from: '1400', to: '1800' },
                sun: { from: '1400', to: '1800' },
              },
              interval: 240,
              notifyParticipants: false,
              additionalNumbers: '166480644',
              active: true,
              reservationTypeId: SUM,
              eventTypeId: SUPPLIERS,
              customerId: customer.id,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
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
      ['1SUM Tarde', 0],
      ['2SUM Noche', 1],
      ['Cancha', 2],
    ])(
      '/v1/customers/${customer}/reservation-spaces (statesman) allows pagination (GET)',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/reservation-spaces`)
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

    it('/v1/customers/${customer}/reservation-spaces (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: ReservationSpace) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('schedule');
            expect(item).toHaveProperty('interval');
            expect(item).toHaveProperty('notifyParticipants');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('additionalNumbers');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('eventTypeId');
            expect(item).toHaveProperty('reservationTypeId');
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

    it('/v1/customers/${customer}/reservation-spaces (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/reservation-spaces`)
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

  describe('/v1/customers/${customer}/reservation-spaces (POST)', () => {
    it('/v1/customers/${customer}/reservation-spaces (POST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: '3SUM Tarde',
          schedule: {
            mon: { from: '1400', to: '1800' },
            tue: { from: '1400', to: '1800' },
            wed: { from: '1400', to: '1800' },
            thu: { from: '1400', to: '1800' },
            fri: { from: '1400', to: '1800' },
            sat: { from: '1400', to: '1800' },
            sun: { from: '1400', to: '1800' },
            holiday: { from: '1400', to: '1800' },
            holidayEve: { from: '1400', to: '1800' },
          },
          interval: 240,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          reservationTypeId: SUM,
          eventTypeId: SUPPLIERS,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            code: '3SUM Tarde',
            schedule: {
              mon: { from: '1400', to: '1800' },
              tue: { from: '1400', to: '1800' },
              wed: { from: '1400', to: '1800' },
              thu: { from: '1400', to: '1800' },
              fri: { from: '1400', to: '1800' },
              sat: { from: '1400', to: '1800' },
              sun: { from: '1400', to: '1800' },
            },
            interval: 240,
            notifyParticipants: false,
            additionalNumbers: '166480644',
            reservationTypeId: SUM,
            eventTypeId: SUPPLIERS,
            customerId: customer.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces (POST) 422 unprocessable entity event type', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: '3SUM Tarde',
          schedule: {
            mon: { from: '1400', to: '1800' },
            tue: { from: '1400', to: '1800' },
            wed: { from: '1400', to: '1800' },
            thu: { from: '1400', to: '1800' },
            fri: { from: '1400', to: '1800' },
            sat: { from: '1400', to: '1800' },
            sun: { from: '1400', to: '1800' },
            holiday: { from: '1400', to: '1800' },
            holidayEve: { from: '1400', to: '1800' },
          },
          interval: 240,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          reservationTypeId: SUM,
          eventTypeId: '2de3865c-51e2-4270-aa26-8f653eaa848a',
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_EVENT_TYPE,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces (POST) 422 unprocessable entity reservation type', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: '3SUM Tarde',
          schedule: {
            mon: { from: '1400', to: '1800' },
            tue: { from: '1400', to: '1800' },
            wed: { from: '1400', to: '1800' },
            thu: { from: '1400', to: '1800' },
            fri: { from: '1400', to: '1800' },
            sat: { from: '1400', to: '1800' },
            sun: { from: '1400', to: '1800' },
            holiday: { from: '1400', to: '1800' },
            holidayEve: { from: '1400', to: '1800' },
          },
          interval: 240,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          reservationTypeId: '2de3865c-51e2-4270-aa26-8f653eaa848d',
          eventTypeId: SUPPLIERS,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_RESERVATION_TYPE,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces (POST) 403 forbidden', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/reservation-spaces`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: '3SUM Tarde',
          schedule: {
            mon: { from: '1400', to: '1800' },
            tue: { from: '1400', to: '1800' },
            wed: { from: '1400', to: '1800' },
            thu: { from: '1400', to: '1800' },
            fri: { from: '1400', to: '1800' },
            sat: { from: '1400', to: '1800' },
            sun: { from: '1400', to: '1800' },
            holiday: { from: '1400', to: '1800' },
            holidayEve: { from: '1400', to: '1800' },
          },
          interval: 240,
          notifyParticipants: false,
          additionalNumbers: '166480644',
          reservationTypeId: SUM,
          eventTypeId: SUPPLIERS,
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

  describe('/v1/customers/${customer}/reservation-spaces/${id} (PATCH)', () => {
    it('/v1/customers/${customer}/reservation-spaces/${id} (PATCH)', async () => {
      const reservationSpace = await prisma.reservationSpace.create({
        data: {
          code: 'Cancha3',
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
          reservationType: { connect: { id: GOLF } },
          eventType: { connect: { id: LIST_VISITORS } },
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-spaces/${reservationSpace.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 4',
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
            code: 'Frisbee 4',
            reservationTypeId: GOLF,
            eventTypeId: LIST_VISITORS,
            interval: 12,
            notifyParticipants: true,
            additionalNumbers: '166480644',
            schedule: {
              mon: { from: '0800', to: '1700' },
              tue: { from: '0800', to: '1700' },
              wed: { from: '0800', to: '1700' },
              thu: { from: '0800', to: '1700' },
              fri: { from: '0800', to: '1700' },
              sat: { from: '0800', to: '1700' },
              sun: { from: '0800', to: '1700' },
            },
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces/${id} (PATCH) event type no exist', async () => {
      const reservationSpace = await prisma.reservationSpace.create({
        data: {
          code: 'futbol y basquet',
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
          reservationType: { connect: { id: GOLF } },
          eventType: { connect: { id: LIST_VISITORS } },
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-spaces/${reservationSpace.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 4',
          eventTypeId: TENNIS,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_EVENT_TYPE,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces/${id} (PATCH) reservation space no exist', async () => {
      const reservationSpace = await prisma.reservationSpace.create({
        data: {
          code: 'Cancha31',
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
          additionalNumbers: '',
          active: true,
          reservationType: { connect: { id: GOLF } },
          eventType: { connect: { id: LIST_VISITORS } },
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-spaces/${reservationSpace.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 4',
          reservationTypeId: TENNIS,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_RESERVATION_TYPE,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces/${id} (PATCH) reservation space no exist', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-spaces/00aff1c1-4a8d-4406-be16-178ed2aff60c`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 4',
          reservationTypeId: TENNIS,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 404,
            error: 'Not Found',
            message: errorCodes.RESERVATION_SPACE_NOT_FOUND,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-spaces/${id} (PATCH) reservation space no exist', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer2.id}/reservation-spaces/00aff1c1-4a8d-4406-be16-178ed2aff60c`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'Frisbee 4',
          reservationTypeId: TENNIS,
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
});
