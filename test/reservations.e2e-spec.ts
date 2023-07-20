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
import { createUserAndToken } from './utils/users';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { errorCodes } from '@src/customers/reservations/reservations.constants';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import delay from './utils/delay';
import { ConfigurationService } from '@src/configuration/configuration.service';
import { ConfigurationServiceMock } from '@src/configuration/mocks/configuration.service';
import { CsvParser } from 'nest-csv-parser';
import { Readable } from 'stream';
import { EntityCsvReservationDetail } from './utils/class';
import * as dayjs from 'dayjs';

describe('ReservationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let csv2json: CsvParser;
  let finallyUser: { user: User; token: string };
  let fer: User;
  let neri: User;
  let user: User;
  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };

  const ATENDIDO = '4479724b-0825-45a4-87d0-d6e916c90d98';
  const EMITIDO = '2defbd37-1d64-4321-83cc-776ae6b011de';
  const GOLF = 'd0128144-17ac-47e7-8080-a52847712c2c';
  const PRACTICE_9_HOLES = '5e357d4a-f457-4fa1-9980-0f690c443d7e';
  const MATCH = 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a';
  const TENNIS = 'ba639b6b-df68-48e5-bfbb-a5bb06052b7e';
  const TOURNAMENT = '6e0e16be-d7cf-4b5d-a456-e5e672bba1c2';
  const SINGLE = '99530d0e-4845-4c57-b322-799afd4b2b1d';
  const MATCH_1 = '7d1c2612-0d8b-4143-bd89-23b9c630073c';
  const SUPPLIERS = '2de3865c-51e2-4270-aa26-8f653eaa848c';
  const CONFIRM = 'a146c578-834b-4edd-8712-f94d4d3b86d5';
  const CANCELLED = 'b69e4f8f-529c-4f51-a0e8-28caaa3568f8';
  const PROCESSING = '2f56ce53-06c7-4d88-8e49-9d6c7c5792e6';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigurationService)
      .useValue(ConfigurationServiceMock)
      .compile();

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
    csv2json = app.get(CsvParser);
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
      action: 'list-reservations',
      name: 'listado de reservas',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-reservation',
      name: 'crear reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.eventType.createMany({
      data: [
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
    await prisma.reservationType.createMany({
      data: [
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
      ],
    });
    await prisma.eventState.createMany({
      data: [
        {
          id: ATENDIDO,
          name: 'Atendido',
        },
        {
          id: EMITIDO,
          name: 'Emitido',
        },
        {
          id: CONFIRM,
          name: 'A confirmar',
        },
        {
          id: CANCELLED,
          name: 'Cancelado',
        },
        {
          id: PROCESSING,
          name: 'Procesando',
        },
      ],
    });
    await prisma.reservationSpace.createMany({
      data: [
        {
          id: MATCH_1,
          code: 'Cancha 1',
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
          reservationTypeId: TENNIS,
          eventTypeId: SUPPLIERS,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
    finallyUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'raul',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'raul arias',
      role: Role.user,
      active: true,
      authorizedUser: {
        create: {
          firstName: 'raul',
          lastName: 'arias',
          lot: 'A6',
          username: '1166480626',
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
      },
      customer: {
        connect: {
          id: customer.id,
        },
      },
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
          updatedById: user.id,
          inactivityTime: 90,
          reservationTypeId: GOLF,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
        {
          id: SINGLE,
          name: 'Single',
          maxDuration: 60,
          maxPeople: 4,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          inactivityTime: 90,
          reservationTypeId: TENNIS,
          updatedById: user.id,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
        {
          id: TOURNAMENT,
          name: 'TOURNAMENT',
          maxDuration: 60,
          maxPeople: 4,
          active: true,
          attachList: false,
          allowGuests: true,
          allParticipantsRequired: true,
          inactivityTime: 90,
          reservationTypeId: GOLF,
          updatedById: user.id,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
      ],
    });
    await prisma.reservation.createMany({
      data: [
        {
          fromDate: new Date('2021-02-01 16:00:00'),
          toDate: new Date('2021-02-01 16:12:00'),
          inactiveToDate: new Date('2021-02-01 18:00:00'),
          numberOfGuests: 1,
          createdById: statesman.user.id,
          lot: 'DS123456',
          userId: finallyUser.user.id,
          customerId: customer.id,
          reservationTypeId: GOLF,
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          eventStateId: ATENDIDO,
        },
        {
          fromDate: new Date('2021-02-01 16:00:00'),
          toDate: new Date('2021-02-01 17:00:00'),
          inactiveToDate: new Date('2021-02-01 17:00:00'),
          cancelDate: new Date('2021-02-01 15:52:51'),
          lot: 'DS1236',
          numberOfGuests: 2,
          userId: finallyUser.user.id,
          customerId: customer.id,
          reservationTypeId: TENNIS,
          reservationModeId: SINGLE,
          reservationSpaceId: MATCH_1,
          createdById: statesman.user.id,
          eventStateId: ATENDIDO,
        },
        {
          fromDate: new Date('2021-02-01 16:00:00'),
          toDate: new Date('2021-02-01 16:12:00'),
          inactiveToDate: new Date('2021-02-01 20:00:00'),
          lot: 'DS123452',
          numberOfGuests: 1,
          createdById: statesman.user.id,
          userId: finallyUser.user.id,
          customerId: customer.id,
          reservationTypeId: GOLF,
          reservationModeId: TOURNAMENT,
          reservationSpaceId: MATCH,
          eventStateId: EMITIDO,
        },
      ],
    });
    neri = await prisma.user.create({
      data: {
        password: '123456',
        firstName: 'Nerina',
        lastName: 'Capital',
        fullName: 'Nerina Capital',
        username: '541123199052',
        lot: '504',
        status: 'registered',
        role: Role.user,
        active: true,
        authorizedUser: {
          create: {
            firstName: 'Nerina',
            lastName: 'Capital',
            lot: '504',
            username: '1123199052',
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
            customer: {
              connect: {
                id: customer2.id,
              },
            },
          },
        },
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      },
    });

    fer = await prisma.user.create({
      data: {
        username: '541150281459',
        verificationCode: '201914',
        password: '123456',
        firstName: 'Fernando',
        lastName: 'Bello',
        fullName: 'Fernando Bello',
        status: 'active',
        lot: '15',
        role: Role.user,
        active: true,
        authorizedUser: {
          create: {
            firstName: 'Fernando',
            lastName: 'Bello',
            lot: '15',
            username: '1150281459',
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
            customer: {
              connect: {
                id: customer2.id,
              },
            },
          },
        },
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${customer}/reservations (GET)', () => {
    it('/v1/customers/${customer}/reservations (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            reservationSpace: {
              is: {
                code: 'Cancha 1',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              fromDate: expect.any(String),
              toDate: expect.any(String),
              inactiveToDate: expect.any(String),
              cancelDate: expect.any(String),
              lot: 'DS1236',
              numberOfGuests: 2,
              userId: finallyUser.user.id,
              customerId: customer.id,
              reservationTypeId: TENNIS,
              reservationModeId: SINGLE,
              reservationSpaceId: MATCH_1,
              createdById: statesman.user.id,
              eventStateId: ATENDIDO,
              authorizedUserId: null,
              trialPeriod: false,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              noUser: false,
              file: null,
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

    it('/v1/customers/${customer}/reservations (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            reservationSpace: {
              is: {
                code: 'Cancha 1',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              fromDate: expect.any(String),
              toDate: expect.any(String),
              inactiveToDate: expect.any(String),
              cancelDate: expect.any(String),
              lot: 'DS1236',
              numberOfGuests: 2,
              userId: finallyUser.user.id,
              customerId: customer.id,
              reservationTypeId: TENNIS,
              reservationModeId: SINGLE,
              reservationSpaceId: MATCH_1,
              createdById: statesman.user.id,
              trialPeriod: false,
              eventStateId: ATENDIDO,
              authorizedUserId: null,
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              noUser: false,
              file: null,
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
      ['DS123452', 0],
      ['DS123456', 1],
      ['DS1236', 2],
    ])(
      '/v1/customers/${customer}/reservations (statesman) allows pagination (GET)',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/reservations`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            take: 1,
            skip: b,
            orderBy: JSON.stringify({
              lot: 'asc',
            }),
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.results).toBeInstanceOf(Array);
            expect(res.body.results[0]).toMatchObject({
              lot: a,
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

    it('/v1/customers/${customer}/reservations (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: ReservationType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('fromDate');
            expect(item).toHaveProperty('toDate');
            expect(item).toHaveProperty('inactiveToDate');
            expect(item).toHaveProperty('cancelDate');
            expect(item).toHaveProperty('numberOfGuests');
            expect(item).toHaveProperty('createdById');
            expect(item).toHaveProperty('lot');
            expect(item).toHaveProperty('userId');
            expect(item).toHaveProperty('authorizedUserId');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('trialPeriod');
            expect(item).toHaveProperty('reservationTypeId');
            expect(item).toHaveProperty('reservationModeId');
            expect(item).toHaveProperty('reservationSpaceId');
            expect(item).toHaveProperty('eventStateId');
            expect(item).toHaveProperty('file');
            expect(item).toHaveProperty('noUser');
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

    it('/v1/customers/${customer}/reservations (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/reservations`)
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

  describe('/v1/customers/${customer}/reservations/%{id} (GET)', () => {
    it('/v1/customers/${customer}/reservations/%{id} (statesman) (GET)', async () => {
      const reservation = await prisma.reservation.create({
        data: {
          fromDate: new Date('2021-02-01 16:00:00'),
          toDate: new Date('2021-02-01 16:12:00'),
          inactiveToDate: new Date('2021-02-01 18:00:00'),
          numberOfGuests: 1,
          createdById: statesman.user.id,
          lot: 'DS12345611',
          userId: statesman.user.id,
          customerId: customer.id,
          reservationTypeId: GOLF,
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          eventStateId: ATENDIDO,
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            fromDate: expect.any(String),
            toDate: expect.any(String),
            inactiveToDate: expect.any(String),
            authorizedUserId: null,
            numberOfGuests: 1,
            cancelDate: null,
            trialPeriod: false,
            file: null,
            noUser: false,
            createdById: statesman.user.id,
            lot: 'DS12345611',
            userId: statesman.user.id,
            customerId: customer.id,
            reservationTypeId: GOLF,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            eventStateId: ATENDIDO,
          });
        });
    });

    it('/v1/customers/${customer}/reservations/${id} (GET) 403 forbidden', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'casa@gmail.com',
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
        .get(
          `/v1/customers/${customer2?.id}/reservations/768c9482-bd38-480c-a213-48e97edfb2ac`,
        )
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/customers/${customer}/reservations/${id} (GET) 403 forbidden', async () => {
      return await request(app.getHttpServer())
        .get(
          `/v1/customers/${customer?.id}/reservations/768c9482-bd38-480c-a213-48e97edfb2ac`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 404,
            error: 'Not Found',
            message: errorCodes.RESERVATION_NOT_FOUND,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservations/find-last-year-reservations (GET)', () => {
    it('/v1/customers/${customer}/reservations/find-last-year-reservations (GET)', async () => {
      return await request(app.getHttpServer())
        .get(
          `/v1/customers/${customer?.id}/reservations/find-last-year-reservations`,
        )
        .query({
          userId: finallyUser.user.id,
          reservationTypeId: GOLF,
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            count: 2,
          });
        });
    });

    it('/v1/customers/${customer}/reservations/find-last-year-reservations (GET) (BAD REQUEST)', async () => {
      return await request(app.getHttpServer())
        .get(
          `/v1/customers/${customer?.id}/reservations/find-last-year-reservations`,
        )
        .query({
          userId: finallyUser.user.id,
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Bad Request',
            message: [
              'reservationTypeId should not be empty',
              'reservationTypeId must be a string',
            ],
            statusCode: 400,
          });
        });
    });

    it('/v1/customers/${customer}/reservations/find-last-year-reservations (GET) (BAD REQUEST)', async () => {
      return await request(app.getHttpServer())
        .get(
          `/v1/customers/${customer?.id}/reservations/find-last-year-reservations`,
        )
        .query({
          reservationTypeId: GOLF,
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Bad Request',
            message: [
              'authorizedUserId must be a string',
              'userId must be a string',
            ],
            statusCode: 400,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservation (POST) NOTIFICATION ', () => {
    it('/v1/customers/${customer}/reservation (POST) generate notifications', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-04-16T15:00:00.000Z'),
          toDate: new Date('2023-04-16T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          authorizedUserId: finallyUser.user.authorizedUserId,
          participants: [
            {
              fullName: 'raul arias',
              authorizedUserId: finallyUser.user.authorizedUserId,
              userId: finallyUser.user.id,
            },
            {
              fullName: 'juan perez',
              authorizedUserId: fer.authorizedUserId,
              userId: fer.id,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: finallyUser.user.authorizedUserId,
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customer: {
              active: true,
              country: 'Argentina',
              countryCode: null,
              createdAt: expect.any(String),
              district: 'San Fernando',
              id: customer.id,
              image: null,
              isClient: false,
              name: 'harvard',
              notes: null,
              parentId: null,
              phoneLength: null,
              secretKey: null,
              speed: null,
              state: 'Buenos Aires',
              timezone: null,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              url: null,
            },
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-04-16T15:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-04-16T16:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationMode: {
              active: true,
              allParticipantsRequired: true,
              allowGuests: true,
              attachList: false,
              createdAt: expect.any(String),
              customerId: customer.id,
              email: null,
              id: PRACTICE_9_HOLES,
              inactivityTime: 90,
              maxDuration: 90,
              maxPeople: 4,
              maxPerMonth: null,
              name: 'PRACTICE_9_HOLES',
              reservationTypeId: GOLF,
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpace: {
              active: true,
              additionalNumbers: '166480644',
              code: 'Cancha',
              createdAt: expect.any(String),
              customerId: customer.id,
              eventTypeId: expect.any(String),
              id: MATCH,
              interval: 12,
              notifyParticipants: true,
              reservationTypeId: GOLF,
              schedule: {
                fri: {
                  from: '0800',
                  to: '1700',
                },
                mon: {
                  from: '0800',
                  to: '1700',
                },
                sat: {
                  from: '0800',
                  to: '1700',
                },
                sun: {
                  from: '0800',
                  to: '1700',
                },
                thu: {
                  from: '0800',
                  to: '1700',
                },
                tue: {
                  from: '0800',
                  to: '1700',
                },
                wed: {
                  from: '0800',
                  to: '1700',
                },
              },
              updatedAt: expect.any(String),
            },
            reservationSpaceId: MATCH,
            reservationType: {
              active: true,
              allowsSimultaneous: false,
              code: 'Golf',
              createdAt: expect.any(String),
              customerId: customer.id,
              days: 5,
              daysSecondTime: null,
              display: 'day',
              groupCode: 'GO',
              id: GOLF,
              maxPerMonth: null,
              minDays: 0,
              minDaysBetweenReservation: null,
              numberOfPending: 5,
              pendingPerLot: false,
              requireConfirmation: false,
              termsAndConditions: false,
              updatedAt: expect.any(String),
            },
            file: null,
            reservationTypeId: GOLF,
            toDate: '2023-04-16T16:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });

      await delay(1000);
      await prisma.reservationGuests.deleteMany({
        where: {
          reservationId: body.id,
        },
      });
      await prisma.reservation.delete({
        where: {
          id: body.id,
        },
      });

      const listNotificationFinalUser = await prisma.notificationUser.findMany({
        where: {
          userId: body.userId,
        },
      });

      expect(listNotificationFinalUser.length).toBe(1);

      const listNotificationFer = await prisma.notificationUser.findMany({
        where: {
          userId: fer.id,
        },
      });

      expect(listNotificationFer.length).toBe(1);

      await prisma.notificationUser.deleteMany({ where: {} });
      await prisma.notification.deleteMany({ where: {} });
    });
  });

  describe('/v1/customers/${customer}/reservation (POST)', () => {
    it('/v1/customers/${customer}/reservations (POST) with participants membership', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-03-28T14:00:00.000Z'),
          toDate: new Date('2023-03-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          noUser: true,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: null,
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: statesman.user.id,
            customer: {
              active: true,
              country: 'Argentina',
              countryCode: null,
              createdAt: expect.any(String),
              district: 'San Fernando',
              id: customer.id,
              image: null,
              isClient: false,
              name: 'harvard',
              notes: null,
              parentId: null,
              phoneLength: null,
              secretKey: null,
              speed: null,
              state: 'Buenos Aires',
              timezone: null,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              url: null,
            },
            customerId: customer.id,
            eventStateId: EMITIDO,
            file: null,
            fromDate: '2023-03-28T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-03-28T15:30:00.000Z',
            lot: null,
            noUser: true,
            numberOfGuests: 2,
            reservationMode: {
              active: true,
              allParticipantsRequired: true,
              allowGuests: true,
              attachList: false,
              createdAt: expect.any(String),
              customerId: customer.id,
              email: null,
              id: PRACTICE_9_HOLES,
              inactivityTime: 90,
              maxDuration: 90,
              maxPeople: 4,
              maxPerMonth: null,
              name: 'PRACTICE_9_HOLES',
              reservationTypeId: GOLF,
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpace: {
              active: true,
              additionalNumbers: '166480644',
              code: 'Cancha',
              createdAt: expect.any(String),
              customerId: customer.id,
              eventTypeId: expect.any(String),
              id: MATCH,
              interval: 12,
              notifyParticipants: true,
              reservationTypeId: GOLF,
              schedule: {
                fri: {
                  from: '0800',
                  to: '1700',
                },
                mon: {
                  from: '0800',
                  to: '1700',
                },
                sat: {
                  from: '0800',
                  to: '1700',
                },
                sun: {
                  from: '0800',
                  to: '1700',
                },
                thu: {
                  from: '0800',
                  to: '1700',
                },
                tue: {
                  from: '0800',
                  to: '1700',
                },
                wed: {
                  from: '0800',
                  to: '1700',
                },
              },
              updatedAt: expect.any(String),
            },
            reservationSpaceId: MATCH,
            reservationType: {
              active: true,
              allowsSimultaneous: false,
              code: 'Golf',
              createdAt: expect.any(String),
              customerId: customer.id,
              days: 5,
              daysSecondTime: null,
              display: 'day',
              groupCode: 'GO',
              id: GOLF,
              maxPerMonth: null,
              minDays: 0,
              minDaysBetweenReservation: null,
              numberOfPending: 5,
              pendingPerLot: false,
              requireConfirmation: false,
              termsAndConditions: false,
              updatedAt: expect.any(String),
            },
            reservationTypeId: GOLF,
            toDate: '2023-03-28T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: null,
          });
        });

      const event = await prisma.event.count({
        where: {
          reservationId: reservation.id,
        },
      });

      expect(event).toBe(0);
    });

    it('/v1/customers/${customer}/reservations (POST) with file and no user equal true', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-03-27T15:00:00.000Z'),
          toDate: new Date('2023-03-27T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          noUser: true,
          file: {
            name: 'b80ef82b-52f4-489f-a40a-df912bebd2cc.png',
            url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/reservations/file/b80ef82b-52f4-489f-a40a-df912bebd2cc.png',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: null,
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: statesman.user.id,
            customer: {
              active: true,
              country: 'Argentina',
              countryCode: null,
              createdAt: expect.any(String),
              district: 'San Fernando',
              id: customer.id,
              image: null,
              isClient: false,
              name: 'harvard',
              notes: null,
              parentId: null,
              phoneLength: null,
              secretKey: null,
              speed: null,
              state: 'Buenos Aires',
              timezone: null,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              url: null,
            },
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-03-27T15:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-03-27T16:30:00.000Z',
            lot: null,
            noUser: true,
            numberOfGuests: 0,
            reservationMode: {
              active: true,
              allParticipantsRequired: true,
              allowGuests: true,
              attachList: false,
              createdAt: expect.any(String),
              customerId: customer.id,
              email: null,
              id: PRACTICE_9_HOLES,
              inactivityTime: 90,
              maxDuration: 90,
              maxPeople: 4,
              maxPerMonth: null,
              name: 'PRACTICE_9_HOLES',
              reservationTypeId: GOLF,
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpace: {
              active: true,
              additionalNumbers: '166480644',
              code: 'Cancha',
              createdAt: expect.any(String),
              customerId: customer.id,
              eventTypeId: expect.any(String),
              id: MATCH,
              interval: 12,
              notifyParticipants: true,
              reservationTypeId: GOLF,
              schedule: {
                fri: {
                  from: '0800',
                  to: '1700',
                },
                mon: {
                  from: '0800',
                  to: '1700',
                },
                sat: {
                  from: '0800',
                  to: '1700',
                },
                sun: {
                  from: '0800',
                  to: '1700',
                },
                thu: {
                  from: '0800',
                  to: '1700',
                },
                tue: {
                  from: '0800',
                  to: '1700',
                },
                wed: {
                  from: '0800',
                  to: '1700',
                },
              },
              updatedAt: expect.any(String),
            },
            reservationSpaceId: MATCH,
            reservationType: {
              active: true,
              allowsSimultaneous: false,
              code: 'Golf',
              createdAt: expect.any(String),
              customerId: customer.id,
              days: 5,
              daysSecondTime: null,
              display: 'day',
              groupCode: 'GO',
              id: GOLF,
              maxPerMonth: null,
              minDays: 0,
              minDaysBetweenReservation: null,
              numberOfPending: 5,
              pendingPerLot: false,
              requireConfirmation: false,
              termsAndConditions: false,
              updatedAt: expect.any(String),
            },
            file: {
              name: 'b80ef82b-52f4-489f-a40a-df912bebd2cc.png',
              url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/reservations/file/b80ef82b-52f4-489f-a40a-df912bebd2cc.png',
            },
            reservationTypeId: GOLF,
            toDate: '2023-03-27T16:00:00.000Z',
            updatedAt: expect.any(String),
            userId: null,
          });
        });
    });

    it('/v1/customers/${customer}/reservations (POST) (INVALID_RESERVATION_TIME)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-03-27T15:00:00.000Z'),
          toDate: new Date('2023-03-27T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          authorizedUserId: finallyUser.user.authorizedUserId,
          participants: [
            {
              fullName: 'raul arias',
              authorizedUserId: finallyUser.user.authorizedUserId,
            },
            { fullName: 'juan perez' },
          ],
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            message: 'INVALID_RESERVATION_TIME',
          });
        });
    });

    it('/v1/customers/${customer}/reservations (POST) (INVALID_PARTICIPANT)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-03-27T15:00:00.000Z'),
          toDate: new Date('2023-03-27T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          authorizedUserId: finallyUser.user.authorizedUserId,
          participants: [
            {
              authorizedUserId: finallyUser.user.authorizedUserId,
              fullName: finallyUser.user.fullName,
              userId: finallyUser.user.id,
            },
            {
              fullName: 'raul arias',
              authorizedUserId: PRACTICE_9_HOLES,
            },
            { fullName: 'juan perez' },
          ],
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'INVALID_PARTICIPANT',
            statusCode: 422,
          });
        });
    });

    it('/v1/customers/${customer}/reservations (POST) with invitation no-member', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-04-26T15:00:00.000Z'),
          toDate: new Date('2023-04-26T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          authorizedUserId: finallyUser.user.authorizedUserId,
          participants: [
            {
              fullName: 'raul arias',
              authorizedUserId: finallyUser.user.authorizedUserId,
            },
            { fullName: 'juan perez' },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: finallyUser.user.authorizedUserId,
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: statesman.user.id,
            customer: {
              active: true,
              country: 'Argentina',
              countryCode: null,
              createdAt: expect.any(String),
              district: 'San Fernando',
              id: customer.id,
              image: null,
              isClient: false,
              name: 'harvard',
              notes: null,
              parentId: null,
              phoneLength: null,
              secretKey: null,
              speed: null,
              state: 'Buenos Aires',
              timezone: null,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              url: null,
            },
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-04-26T15:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-04-26T16:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationMode: {
              active: true,
              allParticipantsRequired: true,
              allowGuests: true,
              attachList: false,
              createdAt: expect.any(String),
              customerId: customer.id,
              email: null,
              id: PRACTICE_9_HOLES,
              inactivityTime: 90,
              maxDuration: 90,
              maxPeople: 4,
              maxPerMonth: null,
              name: 'PRACTICE_9_HOLES',
              reservationTypeId: GOLF,
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpace: {
              active: true,
              additionalNumbers: '166480644',
              code: 'Cancha',
              createdAt: expect.any(String),
              customerId: customer.id,
              eventTypeId: expect.any(String),
              id: MATCH,
              interval: 12,
              notifyParticipants: true,
              reservationTypeId: GOLF,
              schedule: {
                fri: {
                  from: '0800',
                  to: '1700',
                },
                mon: {
                  from: '0800',
                  to: '1700',
                },
                sat: {
                  from: '0800',
                  to: '1700',
                },
                sun: {
                  from: '0800',
                  to: '1700',
                },
                thu: {
                  from: '0800',
                  to: '1700',
                },
                tue: {
                  from: '0800',
                  to: '1700',
                },
                wed: {
                  from: '0800',
                  to: '1700',
                },
              },
              updatedAt: expect.any(String),
            },
            reservationSpaceId: MATCH,
            reservationType: {
              active: true,
              allowsSimultaneous: false,
              code: 'Golf',
              createdAt: expect.any(String),
              customerId: customer.id,
              days: 5,
              daysSecondTime: null,
              display: 'day',
              groupCode: 'GO',
              id: GOLF,
              maxPerMonth: null,
              minDays: 0,
              minDaysBetweenReservation: null,
              numberOfPending: 5,
              pendingPerLot: false,
              requireConfirmation: false,
              termsAndConditions: false,
              updatedAt: expect.any(String),
            },
            file: null,
            reservationTypeId: GOLF,
            toDate: '2023-04-26T16:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });
      const event = await prisma.event.findFirst({
        where: {
          reservationId: reservation.id,
        },
      });

      if (!event) {
        throw 'error';
      }

      expect(event).toMatchObject({
        fullName: finallyUser.user.fullName,
        eventTypeId: reservation.reservationSpace.eventTypeId,
        eventStateId: reservation.eventStateId,
        lot: 'A6',
        customerId: customer.id,
        from: new Date(reservation.fromDate),
        to: new Date(reservation.toDate),
        description: 'Espacio: Cancha\n\nInvitados:\nraul arias\njuan perez\n',
      });
    });

    it('notifications created', async () => {
      await delay(1000);
      const notifications = await prisma.notification.count({
        where: {},
      });

      expect(notifications).toBe(3);
    });
    it('/v1/customers/${customer}/reservations (POST) with invitation no-member and only authorizedUser', async () => {
      const authorizedUser = await prisma.authorizedUser.create({
        data: {
          username: '112311759',
          firstName: 'olga',
          lastName: 'lucia',
          customerId: customer.id,
          updatedById: statesman.user.id,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          fromDate: new Date('2023-01-26T15:00:00.000Z'),
          toDate: new Date('2023-01-26T16:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          authorizedUserId: authorizedUser?.id,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: authorizedUser?.id,
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: statesman.user.id,
            customer: {
              active: true,
              country: 'Argentina',
              countryCode: null,
              createdAt: expect.any(String),
              district: 'San Fernando',
              id: customer.id,
              image: null,
              isClient: false,
              name: 'harvard',
              notes: null,
              parentId: null,
              phoneLength: null,
              secretKey: null,
              speed: null,
              state: 'Buenos Aires',
              timezone: null,
              trialPeriod: false,
              type: 'business',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
              url: null,
            },
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-01-26T15:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-01-26T16:30:00.000Z',
            lot: null,
            noUser: false,
            numberOfGuests: 1,
            reservationMode: {
              active: true,
              allParticipantsRequired: true,
              allowGuests: true,
              attachList: false,
              createdAt: expect.any(String),
              customerId: customer.id,
              email: null,
              id: PRACTICE_9_HOLES,
              inactivityTime: 90,
              maxDuration: 90,
              maxPeople: 4,
              maxPerMonth: null,
              name: 'PRACTICE_9_HOLES',
              reservationTypeId: GOLF,
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpace: {
              active: true,
              additionalNumbers: '166480644',
              code: 'Cancha',
              createdAt: expect.any(String),
              customerId: customer.id,
              eventTypeId: expect.any(String),
              id: MATCH,
              interval: 12,
              notifyParticipants: true,
              reservationTypeId: GOLF,
              schedule: {
                fri: {
                  from: '0800',
                  to: '1700',
                },
                mon: {
                  from: '0800',
                  to: '1700',
                },
                sat: {
                  from: '0800',
                  to: '1700',
                },
                sun: {
                  from: '0800',
                  to: '1700',
                },
                thu: {
                  from: '0800',
                  to: '1700',
                },
                tue: {
                  from: '0800',
                  to: '1700',
                },
                wed: {
                  from: '0800',
                  to: '1700',
                },
              },
              updatedAt: expect.any(String),
            },
            reservationSpaceId: MATCH,
            reservationType: {
              active: true,
              allowsSimultaneous: false,
              code: 'Golf',
              createdAt: expect.any(String),
              customerId: customer.id,
              days: 5,
              daysSecondTime: null,
              display: 'day',
              groupCode: 'GO',
              id: GOLF,
              maxPerMonth: null,
              minDays: 0,
              minDaysBetweenReservation: null,
              numberOfPending: 5,
              pendingPerLot: false,
              requireConfirmation: false,
              termsAndConditions: false,
              updatedAt: expect.any(String),
            },
            file: null,
            reservationTypeId: GOLF,
            toDate: '2023-01-26T16:00:00.000Z',
            updatedAt: expect.any(String),
            userId: null,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservation/find-reservations (GET)', () => {
    it('/v1/customers/${customer}/reservations/find-reservations (GET) (final user)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/reservations/find-reservations`)
        .query({
          where: JSON.stringify({
            userId: finallyUser.user.id,
            reservationTypeId: GOLF,
          }),
          orderBy: JSON.stringify({
            lot: 'desc',
          }),
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual([
            {
              authorizedUserId: null,
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              file: null,
              fromDate: '2021-02-01T16:00:00.000Z',
              id: expect.any(String),
              inactiveToDate: '2021-02-01T18:00:00.000Z',
              lot: 'DS123456',
              trialPeriod: false,
              noUser: false,
              numberOfGuests: 1,
              reservationModeId: '5e357d4a-f457-4fa1-9980-0f690c443d7e',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2021-02-01T16:12:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
            {
              authorizedUserId: null,
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              file: null,
              trialPeriod: false,
              fromDate: '2021-02-01T16:00:00.000Z',
              id: expect.any(String),
              inactiveToDate: '2021-02-01T20:00:00.000Z',
              lot: 'DS123452',
              noUser: false,
              numberOfGuests: 1,
              reservationModeId: '6e0e16be-d7cf-4b5d-a456-e5e672bba1c2',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2021-02-01T16:12:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
            {
              authorizedUserId: expect.any(String),
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              file: null,
              fromDate: '2023-04-26T15:00:00.000Z',
              id: expect.any(String),
              trialPeriod: false,
              inactiveToDate: '2023-04-26T16:30:00.000Z',
              lot: 'A6',
              noUser: false,
              numberOfGuests: 2,
              reservationModeId: '5e357d4a-f457-4fa1-9980-0f690c443d7e',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2023-04-26T16:00:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
          ]);
        });
    });

    it('/v1/customers/${customer}/reservations/find-reservations (GET) (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/reservations/find-reservations`)
        .query({
          where: JSON.stringify({
            userId: finallyUser.user.id,
            reservationTypeId: GOLF,
          }),
          orderBy: JSON.stringify({
            lot: 'desc',
          }),
        })
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual([
            {
              authorizedUserId: null,
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              trialPeriod: false,
              file: null,
              fromDate: '2021-02-01T16:00:00.000Z',
              id: expect.any(String),
              inactiveToDate: '2021-02-01T18:00:00.000Z',
              lot: 'DS123456',
              noUser: false,
              numberOfGuests: 1,
              reservationModeId: '5e357d4a-f457-4fa1-9980-0f690c443d7e',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2021-02-01T16:12:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
            {
              authorizedUserId: null,
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              file: null,
              fromDate: '2021-02-01T16:00:00.000Z',
              id: expect.any(String),
              inactiveToDate: '2021-02-01T20:00:00.000Z',
              trialPeriod: false,
              lot: 'DS123452',
              noUser: false,
              numberOfGuests: 1,
              reservationModeId: '6e0e16be-d7cf-4b5d-a456-e5e672bba1c2',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2021-02-01T16:12:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
            {
              authorizedUserId: finallyUser.user.authorizedUserId,
              cancelDate: null,
              createdAt: expect.any(String),
              createdById: expect.any(String),
              customerId: customer.id,
              eventStateId: expect.any(String),
              file: null,
              fromDate: '2023-04-26T15:00:00.000Z',
              id: expect.any(String),
              trialPeriod: false,
              inactiveToDate: '2023-04-26T16:30:00.000Z',
              lot: 'A6',
              noUser: false,
              numberOfGuests: 2,
              reservationModeId: '5e357d4a-f457-4fa1-9980-0f690c443d7e',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2023-04-26T16:00:00.000Z',
              updatedAt: expect.any(String),
              userId: finallyUser.user.id,
            },
          ]);
        });
    });

    it('/v1/customers/${customer}/reservations/find-reservations (GET) (AUTHORIZED_USER_NOT_FOUND)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/reservations/find-reservations`)
        .query({
          where: JSON.stringify({
            userId: finallyUser.user.id,
            reservationTypeId: GOLF,
            AND: [
              {
                authorizedUserId: fer.id,
              },
            ],
          }),
          orderBy: JSON.stringify({
            lot: 'desc',
          }),
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.AUTHORIZED_USER_NOT_FOUND,
          });
        });
    });

    it('/v1/customers/${customer}/reservations/find-reservations (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/reservations/find-reservations`)
        .query({
          where: JSON.stringify({
            reservationTypeId: GOLF,
            AND: [
              {
                authorizedUserId: fer.authorizedUserId,
              },
            ],
          }),
          orderBy: JSON.stringify({
            lot: 'desc',
          }),
        })
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual([
            {
              customerId: customer.id,
              eventStateId: expect.any(String),
              createdAt: expect.any(String),
              createdById: expect.any(String),
              file: null,
              fromDate: '2023-03-28T14:00:00.000Z',
              id: expect.any(String),
              inactiveToDate: '2023-03-28T15:30:00.000Z',
              lot: null,
              noUser: true,
              numberOfGuests: 2,
              trialPeriod: false,
              reservationModeId: '5e357d4a-f457-4fa1-9980-0f690c443d7e',
              reservationSpaceId: 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a',
              reservationTypeId: 'd0128144-17ac-47e7-8080-a52847712c2c',
              toDate: '2023-03-28T15:00:00.000Z',
              updatedAt: expect.any(String),
              userId: null,
              authorizedUserId: null,
              cancelDate: null,
            },
          ]);
        });
    });
  });

  describe('/v1/customers/${customer}/reservation/cancel-reservation-event (POST)', () => {
    it('/v1/customers/${customer}/reservation/cancel-reservation-event (POST) (RESERVATION_CAN_NOT_BE_CANCELED)', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-01-28T14:00:00.000Z'),
          toDate: new Date('2023-01-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer?.id}/reservations/cancel-reservation-event`,
        )
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'RESERVATION_CAN_NOT_BE_CANCELED',
            statusCode: 422,
          });
        });

      await prisma.event.updateMany({
        data: {
          eventStateId: CANCELLED,
        },
        where: {
          reservationId: reservation.id,
        },
      });

      await prisma.reservation.updateMany({
        data: {
          eventStateId: CANCELLED,
        },
        where: {
          id: reservation.id,
        },
      });
    });
    it('/v1/customers/${customer}/reservation/cancel-reservation-event (POST) ', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: dayjs().add(1, 'day').toDate(),
          toDate: dayjs().add(2, 'day').toDate(),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      return await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer?.id}/reservations/cancel-reservation-event`,
        )
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: expect.any(String),
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: CANCELLED,
            id: expect.any(String),
            inactiveToDate: expect.any(String),
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            fromDate: expect.any(String),
            toDate: expect.any(String),
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });
    });

    it('/v1/customers/${customer}/reservation/cancel-reservation-event (POST) (RESERVATION_DOES_NOT_EXIST)', async () => {
      return await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer?.id}/reservations/cancel-reservation-event`,
        )
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: customer?.id,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'RESERVATION_DOES_NOT_EXIST',
            statusCode: 422,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservation/cancel-reservation (POST)', () => {
    it('/v1/customers/${customer}/reservation/cancel-reservation (POST) ', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-05-28T14:00:00.000Z'),
          toDate: new Date('2023-05-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/cancel-reservation`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: expect.any(String),
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: CANCELLED,
            fromDate: '2023-05-28T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-05-28T15:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            toDate: '2023-05-28T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });
    });

    it('/v1/customers/${customer}/reservation/cancel-reservation (POST) ', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-05-28T14:00:00.000Z'),
          toDate: new Date('2023-05-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/cancel-reservation`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
          eventStateId: EMITIDO,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: expect.any(String),
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-05-28T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-05-28T15:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            toDate: '2023-05-28T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });
    });

    it('/v1/customers/${customer}/reservation/cancel-reservation (POST) (RESERVATION_DOES_NOT_EXIST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/cancel-reservation`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: customer?.id,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'RESERVATION_DOES_NOT_EXIST',
            statusCode: 422,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservation/change-state (POST)', () => {
    it('/v1/customers/${customer}/reservation/change-state (POST) ', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-05-28T14:00:00.000Z'),
          toDate: new Date('2023-05-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/change-state`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
          eventStateId: PROCESSING,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: PROCESSING,
            fromDate: '2023-05-28T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-05-28T15:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            toDate: '2023-05-28T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });

      const event = await prisma.event.findFirst({
        where: {
          reservationId: reservation.id,
        },
      });

      expect(event).toMatchObject({
        eventStateId: PROCESSING,
      });
    });

    it('/v1/customers/${customer}/reservation/change-state (POST) (CANCELLED)', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-07-28T14:00:00.000Z'),
          toDate: new Date('2023-07-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/change-state`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
          eventStateId: CANCELLED,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: expect.any(String),
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: CANCELLED,
            fromDate: '2023-07-28T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-07-28T15:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            toDate: '2023-07-28T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });
    });

    it('/v1/customers/${customer}/reservation/change-state (POST) (RESERVATION_DOES_NOT_EXIST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/change-state`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: customer?.id,
          eventStateId: EMITIDO,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'RESERVATION_DOES_NOT_EXIST',
            statusCode: 404,
          });
        });
    });

    it('/v1/customers/${customer}/reservation/change-state (POST) (EVENT_STATE_NOT_FOUND)', async () => {
      const { body: reservation } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-12-28T14:00:00.000Z'),
          toDate: new Date('2023-12-28T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/change-state`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
          eventStateId: reservation.id,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'EVENT_STATE_NOT_FOUND',
            statusCode: 422,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservations/confirm-reservation (POST)', () => {
    it('/v1/customers/${customer}/reservation/confirm-reservation (POST) ', async () => {
      const { body: reservation, statusCode } = await request(
        app.getHttpServer(),
      )
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-05-18T14:00:00.000Z'),
          toDate: new Date('2023-05-18T15:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      expect(statusCode).toBe(201);

      await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/confirm-reservation`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: reservation.id,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            authorizedUserId: expect.any(String),
            cancelDate: null,
            createdAt: expect.any(String),
            createdById: finallyUser.user.id,
            customerId: customer.id,
            eventStateId: EMITIDO,
            fromDate: '2023-05-18T14:00:00.000Z',
            id: expect.any(String),
            inactiveToDate: '2023-05-18T15:30:00.000Z',
            lot: 'A6',
            noUser: false,
            numberOfGuests: 2,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            reservationTypeId: GOLF,
            file: null,
            toDate: '2023-05-18T15:00:00.000Z',
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
          });
        });

      const event = await prisma.event.findFirst({
        where: {
          reservationId: reservation.id,
        },
      });

      if (!event) {
        throw 'error';
      }

      expect(event).toMatchObject({
        fullName: finallyUser.user.fullName,
        eventTypeId: reservation.reservationSpace.eventTypeId,
        eventStateId: EMITIDO,
        lot: 'A6',
        customerId: customer.id,
        from: new Date(reservation.fromDate),
        to: new Date(reservation.toDate),
        description:
          'Espacio: Cancha\n\nInvitados:\nFernando Bello\nNerina Capital\n',
      });
    });

    it('/v1/customers/${customer}/reservations/confirm-reservation (POST) (RESERVATION_DOES_NOT_EXIST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservations/confirm-reservation`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          id: customer?.id,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'RESERVATION_DOES_NOT_EXIST',
            statusCode: 404,
          });
        });
    });
  });

  describe('/v1/customers/${customer}/reservations/download-detail (GET)', () => {
    it('/v1/customers/${customer}/reservations/download-detail (GET) ', async () => {
      const { body: reservation, statusCode } = await request(
        app.getHttpServer(),
      )
        .post(`/v1/customers/${customer?.id}/reservations`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          fromDate: new Date('2023-05-18T12:00:00.000Z'),
          toDate: new Date('2023-05-18T13:00:00.000Z'),
          reservationModeId: PRACTICE_9_HOLES,
          reservationSpaceId: MATCH,
          reservationTypeId: GOLF,
          userId: finallyUser.user.id,
          participants: [
            {
              fullName: 'Fernando Bello',
              authorizedUserId: fer.authorizedUserId,
            },
            {
              fullName: 'Nerina Capital',
              authorizedUserId: neri.authorizedUserId,
            },
          ],
        });

      expect(statusCode).toBe(201);

      const res = await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/reservations/download-detail`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          id: reservation.id,
        })
        .expect(200)
        .expect((res) => {
          expect(res.headers).toMatchObject({
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': 'attachment;filename=reservas.csv',
          });
        });

      const stream = Readable.from(res.text);

      const reservationsList = await csv2json.parse(
        stream,
        EntityCsvReservationDetail,
        1,
        1,
        {
          headers: [
            'Lote',
            'Nombre y apellido',
            'Usuario',
            'Reserva',
            'Modalidad',
            'Espacio',
            'Fecha desde',
            'Fecha hasta',
            'Cantidad Invitados',
            'Invitados',
            'Fecha creación',
            'Fecha cancelación',
          ],
        },
      );

      expect(reservationsList.list).toMatchObject([
        {
          Lote: 'A6',
          'Nombre y apellido': 'raul arias',
          Usuario: '541166480626',
          Reserva: 'Golf',
          Modalidad: 'PRACTICE_9_HOLES',
          Espacio: 'Cancha',
          'Fecha desde': '18/05/2023 12:00',
          'Fecha hasta': '18/05/2023 13:00',
          'Cantidad Invitados': '2',
          Invitados: expect.any(String),
          'Fecha creación': expect.any(String),
          'Fecha cancelación': '',
        },
      ]);

      expect(reservationsList.list[0].Invitados.length).toBeGreaterThan(0);
    });
  });
});
