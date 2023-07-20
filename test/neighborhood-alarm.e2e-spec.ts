import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '.prisma/client';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { AppModule } from '../src/app.module';
import { createUserAndToken } from './utils/users';
import * as request from 'supertest';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import {
  Customer,
  CustomerType,
  NeighborhoodAlarm,
  User,
} from '@prisma/client';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { julio1176 } from './mocks/google-response';
import { ExternalService } from '@src/common/services/external.service';
import { ExternalServiceMock } from '@src/common/services/mocks/external.service';

describe('NeighborhoodController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let firebase: FirebaseService;

  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let externalService: ExternalServiceMock;
  let finallyUser: { user: User; token: string };
  let finallyUser2: { user: User; token: string };
  let statesman: { user: User; token: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(ExternalService)
      .useValue(ExternalServiceMock)
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

    externalService = app.get(ExternalService);

    customer = await createCustomer(prisma, {
      name: 'harvard',
      type: CustomerType.government,
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

    finallyUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'raul',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'raul arias',
      role: Role.user,
      active: true,
      emergencyNumber: '541136280121',
      alarmNumber: '541136280122',
      homeAddress: {
        fullAddress: {
          formatted_address:
            '9 de Julio 1176, B1646 San Fernando, Provincia de Buenos Aires, Argentina',
          number: '1176',
          street: '9 de Julio',
          city: 'San Fernando',
          district: 'San Fernando',
          state: 'Provincia de Buenos Aires',
          country: 'Argentina',
          geolocation: { lat: -34.4410971, lng: -58.5563252 },
        },
        neighborhoodId: '5dea891e-7fa7-4714-8018-562b01688324',
      },
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    await prisma.location.create({
      data: {
        name: 'barrio prueb',
        type: 'neighborhood',
        id: '5dea891e-7fa7-4714-8018-562b01688324',
        customerId: customer.id,
        updatedById: user.id,
      },
    });

    finallyUser2 = await createUserAndToken(prisma, {
      username: '541136280121',
      password: '123456',
      firstName: 'raul',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'raul arias',
      role: Role.user,
      active: true,
      customer: {
        connect: {
          id: customer2.id,
        },
      },
    });

    await prisma.neighborhoodAlarm.createMany({
      data: [
        {
          urgencyNumber: '541166480626',
          approximateAddress:
            '9 de Julio 1176, B1646 San Fernando, Provincia de Buenos Aires, Argentina',
          geolocation: { coords: { lat: -34.4410971, lng: -58.5563252 } },
          userId: finallyUser.user.id,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:29:12'),
          updatedAt: new Date('2021-02-01 13:29:12'),
        },
        {
          urgencyNumber: '541126594825',
          approximateAddress:
            'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
          geolocation: { coords: { lat: -34.4410971, lng: -58.5563252 } },
          userId: finallyUser.user.id,
          customerId: customer.id,
          createdAt: new Date('2021-02-01 13:27:48'),
          updatedAt: new Date('2021-02-01 13:27:48'),
        },
        {
          urgencyNumber: '542648753132',
          approximateAddress: '30',
          geolocation: { coords: { lat: -34.4410971, lng: -58.5563252 } },
          userId: finallyUser2.user.id,
          customerId: customer2.id,
          createdAt: new Date('2021-02-01 13:27:10'),
          updatedAt: new Date('2021-09-04 15:21:14'),
        },
      ],
    });

    await prisma.alertType.create({
      data: {
        type: 'panic',
        name: 'Antipánico',
      },
    });

    await prisma.alertState.create({
      data: {
        name: 'Emitida',
        customerId: null,
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${customer}/neighborhood-alarm (GET)', () => {
    it('/v1/customers/${customer}/neighborhood-alarm (statesman) with filters (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/neighborhood-alarm`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            urgencyNumber: '541126594825',
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              urgencyNumber: '541126594825',
              approximateAddress:
                'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
              geolocation: { coords: { lat: -34.4410971, lng: -58.5563252 } },
              userId: finallyUser.user.id,
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

    it('/v1/customers/${customer}/neighborhood-alarm (statesman) (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/neighborhood-alarm`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: NeighborhoodAlarm) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('urgencyNumber');
            expect(item).toHaveProperty('approximateAddress');
            expect(item).toHaveProperty('geolocation');
            expect(item).toHaveProperty('userId');
            expect(item).toHaveProperty('customerId');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
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

    it('/v1/customers/${customer}/neighborhood-alarm (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/neighborhood-alarm`)
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

    it('/v1/customers/${customer}/neighborhood-alarm (GET) 403 forbidden (FINAL USER)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer?.id}/neighborhood-alarm`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
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

  describe('/v1/customers/${customer}/neighborhood-alarm (POST)', () => {
    it.skip('/v1/customers/${customer}/neighborhood-alarm (POST)', async () => {
      await prisma.user.createMany({
        data: [
          {
            username: '1166452757',
            customerId: customer.id,
            pushId: 'token-prueba',
            password: 'password',
            emergencyNumber: '541136280121',
            alarmNumber: '541136280122',
            firstName: 'carlos',
            lastName: 'salcedo',
            fullName: 'carlos salcedo',
          },
          {
            username: '1166552151',
            customerId: customer.id,
            emergencyNumber: '541136280121',
            alarmNumber: '541136280122',
            pushId: 'token-prueba',
            password: 'password',
            firstName: 'julia',
            lastName: 'torrez',
            fullName: 'julia torrez',
          },
        ],
      });

      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.reverseGeocoding.mockResolvedValueOnce(julio1176);

      const { body } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/neighborhood-alarm`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            urgencyNumber: '541136280122',
            approximateAddress: '9 de Julio 1176 ',
            geolocation: { coords: { lat: -34.4410971, lng: -58.5563252 } },
            userId: finallyUser.user.id,
            customerId: customer.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });

      const count = await prisma.neighborhoodAlarmUsers.count({
        where: {
          neighborhoodAlarmId: body.id,
        },
      });

      expect(count).toBe(2);

      const alert = await prisma.alert.findFirst({
        where: {
          city: 'San Carlos de Bolivar',
          country: 'Argentina',
          district: 'San Carlos de Bolivar',
          state: 'B1646 San Fernando',
        },
      });

      expect(alert).toMatchObject({
        city: 'San Carlos de Bolivar',
        country: 'Argentina',
        district: 'San Carlos de Bolivar',
        state: 'B1646 San Fernando',
      });

      expect(firebase.pushAlertFirebase).toBeCalledTimes(1);
    });

    it('/v1/customers/${customer}/neighborhood-alarm (statesman) (USER_NOT_FOUND) (GET)', async () => {
      const finalUserInactive = await createUserAndToken(prisma, {
        username: '541166480636',
        password: '123456',
        firstName: 'camilo',
        lastName: 'arias',
        lot: 'A3',
        fullName: 'camilo arias',
        role: Role.user,
        active: false,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/neighborhood-alarm`)
        .set('Authorization', `Bearer ${finalUserInactive.token}`)
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'INACTIVE_USER',
          });
        });
    });
  });
});
