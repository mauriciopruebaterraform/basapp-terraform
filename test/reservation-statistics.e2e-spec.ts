/* eslint-disable @typescript-eslint/no-loss-of-precision */
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Customer, User } from '@prisma/client';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createAdminUserAndToken, createUserAndToken } from './utils/users';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';
import {
  users,
  statesman as statesmanPrisma,
  customer as customerPrisma,
  customer2 as customer2Prisma,
} from './fakes/alerts.fake';

jest.mock('firebase-admin', () => {
  return {
    database: () => ({
      ref: () => ({
        child: () => ({
          push: () => null,
          set: () => null,
        }),
      }),
    }),
  };
});

describe('ReservationController (e2e) statistics', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let admin: { user: User; token: string };
  let statesman: { user: User; token: string };
  let customer: Customer;
  let customer2: Customer;

  const ATENDIDO = '4479724b-0825-45a4-87d0-d6e916c90d98';
  const EMITIDO = '2defbd37-1d64-4321-83cc-776ae6b011de';
  const GOLF = 'd0128144-17ac-47e7-8080-a52847712c2c';
  const PRACTICE_9_HOLES = '5e357d4a-f457-4fa1-9980-0f690c443d7e';
  const MATCH = 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a';
  const TENNIS = 'ba639b6b-df68-48e5-bfbb-a5bb06052b7e';
  const SOCCER = '6e0e16be-d7cf-4b5d-a456-e5e672bba1c2';
  const SINGLE = '99530d0e-4845-4c57-b322-799afd4b2b1d';
  const MATCH_1 = '7d1c2612-0d8b-4143-bd89-23b9c630073c';
  const SUPPLIERS = '2de3865c-51e2-4270-aa26-8f653eaa848c';
  const CONFIRM = 'a146c578-834b-4edd-8712-f94d4d3b86d5';
  const CANCELLED = 'b69e4f8f-529c-4f51-a0e8-28caaa3568f8';
  const POOL = '2f56ce53-06c7-4d88-8e49-9d6c7c5792e6';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    admin = await createAdminUserAndToken(prisma, {
      id: '0e06aa6f-73c6-425c-9de1-5e533a3652f9',
      username: 'new-customer@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      active: true,
    });

    customer = await createCustomer(prisma, {
      ...customerPrisma,
      integrations: {
        create: {
          cybermapaUrl: 'https://www.uuidgenerator.net/',
          cybermapaUsername: 'basapp',
          cybermapaPassword: 'sg2021BAS',
          traccarUrl: 'https://www.uuidgenerator.net/',
          traccarUsername: 'basapp',
          traccarPassword: 'sg2021BAS',
          updatedBy: {
            connect: {
              id: admin.user.id,
            },
          },
        },
      },
    });
    customer2 = await createCustomer(prisma, {
      ...customer2Prisma,
      integrations: {
        create: {
          updatedBy: {
            connect: {
              id: admin.user.id,
            },
          },
        },
      },
    });
    await prisma.permission.create({
      data: {
        id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
        action: 'event-statistics',
        name: 'Estadisticas de eventos',
        category: 'events',
        statesman: true,
        monitoring: false,
      },
    });

    await prisma.eventType.createMany({
      data: [
        {
          id: SUPPLIERS,
          code: 'AA130',
          updatedById: admin.user.id,
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
          id: SOCCER,
          code: 'Futbol',
          days: 1,
          display: 'day',
          groupCode: 'FU',
          numberOfPending: 0,
          customerId: customer2.id,
          createdAt: new Date('2021-02-01 13:27:28'),
          updatedAt: new Date('2021-02-01 13:27:28'),
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
          customerId: customer2.id,
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
          updatedById: admin.user.id,
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
          updatedById: admin.user.id,
          customerId: customer2.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          maxPerMonth: null,
          email: null,
        },
      ],
    });

    statesman = await createUserAndToken(prisma, statesmanPrisma);
    await prisma.user.createMany({
      data: users,
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/reservations/statistics (GET)', () => {
    it('/v1/reservations/statistics (GET) without events', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/reservations/statistics`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          where: JSON.stringify({
            customerId: {
              in: [customer.id, customer2.id],
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            totalByType: [],
            totalByState: [],
            total: 0,
          });
        });
    });
    it('/v1/reservations/statistics (GET) only to customer belonging to', async () => {
      await prisma.reservation.createMany({
        data: [
          {
            fromDate: new Date('2021-02-01 16:00:00'),
            toDate: new Date('2021-02-01 16:12:00'),
            inactiveToDate: new Date('2021-02-01 18:00:00'),
            numberOfGuests: 1,
            createdById: statesman.user.id,
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
            createdById: statesman.user.id,
            lot: 'DS123456',
            customerId: customer.id,
            reservationTypeId: POOL,
            reservationModeId: PRACTICE_9_HOLES,
            reservationSpaceId: MATCH,
            eventStateId: ATENDIDO,
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/customers/reservations/statistics`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            totalByType: [
              {
                code: 'Pileta',
                type: POOL,
                count: 1,
                percentage: 50,
              },
              {
                code: 'Golf',
                type: GOLF,
                count: 1,
                percentage: 50,
              },
            ],
            totalByState: [
              {
                name: 'Emitido',
                state: EMITIDO,
                count: 1,
                percentage: 50,
              },
              {
                name: 'Atendido',
                state: ATENDIDO,
                count: 1,
                percentage: 50,
              },
            ],
            total: 2,
          });
        });
    });
    it('/v1/reservations/statistics (GET) client to whom it belongs and their children', async () => {
      await prisma.reservation.createMany({
        data: [
          {
            fromDate: new Date('2021-02-01 16:00:00'),
            toDate: new Date('2021-02-01 17:00:00'),
            inactiveToDate: new Date('2021-02-01 17:00:00'),
            cancelDate: new Date('2021-02-01 15:52:51'),
            lot: 'DS1236',
            numberOfGuests: 2,
            customerId: customer2.id,
            reservationTypeId: TENNIS,
            reservationModeId: SINGLE,
            reservationSpaceId: MATCH_1,
            createdById: admin.user.id,
            eventStateId: ATENDIDO,
          },
          {
            fromDate: new Date('2021-02-01 16:00:00'),
            toDate: new Date('2021-02-01 17:00:00'),
            inactiveToDate: new Date('2021-02-01 17:00:00'),
            cancelDate: new Date('2021-02-01 15:52:51'),
            lot: 'DS1236',
            numberOfGuests: 2,
            customerId: customer2.id,
            reservationTypeId: SOCCER,
            reservationModeId: SINGLE,
            reservationSpaceId: MATCH_1,
            createdById: admin.user.id,
            eventStateId: ATENDIDO,
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/customers/reservations/statistics`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          where: JSON.stringify({
            customerId: {
              in: [customer.id, customer2.id],
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            totalByType: [
              {
                code: 'Pileta',
                type: POOL,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                code: 'Futbol',
                type: SOCCER,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                code: 'Tenis',
                type: TENNIS,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                code: 'Golf',
                type: GOLF,
                count: 1,
                percentage: (1 / 4) * 100,
              },
            ],
            totalByState: [
              {
                name: 'Emitido',
                state: EMITIDO,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                name: 'Atendido',
                state: ATENDIDO,
                count: 3,
                percentage: (3 / 4) * 100,
              },
            ],
            total: 4,
          });
        });
    });
  });
});
