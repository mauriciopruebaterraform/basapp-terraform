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
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import * as dayjs from 'dayjs';

describe('EventAuthorizationRequestController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let firebase: FirebaseService;

  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };
  let monitoring: { user: User; token: string };
  let finallyUser: { user: User; token: string };

  const PARTIDO = '4479724b-0825-45a4-87d0-d6e916c90d98';
  const VISITAS = '2defbd37-1d64-4321-83cc-776ae6b011de';
  const RECHAZADO = '6997dc8c-6dc0-43f4-b9fa-9c8acffd2582';
  const EMITIDO = 'c647f721-decd-4045-9832-406c8cd1f8ce';
  const Fernando = '30805e38-d121-40c8-9ee0-7f8b69ff495f';
  const Nerina = 'a325d157-cfa3-42f0-a01c-3ef808126d07';
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(FirebaseService)
      .useValue(FirebaseServiceMock)
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

    prisma = app.get(PrismaService);
    firebase = app.get(FirebaseService);
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
      timezone: '-180',
      countryCode: '54',
      country: 'Argentina',
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
      integrations: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      settings: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      sections: {
        create: {},
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
      settings: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      integrations: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      sections: {
        create: {},
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
    monitoring = await createUserAndToken(prisma, {
      username: 'otro-james@mail.com',
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

    finallyUser = await createUserAndToken(prisma, {
      firstName: 'Mauricio',
      password: '',
      pushId: 'aglogdsgfsdf',
      lot: 'D13564',
      lastName: 'Gallego',
      fullName: 'Mauricio Gallego',
      username: '541166480626',
      customer: {
        connect: {
          id: customer.id,
        },
      },
      updatedBy: {
        connect: {
          id: user.id,
        },
      },
      authorizedUser: {
        create: {
          id: '311ee7c0-5552-4995-abca-1e97de78e357',
          firstName: 'Mauricio',
          lastName: 'Gallego',
          username: '1166480626',
          lot: 'D13564',
          description: null,
          sendEvents: true,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
      },
    });

    await createPermission(prisma, {
      action: 'list-authorizations',
      name: 'listado de usuarios habilitados',
      category: 'list',
      statesman: true,
      monitoring: false,
    });

    await createPermission(prisma, {
      action: 'request-authorization',
      name: 'crea solicitud autorizacion',
      category: 'list',
      statesman: true,
      monitoring: true,
    });

    await prisma.eventType.createMany({
      data: [
        {
          id: VISITAS,
          code: 'VISITAS',
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
          updatedById: user.id,
        },
        {
          id: PARTIDO,
          code: 'PARTIDO',
          updatedById: user.id,
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
      ],
    });
    await prisma.eventState.createMany({
      data: [
        {
          id: RECHAZADO,
          name: 'Rechazado',
        },
        {
          id: EMITIDO,
          name: 'Emitido',
        },
      ],
    });
    await prisma.authorizedUser.createMany({
      data: [
        {
          id: Fernando,
          firstName: 'Fernando',
          lastName: 'Bello',
          username: '1150281459',
          lot: 'DS123456',
          description: null,
          sendEvents: true,
          active: false,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
        {
          id: Nerina,
          firstName: 'Nerina',
          lastName: 'Capital',
          username: '1123199052',
          lot: 'D13564',
          description: null,
          sendEvents: true,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
      ],
    });
    await prisma.eventAuthorizationRequest.createMany({
      data: [
        {
          text: 'algo',
          authorized: 'si',
          lot: 'D13564',
          monitorId: monitoring.user.id,
          customerId: customer.id,
          eventTypeId: VISITAS,
          authorizedUserId: Fernando,
        },
        {
          text: 'informacion',
          authorized: 'el señor puede pasar',
          lot: 'D13564',
          monitorId: monitoring.user.id,
          customerId: customer.id,
          eventTypeId: VISITAS,
          authorizedUserId: Fernando,
        },
        {
          text: 'informacion muy importante',
          authorized: 'el señor peude pasar',
          lot: 'D13564',
          monitorId: monitoring.user.id,
          customerId: customer.id,
          eventTypeId: PARTIDO,
          authorizedUserId: Fernando,
        },
        {
          text: 'aca va un texto',
          authorized: 'puede pasar?',
          lot: 'D1245',
          monitorId: monitoring.user.id,
          customerId: customer.id,
          eventTypeId: VISITAS,
          authorizedUserId: Nerina,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${customer}/event-authorization-requests', () => {
    it('/v1/customers/${customer}/event-authorization-requests (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            authorizedUser: {
              is: {
                username: '1123199052',
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
              confirmed: false,
              sentBySms: false,
              userId: null,
              text: 'aca va un texto',
              authorized: 'puede pasar?',
              lot: 'D1245',
              monitorId: monitoring.user.id,
              trialPeriod: false,
              customerId: customer.id,
              rejected: false,
              eventTypeId: VISITAS,
              authorizedUserId: Nerina,
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

    it.each([['PARTIDO', 0]])(
      '/v1/customers/${customer}/event-authorization-requests (statesman) allows pagination (GET)',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/event-authorization-requests`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            take: 1,
            skip: b,
            where: JSON.stringify({
              eventType: {
                is: {
                  code: a,
                },
              },
            }),
            include: JSON.stringify({
              eventType: {
                select: {
                  code: true,
                },
              },
            }),
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.results).toBeInstanceOf(Array);
            expect(res.body.results[0]).toMatchObject({
              eventType: {
                code: a,
              },
              customerId: customer.id,
            });
            expect(res.body.pagination).toBeInstanceOf(Object);
            expect(res.body.pagination).toEqual({
              total: 1,
              take: 1,
              skip: b,
              size: 1,
              hasMore: false,
            });
          });
      },
    );

    it('/v1/customers/${customer}/event-authorization-requests (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: ReservationMode) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('sentBySms');
            expect(item).toHaveProperty('text');
            expect(item).toHaveProperty('authorized');
            expect(item).toHaveProperty('lot');
            expect(item).toHaveProperty('confirmed');
            expect(item).toHaveProperty('userId');
            expect(item).toHaveProperty('monitorId');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('eventTypeId');
            expect(item).toHaveProperty('authorizedUserId');
            expect(item).toHaveProperty('trialPeriod');
            expect(item).toHaveProperty('createdAt');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 4,
            take: 100,
            skip: 0,
            size: 4,
            hasMore: false,
          });
        });
    });

    it('/v1/customers/${customer}/event-authorization-requests (GET) 403 forbidden', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer2?.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${statesman.token}`)
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

  describe('/v1/customers/${customer}/event-authorization-requests', () => {
    it('/v1/customers/${customer}/event-authorization-requests (POST)', async () => {
      const monitoringUser = await createUserAndToken(prisma, {
        username: 'otro-james-igual@mail.com',
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
        userPermissions: {
          create: {
            visitorsQueue: true,
            requestAuthorization: true,
            visitorsEventTypeId: VISITAS,
          },
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${monitoringUser.token}`)
        .send({
          lot: 'D13564',
          authorized: 'coto',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            authorized: 'coto',
            authorizedUserId: null,
            confirmed: false,
            rejected: false,
            createdAt: expect.any(String),
            customerId: customer.id,
            eventTypeId: VISITAS,
            trialPeriod: false,
            id: expect.any(String),
            lot: 'D13564',
            monitorId: monitoringUser.user.id,
            sentBySms: false,
            text: 'coto se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
            updatedAt: expect.any(String),
            userId: null,
          });
        });

      const notificationCreated = await prisma.notification.findFirst({
        where: {
          authorizationRequestId: res.body.id,
        },
      });

      expect(notificationCreated).toStrictEqual({
        alertId: null,
        authorizationRequestId: res.body.id,
        createdAt: expect.any(Date),
        customerId: customer.id,
        description:
          'coto se encuentra esperando en la Guardia. Por favor ingrese a Basapp CyB para autorizarlo.',
        emergency: false,
        trialPeriod: false,
        eventId: null,
        fromLot: null,
        id: expect.any(String),
        image: null,
        locationId: null,
        notificationType: 'authorization',
        sendAt: expect.any(Date),
        title: 'Ud. tiene una visita esperando en la guardia',
        toLot: null,
        userId: monitoringUser.user.id,
      });
    });

    it('/v1/customers/${customer}/event-authorization-requests (POST) ACTION_NOT_ALLOWED', async () => {
      const monitoringUser = await createUserAndToken(prisma, {
        username: 'otro-mointoring@mail.com',
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
        userPermissions: {
          create: {
            visitorsQueue: false,
            requestAuthorization: false,
            visitorsEventTypeId: VISITAS,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${monitoringUser.token}`)
        .send({
          lot: 'D13564',
          authorized: 'coto',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'ACTION_NOT_ALLOWED',
          });
        });
    });

    it('/v1/customers/${customer}/event-authorization-requests (POST) USERS_WITH_LOT_NOT_FOUND', async () => {
      const monitoringUser = await createUserAndToken(prisma, {
        username: 'mauriciogallego@mail.com',
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
        userPermissions: {
          create: {
            visitorsQueue: true,
            requestAuthorization: true,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${monitoringUser.token}`)
        .send({
          lot: 'D164',
          authorized: 'coto',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'USERS_WITH_LOT_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/event-authorization-requests (POST) EVENT_NOT_ASSIGNED', async () => {
      const monitoringUser = await createUserAndToken(prisma, {
        username: 'otro-mointoring-con-data-diferente@mail.com',
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
        userPermissions: {
          create: {
            visitorsQueue: true,
            requestAuthorization: true,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/event-authorization-requests`)
        .set('Authorization', `Bearer ${monitoringUser.token}`)
        .send({
          lot: 'D13564',
          authorized: 'coto',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'EVENT_NOT_ASSIGNED',
          });
        });
    });
  });

  describe('/v1/customers/${customer}/event-authorization-requests/confirm', () => {
    it('/v1/customers/${customer}/event-authorization-requests/{id}/confirm (AUTHORIZATION_REQUIRED)', async () => {
      const eventAuthorizationEvent =
        await prisma.eventAuthorizationRequest.create({
          data: {
            lot: 'D13564',
            authorized: 'camilo torrez',
            customerId: customer.id,
            eventTypeId: VISITAS,
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            monitorId: monitoring.user.id,
            sentBySms: true,
            text: 'por favor llame al guardia',
          },
        });

      return await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer.id}/event-authorization-requests/${eventAuthorizationEvent.id}/confirm`,
        )
        .set('Authorization', `Bearer ${monitoring.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
          });
        });
    });

    it('/v1/customers/${customer}/event-authorization-requests/{id}/confirm (POST)', async () => {
      const eventAuthorizationEvent =
        await prisma.eventAuthorizationRequest.create({
          data: {
            lot: 'D13564',
            authorized: 'camilo torrez',
            customerId: customer.id,
            eventTypeId: VISITAS,
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            monitorId: monitoring.user.id,
            sentBySms: true,
            text: 'por favor llame al guardia',
          },
        });

      const { body } = await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer.id}/event-authorization-requests/${eventAuthorizationEvent.id}/confirm`,
        )
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: expect.any(String),
            authorized: 'camilo torrez',
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            confirmed: true,
            createdAt: expect.any(String),
            customerId: customer.id,
            trialPeriod: false,
            eventTypeId: VISITAS,
            lot: 'D13564',
            monitorId: monitoring.user.id,
            rejected: false,
            sentBySms: true,
            text: 'por favor llame al guardia',
            updatedAt: expect.any(String),
            userId: null,
          });
        });

      const event = await prisma.event.findFirst({
        where: {
          fullName: body.authorized,
        },
      });

      if (!event) {
        throw new Error();
      }

      expect(event).toStrictEqual({
        changeLog: expect.any(String),
        fullName: 'CAMILO TORREZ',
        eventTypeId: VISITAS,
        eventStateId: EMITIDO,
        from: expect.any(Date),
        to: expect.any(Date),
        authorizedUserId: null,
        customerId: expect.any(String),
        description: null,
        dni: null,
        externalId: expect.any(String),
        file: null,
        firstName: '',
        id: expect.any(String),
        isCopy: false,
        isDelivery: false,
        isPermanent: false,
        lastName: '',
        lot: 'D13564',
        monitorId: null,
        observations: null,
        patent: '',
        trialPeriod: false,
        qrCode: null,
        qrPending: true,
        reservationId: null,
        statesmanId: null,
        token: expect.any(String),
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date),
        userId: finallyUser.user.id,
      });

      //To do
      if (dayjs().isSame(event.from, 'day')) {
        expect(firebase.pushEventFirebase).toBeCalledTimes(1);
      }
    });
  });

  describe('/v1/customers/${customer}/event-authorization-requests/reject', () => {
    it('/v1/customers/${customer}/event-authorization-requests/{id}/reject (POST)', async () => {
      const eventAuthorizationEvent =
        await prisma.eventAuthorizationRequest.create({
          data: {
            lot: 'D13564',
            authorized: 'camilo garcia',
            customerId: customer.id,
            eventTypeId: VISITAS,
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            monitorId: monitoring.user.id,
            sentBySms: true,
            text: 'por favor llame al guardia',
          },
        });

      const { body } = await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer.id}/event-authorization-requests/${eventAuthorizationEvent.id}/reject`,
        )
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            id: expect.any(String),
            authorized: 'camilo garcia',
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            rejected: true,
            createdAt: expect.any(String),
            customerId: customer.id,
            eventTypeId: VISITAS,
            lot: 'D13564',
            monitorId: monitoring.user.id,
            trialPeriod: false,
            confirmed: false,
            sentBySms: true,
            text: 'por favor llame al guardia',
            updatedAt: expect.any(String),
            userId: null,
          });
        });

      const event = await prisma.event.findFirst({
        where: {
          fullName: body.authorized,
        },
      });

      if (!event) {
        throw new Error();
      }

      expect(event).toStrictEqual({
        changeLog: expect.any(String),
        fullName: body.authorized,
        eventTypeId: VISITAS,
        eventStateId: RECHAZADO,
        from: expect.any(Date),
        to: expect.any(Date),
        authorizedUserId: null,
        customerId: expect.any(String),
        description: null,
        dni: null,
        trialPeriod: false,
        externalId: null,
        file: null,
        firstName: null,
        id: expect.any(String),
        isCopy: false,
        isDelivery: false,
        isPermanent: false,
        lastName: null,
        lot: 'D13564',
        monitorId: null,
        observations: null,
        patent: null,
        qrCode: null,
        qrPending: false,
        reservationId: null,
        statesmanId: null,
        token: null,
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date),
        userId: finallyUser.user.id,
      });
    });

    it('/v1/customers/${customer}/event-authorization-requests/{id}/reject (AUTHORIZATION_REQUIRED)', async () => {
      const eventAuthorizationEvent =
        await prisma.eventAuthorizationRequest.create({
          data: {
            lot: 'D13564',
            authorized: 'camilo garcia',
            customerId: customer.id,
            eventTypeId: VISITAS,
            authorizedUserId: '311ee7c0-5552-4995-abca-1e97de78e357',
            monitorId: monitoring.user.id,
            sentBySms: true,
            text: 'por favor llame al guardia',
          },
        });

      return await request(app.getHttpServer())
        .post(
          `/v1/customers/${customer.id}/event-authorization-requests/${eventAuthorizationEvent.id}/reject`,
        )
        .set('Authorization', `Bearer ${monitoring.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toStrictEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
          });
        });
    });
  });
});
