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
import { CustomerType, ReservationMode, Role, User } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { errorCodes } from '@src/customers/reservation-mode/reservation-mode.constants';

describe('ReservationModeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let finallyUser: { user: User; token: string };
  let statesman: { user: User; token: string };

  const SUM_CUSTOMER = '00aff1c1-4a8d-4406-be16-178ed2aff60c';
  const GOLF_CUSTOMER = 'd0128144-17ac-47e7-8080-a52847712c2c';
  const TENNIS_CUSTOMER_2 = 'ba639b6b-df68-48e5-bfbb-a5bb06052b7e';
  const SUPPLIERS_CUSTOMER = '2de3865c-51e2-4270-aa26-8f653eaa848c';
  const LIST_VISITORS_CUSTOMER_2 = '4c1405b8-5b82-4265-8a6b-87847a2cbfdc';
  const MATCH_1_MODE_CUSTOMER_2 = 'b6672c6f-2b36-48c3-8a96-46b943b8c098';
  const SUM_1_AFTERNOON_MODE_CUSTOMER = '99530d0e-4845-4c57-b322-799afd4b2b1d';
  const SUM_2_NIGHT_MODE_CUSTOMER = '33c4f815-bf6e-4dd6-93f2-23bc40a5a4aa';
  const MATCH_MODE_CUSTOMER = 'cc7d42a2-bf21-4f8a-bcd1-e91220164e16';
  const MODE_CUSTOMER = 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a';
  const MODE_CUSTOMER_2 = '7d1c2612-0d8b-4143-bd89-23b9c630073c';

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
      action: 'list-reservation-modes',
      name: 'listado de espacios para reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-reservation-mode',
      name: 'crear espacio',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'modify-reservation-mode',
      name: 'crear espacio',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.reservationType.createMany({
      data: [
        {
          id: SUM_CUSTOMER,
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
          id: GOLF_CUSTOMER,
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
          id: TENNIS_CUSTOMER_2,
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
          id: LIST_VISITORS_CUSTOMER_2,
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
          id: SUPPLIERS_CUSTOMER,
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
          id: MATCH_1_MODE_CUSTOMER_2,
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
          reservationTypeId: TENNIS_CUSTOMER_2, // ID de Tipo de Reserva Tenis
          eventTypeId: LIST_VISITORS_CUSTOMER_2,
          customerId: customer2.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: SUM_1_AFTERNOON_MODE_CUSTOMER,
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
          reservationTypeId: SUM_CUSTOMER,
          eventTypeId: SUPPLIERS_CUSTOMER,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: SUM_2_NIGHT_MODE_CUSTOMER,
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
          reservationTypeId: SUM_CUSTOMER,
          eventTypeId: SUPPLIERS_CUSTOMER,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: MATCH_MODE_CUSTOMER,
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
          reservationTypeId: GOLF_CUSTOMER,
          eventTypeId: SUPPLIERS_CUSTOMER,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    await prisma.reservationMode.createMany({
      data: [
        {
          id: MODE_CUSTOMER,
          name: 'Dobles',
          maxDuration: 90,
          maxPeople: 4,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          updatedById: user.id,
          inactivityTime: 90,
          reservationTypeId: SUM_CUSTOMER,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
        {
          name: 'Singles',
          maxDuration: 60,
          maxPeople: 4,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          inactivityTime: 90,
          reservationTypeId: SUM_CUSTOMER,
          updatedById: user.id,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
        {
          id: MODE_CUSTOMER_2,
          name: 'Singles',
          maxDuration: 60,
          maxPeople: 2,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          inactivityTime: 60,
          reservationTypeId: TENNIS_CUSTOMER_2,
          customerId: customer2.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          updatedById: user.id,
          email: null,
        },
      ],
    });

    await prisma.reservationSpaceReservationMode.createMany({
      data: [
        {
          reservationSpaceId: MATCH_MODE_CUSTOMER,
          reservationModeId: MODE_CUSTOMER,
        },
        {
          reservationSpaceId: SUM_2_NIGHT_MODE_CUSTOMER,
          reservationModeId: MODE_CUSTOMER,
        },
        {
          reservationSpaceId: MATCH_1_MODE_CUSTOMER_2,
          reservationModeId: MODE_CUSTOMER_2,
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

  it('/v1/customers/${customer}/reservation-modes (statesman) with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .query({
        take: 20,
        skip: 0,
        include: JSON.stringify({
          reservationSpaces: true,
        }),
        where: JSON.stringify({
          active: true,
          name: {
            contains: 'Dobles',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            name: 'Dobles',
            maxDuration: 90,
            maxPeople: 4,
            active: true,
            attachList: false,
            allowGuests: true,
            allParticipantsRequired: true,
            inactivityTime: 90,
            reservationTypeId: expect.any(String),
            customerId: customer.id,
            maxPerMonth: null,
            email: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            reservationSpaces: [
              {
                reservationModeId: expect.any(String),
                reservationSpaceId: expect.any(String),
              },
              {
                reservationModeId: expect.any(String),
                reservationSpaceId: expect.any(String),
              },
            ],
            updatedById: expect.any(String),
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
    ['Dobles', 0],
    ['Singles', 1],
  ])(
    '/v1/customers/${customer}/reservation-modes (statesman) allows pagination (GET)',
    async (a, b) => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-modes`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 1,
          skip: b,
          orderBy: JSON.stringify({
            name: 'asc',
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
            name: a,
            customerId: customer.id,
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 2,
            take: 1,
            skip: b,
            size: 1,
            hasMore: b !== 1,
          });
        });
    },
  );

  it('/v1/customers/${customer}/reservation-modes (statesman) (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: ReservationMode) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('maxDuration');
          expect(item).toHaveProperty('maxPeople');
          expect(item).toHaveProperty('allowGuests');
          expect(item).toHaveProperty('allParticipantsRequired');
          expect(item).toHaveProperty('inactivityTime');
          expect(item).toHaveProperty('maxPerMonth');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('email');
          expect(item).toHaveProperty('reservationTypeId');
          expect(item).toHaveProperty('customerId');
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

  it('/v1/customers/${customer}/reservation-modes (user) (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/reservation-modes`)
      .set('Authorization', `Bearer ${finallyUser.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: ReservationMode) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('maxDuration');
          expect(item).toHaveProperty('maxPeople');
          expect(item).toHaveProperty('allowGuests');
          expect(item).toHaveProperty('allParticipantsRequired');
          expect(item).toHaveProperty('inactivityTime');
          expect(item).toHaveProperty('maxPerMonth');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('email');
          expect(item).toHaveProperty('reservationTypeId');
          expect(item).toHaveProperty('customerId');
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

  it('/v1/customers/${customer}/reservation-modes (GET) 403 forbidden', async () => {
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
      .get(`/v1/customers/${customer2?.id}/reservation-modes`)
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

  it('/v1/customers/${customer}/reservation-modes (POST) 422 (space) unprocessable entity', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'SUM_3',
        reservationTypeId: SUM_CUSTOMER,
        reservationSpaces: ['5884e214-5e28-4ad5-a334-9b0388175b82'],
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_RESERVATION_SPACE,
        });
      });
  });
  it('/v1/customers/${customer}/reservation-modes (POST) 422 (type) unprocessable entity', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'SUM_3',
        reservationTypeId: '5884e214-5e28-4ad5-a334-9b0388175b82',
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
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

  it('/v1/customers/${customer}/reservation-modes (POST) 403 forbidden', async () => {
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
      .post(`/v1/customers/${customer2?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        name: 'Tenis',
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

  it('/v1/customers/${customer}/reservation-modes (POST) with empty string', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'SUM_3',
        email: '',
        reservationTypeId: SUM_CUSTOMER,
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          active: true,
          allParticipantsRequired: false,
          allowGuests: false,
          attachList: false,
          createdAt: expect.any(String),
          customerId: customer.id,
          email: null,
          id: expect.any(String),
          inactivityTime: null,
          maxDuration: null,
          maxPeople: null,
          maxPerMonth: null,
          name: 'SUM_3',
          reservationSpaces: [
            {
              reservationModeId: expect.any(String),
              reservationSpaceId: expect.any(String),
            },
          ],
          reservationTypeId: SUM_CUSTOMER,
          updatedAt: expect.any(String),
          updatedById: expect.any(String),
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes (POST) with email null', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'SUM_3',
        reservationTypeId: SUM_CUSTOMER,
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          active: true,
          allParticipantsRequired: false,
          allowGuests: false,
          attachList: false,
          createdAt: expect.any(String),
          customerId: customer.id,
          email: null,
          id: expect.any(String),
          inactivityTime: null,
          maxDuration: null,
          maxPeople: null,
          maxPerMonth: null,
          name: 'SUM_3',
          reservationSpaces: [
            {
              reservationModeId: expect.any(String),
              reservationSpaceId: expect.any(String),
            },
          ],
          reservationTypeId: SUM_CUSTOMER,
          updatedAt: expect.any(String),
          updatedById: expect.any(String),
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes (validate email if its filled)', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/reservation-modes`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'SUM_3',
        email: 'dddd',
        reservationTypeId: SUM_CUSTOMER,
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          error: 'Bad Request',
          message: ['email must be an email'],
          statusCode: 400,
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes/${id} (PATCH)', async () => {
    const reservationMode = await prisma.reservationMode.findUnique({
      where: {
        id: MODE_CUSTOMER,
      },
    });
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${reservationMode?.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'Frisbee 4',
        reservationTypeId: GOLF_CUSTOMER,
        reservationSpaces: [MATCH_MODE_CUSTOMER],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.reservationSpaces).toStrictEqual([
          {
            reservationModeId: reservationMode?.id,
            reservationSpaceId: MATCH_MODE_CUSTOMER,
          },
        ]);
        expect(res.body).toMatchObject({
          active: true,
          allParticipantsRequired: true,
          allowGuests: true,
          attachList: false,
          createdAt: expect.any(String),
          customerId: customer.id,
          email: null,
          id: MODE_CUSTOMER,
          inactivityTime: 90,
          maxDuration: 90,
          maxPeople: 4,
          maxPerMonth: null,
          name: 'Frisbee 4',
          reservationTypeId: GOLF_CUSTOMER,
          updatedAt: expect.any(String),
          updatedById: statesman.user.id,
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes/${id} (PATCH) clean spaces changing reservation type', async () => {
    const reservationMode = await prisma.reservationMode.findUnique({
      where: {
        id: MODE_CUSTOMER,
      },
    });
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${reservationMode?.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationTypeId: SUM_CUSTOMER,
      })
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          active: true,
          allParticipantsRequired: true,
          allowGuests: true,
          attachList: false,
          createdAt: expect.any(String),
          customerId: customer.id,
          email: null,
          id: MODE_CUSTOMER,
          inactivityTime: 90,
          maxDuration: 90,
          maxPeople: 4,
          maxPerMonth: null,
          name: 'Frisbee 4',
          reservationSpaces: [],
          reservationTypeId: SUM_CUSTOMER,
          updatedAt: expect.any(String),
          updatedById: statesman.user.id,
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes/${id} (reservation type invalid) (PATCH)', async () => {
    const reservationMode = await prisma.reservationMode.findUnique({
      where: {
        id: MODE_CUSTOMER,
      },
    });
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${reservationMode?.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
        reservationTypeId: '00aff1c1-4a8d-4406-be16-1d8ed2aff60c',
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

  it('/v1/customers/${customer}/reservation-modes/${id} (reservation MODE invalid) (PATCH)', async () => {
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${SUM_1_AFTERNOON_MODE_CUSTOMER}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationSpaces: [SUM_1_AFTERNOON_MODE_CUSTOMER],
        reservationTypeId: '00aff1c1-4a8d-4406-be16-1d8ed2aff60c',
      })
      .expect(404)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 404,
          error: 'Not Found',
          message: errorCodes.RESERVATION_MODE_NOT_FOUND,
        });
      });
  });
  it('/v1/customers/${customer}/reservation-modes/${id} (space invalid) (PATCH)', async () => {
    const reservationMode = await prisma.reservationMode.findUnique({
      where: {
        id: MODE_CUSTOMER,
      },
    });

    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${reservationMode?.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationTypeId: GOLF_CUSTOMER,
        reservationSpaces: ['00aff1c1-4a8d-4406-be16-178ed2aff60c'],
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_RESERVATION_SPACE,
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes/${id} (space invalid dif customer) (PATCH)', async () => {
    const reservationMode = await prisma.reservationMode.findUnique({
      where: {
        id: MODE_CUSTOMER,
      },
    });

    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/reservation-modes/${reservationMode?.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationTypeId: GOLF_CUSTOMER,
        reservationSpaces: [MATCH_1_MODE_CUSTOMER_2],
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_RESERVATION_SPACE,
        });
      });
  });

  it('/v1/customers/${customer}/reservation-modes/${id} (PATCH) (authorization)', async () => {
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer2.id}/reservation-modes/00aff1c1-4a8d-4406-be16-178ed2aff60c`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        name: 'Frisbee 4',
        reservationTypeId: '00aff1c1-4a8d-4406-be16-178ed2aff60c',
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
