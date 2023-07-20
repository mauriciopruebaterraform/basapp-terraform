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

describe('EventController (e2e) statistics', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let admin: { user: User; token: string };
  let statesman: { user: User; token: string };
  let customer: Customer;
  let customer2: Customer;
  const SUPPLIERS = 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32';
  const REMIS = '3762661c-86bf-4a33-b392-ee538082a294';
  const VISITAS = '2e150900-6c27-4f20-a73e-3cb9c1f7df55';
  const DELIVERY = '5edd293a-bc5f-43ab-b210-901fcd81596c';
  const ATENDIDO = '879b2fde-938f-40b9-9f53-9b48255ed3a0';
  const EMITIDO = '85d18800-18e0-41e3-bf2f-4c624382fd3d';
  const MATCH = 'a2cd3bf3-4d4a-43a9-be0b-58faf0e84b1a';
  const PRACTICE_9_HOLES = '5e357d4a-f457-4fa1-9980-0f690c443d7e';
  const GOLF = 'd0128144-17ac-47e7-8080-a52847712c2c';

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
          id: VISITAS,
          code: 'AA100',
          title: 'VISITAS',
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
          generateQr: true,
          qrFormat: 4,
          reservation: false,
          notifyGiroVision: true,
          gvEntryTypeId: null,
          gvGuestTypeId: null,
          updatedById: admin.user.id,
        },
        {
          id: DELIVERY,
          code: 'AA110',
          updatedById: admin.user.id,
          title: 'DELIVERY',
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
        {
          id: SUPPLIERS,
          code: 'AA111',
          title: 'SUPPLIERS',
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
          allowsMultipleAuthorized: false,
          requiresDni: false,
          isPermanent: false,
          lotFrom: null,
          lotTo: null,
          emergency: false,
          requiresPatent: false,
          generateQr: true,
          qrFormat: 4,
          reservation: false,
          notifyGiroVision: true,
          gvEntryTypeId: null,
          gvGuestTypeId: null,
          updatedById: admin.user.id,
        },
        {
          id: REMIS,
          code: 'AA222',
          updatedById: admin.user.id,
          title: 'REMIS',
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

    await prisma.eventState.createMany({
      data: [
        {
          id: EMITIDO,
          name: 'Emitido',
        },
        {
          id: ATENDIDO,
          name: 'Atendido',
        },
      ],
    });
    statesman = await createUserAndToken(prisma, statesmanPrisma);
    await prisma.user.createMany({
      data: users,
    });

    // events with reservationId will be ignored
    await prisma.reservationType.createMany({
      data: [
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
      ],
    });
    await prisma.reservationSpace.createMany({
      data: [
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
    const reservation = await prisma.reservation.create({
      data: {
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
    });
    await prisma.event.createMany({
      data: [
        {
          reservationId: reservation.id,
          eventTypeId: DELIVERY,
          from: new Date('2010-01-22 03:00:00'),
          to: new Date('2010-01-23 02:59:00'),
          changeLog: '',
          eventStateId: EMITIDO,
          customerId: customer.id,
          userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/events/statistics (GET)', () => {
    it('/v1/events/statistics (GET) without events', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/events/statistics`)
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
            totalEvents: 0,
          });
        });
    });
    it('/v1/events/statistics (GET) only to customer belonging to', async () => {
      await prisma.event.createMany({
        data: [
          {
            eventTypeId: DELIVERY,
            from: new Date('2020-04-22 03:00:00'),
            to: new Date('2020-04-23 02:59:00'),
            changeLog: '',
            eventStateId: EMITIDO,
            customerId: customer.id,
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
          },
          {
            eventTypeId: VISITAS,
            eventStateId: ATENDIDO,
            customerId: customer.id,
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
            from: new Date('2020-04-13 03:00:00'),
            to: new Date('2020-04-14 02:59:00'),
            changeLog: '',
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/customers/events/statistics`)
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
                title: 'VISITAS',
                type: VISITAS,
                count: 1,
                percentage: 50,
              },
              {
                title: 'DELIVERY',
                type: DELIVERY,
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
            totalEvents: 2,
          });
        });
    });
    it('/v1/events/statistics (GET) client to whom it belongs and their children', async () => {
      await prisma.event.createMany({
        data: [
          {
            eventTypeId: SUPPLIERS,
            eventStateId: EMITIDO,
            customerId: customer2.id,
            from: new Date('2020-05-13 03:00:00'),
            to: new Date('2020-05-14 02:59:00'),
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
            changeLog: '',
          },
          {
            eventTypeId: REMIS,
            eventStateId: EMITIDO,
            customerId: customer2.id,
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
            from: new Date('2020-04-13 03:00:00'),
            to: new Date('2020-04-14 02:59:00'),
            changeLog: '',
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/customers/events/statistics`)
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
                title: 'VISITAS',
                type: VISITAS,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                title: 'REMIS',
                type: REMIS,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                title: 'DELIVERY',
                type: DELIVERY,
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                title: 'SUPPLIERS',
                type: SUPPLIERS,
                count: 1,
                percentage: (1 / 4) * 100,
              },
            ],
            totalByState: [
              {
                name: 'Emitido',
                state: EMITIDO,
                count: 3,
                percentage: (3 / 4) * 100,
              },
              {
                name: 'Atendido',
                state: ATENDIDO,
                count: 1,
                percentage: (1 / 4) * 100,
              },
            ],
            totalEvents: 4,
          });
        });
    });
  });
});
