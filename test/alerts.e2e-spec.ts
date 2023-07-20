/* eslint-disable @typescript-eslint/no-loss-of-precision */
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Customer, NotificationType, User } from '@prisma/client';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import {
  createAdminUserAndToken,
  createFinalUser,
  createUserAndToken,
} from './utils/users';
import { createCustomer, createGovernmentCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';
import {
  alerts,
  alertStates,
  alertTypes,
  users,
  statesman as statesmanPrisma,
  customer as customerPrisma,
  customer2 as customer2Prisma,
} from './fakes/alerts.fake';
import { omit } from 'lodash';
import { createSms } from './utils/createSms';
import { ExternalService } from '@src/common/services/external.service';
import { ExternalServiceMock } from '@src/common/services/mocks/external.service';
import {
  necochea460BOJ,
  necochea460,
  rondeau515,
  caba,
} from './mocks/google-response';
import delay from './utils/delay';
import { Role } from '@prisma/client';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';

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

describe('AlertController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  // let token: string;
  let admin: { user: User; token: string };
  let externalService: ExternalServiceMock;
  let statesman: { user: User; token: string };
  let customer: Customer;
  let customer2: Customer;
  let finalUser: {
    user: User & { customer: Customer | null };
    token: string;
  };
  let finalUser2: {
    user: User & { customer: Customer | null };
    token: string;
  };

  const cyberMapResponse = async (url, user, pass, action) => {
    if (action === 'GETVEHICULOS') {
      return [
        {
          id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
          descripcion: 'Auto%20Amarillo',
        },
      ];
    }

    return [
      {
        gps_id: 'b3c2961b-88fb-4121-8e10-ba08a456addf',
        alias: 'patasola',
        gps: 'si',
        fecha: '11/02/2023',
        sentido: 'drecho',
        velocidad: '80km',
        evento: 'un evento',
        parking_activado: '120km',
        parking_distancia: '20km',
        latitud: '-36.2381446852903',
        longitud: '-61.113571765609045',
        nombre: 'mauricio gallego',
        patente: 'AA979KD',
      },
    ];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ExternalService)
      .useValue(ExternalServiceMock)
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .compile();

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
    externalService = app.get(ExternalService);
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

    await prisma.permission.createMany({
      data: [
        {
          id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
          action: 'list-alerts',
          name: 'listado de alertas',
          category: 'alerts',
          statesman: true,
          monitoring: true,
        },
        {
          id: 'd85dada8-26d1-453b-8e9b-d55085576c58',
          action: 'attend-alert',
          name: 'puede modificar',
          category: 'alerts',
          statesman: true,
          monitoring: true,
        },
      ],
    });

    await prisma.alertType.createMany({
      data: alertTypes,
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
      alertTypes: {
        createMany: {
          data: alertTypes.map((alertType, idx) => ({
            alertTypeId: alertType.id || '',
            order: idx,
          })),
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
      alertTypes: {
        createMany: {
          data: alertTypes.map((alertType, idx) => ({
            alertTypeId: alertType.id || '',
            order: idx,
          })),
        },
      },
    });

    statesman = await createUserAndToken(prisma, statesmanPrisma);
    await prisma.user.createMany({
      data: users,
    });

    await prisma.alertState.createMany({
      data: alertStates,
    });

    await prisma.alert.createMany({
      data: alerts,
    });

    await prisma.location.create({
      data: {
        id: 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32',
        name: 'Béccar',
        type: 'locality',
        createdAt: new Date('2020-09-18 19:50:30'),
        updatedById: admin.user.id,
        customerId: customer2.id,
      },
    });

    finalUser = await createUserAndToken(prisma, {
      id: '8a9b251e-9986-4abb-bd74-8b4f5a31638f',
      username: '541166480626',
      verificationCode: '201914',
      password: '201914',
      firstName: 'Mauricio',
      lastName: 'Gallego',
      pushId: '495a7cb2-a607-11ec-a592-02f2e64235a7',
      role: 'user',
      customer: { connect: { id: customer.id } },
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
      fullName: 'Mauricio Gallego',
      idCard: '13111222',
    });

    finalUser2 = await createUserAndToken(prisma, {
      username: '541166480620',
      verificationCode: '201914',
      password: '201914',
      firstName: 'Camilo',
      lastName: 'Gallego',
      pushId: '495a7cb2-a607-11ec-a592-02f2e64235a7',
      role: 'user',
      customer: { connect: { id: customer2.id } },
      homeAddress: {
        fullAddress: {
          formatted_address:
            'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
          number: '486',
          street: 'Necochea',
          city: 'San Carlos de Bolivar',
          district: 'San Carlos de Bolivar',
          state: 'Provincia de Buenos Aires',
          country: 'Argentina',
          geolocation: { lat: -36.238190510693692, lng: -61.1135625344127692 },
        },
        neighborhoodId: 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32',
      },
      fullName: 'Camilo Gallego',
      idCard: '13111222',
    });

    await request(app.getHttpServer())
      .post(`/v1/users/${finalUser.user.id}/contacts`)
      .set('Authorization', `Bearer ${finalUser.token}`)
      .send({
        phoneNumber: '541123199052',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'Nerina Capital',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+541123199052',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/alerts (GET)', () => {
    // list-alert permission
    it('/v1/alerts filters with AlertType (GET)', async () => {
      await prisma.permission.updateMany({
        data: {
          statesman: false,
        },
        where: {
          action: 'list-alerts',
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            alertType: {
              is: {
                type: 'fire',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 20,
            skip: 0,
            size: 3,
            hasMore: false,
          });
        });
    });
    // attend-alert
    it('/v1/alerts filters with AlertType (GET)', async () => {
      await prisma.permission.updateMany({
        data: {
          statesman: true,
        },
        where: {
          action: 'attend-alert',
        },
      });
      await prisma.permission.updateMany({
        data: {
          statesman: false,
        },
        where: {
          action: 'list-alerts',
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            alertType: {
              is: {
                type: 'fire',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 20,
            skip: 0,
            size: 3,
            hasMore: false,
          });
        });
    });

    it('/v1/alerts filters with AlertType (GET) consulting other customer', async () => {
      const customer3 = await createCustomer(prisma, {
        name: 'monserrat',
        district: 'buenos aires',
        state: 'buenos aires',
        country: 'argentina',
        updatedBy: {
          connect: {
            id: admin.user.id,
          },
        },
      });

      const finalUser3 = await createFinalUser(prisma, {
        username: '54112311654',
      });

      await prisma.alert.create({
        data: {
          geolocation: {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: '2022-04-27T03:11:56.656Z',
            coords: {
              accuracy: 35,
              altitude: 94.36762619018555,
              altitudeAccuracy: 11.466069221496582,
              heading: -1,
              latitude: -36.2381446852903,
              longitude: -61.113571765609045,
              speed: -1,
            },
          },
          approximateAddress:
            'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
          userId: finalUser3.id,
          createdAt: new Date('2022-04-27T06:11:00.000Z'),
          updatedAt: new Date('2022-04-27T06:11:00.000Z'),
          customerId: customer3.id,
          alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        },
      });

      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id, customer3.id],
            },
          }),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'CUSTOMER_NOT_ALLOWED',
            statusCode: 422,
          });
        });
    });

    it('/v1/alerts filters with AlertState (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            alertState: {
              is: {
                name: 'Emitida',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 20,
            skip: 0,
            size: 3,
            hasMore: false,
          });
        });
    });

    it('/v1/alerts filters with user (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            user: {
              is: {
                firstName: 'Nerina',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 2,
            take: 20,
            skip: 0,
            size: 2,
            hasMore: false,
          });
        });
    });

    it('/v1/alerts filters with AlertType and AlertState (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            alertType: {
              is: {
                type: 'fire',
              },
            },
            alertState: {
              is: {
                name: 'Emitida',
              },
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
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

    it('/v1/alerts filters with from date (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            createdAt: {
              gte: new Date('2022-04-07T06:11:00.000Z'),
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
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

    it('/v1/alerts filters with to date (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: [customer.id],
            },
            createdAt: {
              lt: new Date('2022-04-07T06:11:00.000Z'),
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 5,
            take: 20,
            skip: 0,
            size: 5,
            hasMore: false,
          });
        });
    });

    it('/v1/alerts filters with customer child (GET)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            customerId: {
              in: ['cb645c46-85fb-4d81-ba92-d827b8084186'],
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toMatchObject([
            {
              approximateAddress:
                'Bosques de varsovia, Ibague, Tolima, Colombia',
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
  });

  describe('/v1/alerts/${id} (GET)', () => {
    it('/v1/alerts/${id} (GET)', async () => {
      const alert = await prisma.alert.findUnique({
        where: {
          id: '53454af6-c2c0-4712-bead-ea982e767dd6',
        },
        include: {
          alertState: true,
        },
      });
      if (!alert) {
        throw new TypeError();
      }
      return await request(app.getHttpServer())
        .get(`/v1/alerts/${alert.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          include: JSON.stringify({
            alertState: true,
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...alert,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('/v1/alerts/${id} (GET) NOT FOUND', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts/53454af6-c2c0-4712-bead-ea982e767dd5`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'ALERT_NOT_FOUND',
            statusCode: 404,
          });
        });
    });
  });

  describe('/v1/alerts/${id}/change-state (PATCH)', () => {
    it('/v1/alerts/${id}/change-state (PATCH)', async () => {
      const alert = await prisma.alert.findUnique({
        where: {
          id: '53454af6-c2c0-4712-bead-ea982e767dd6',
        },
        include: {
          alertState: true,
          alertType: true,
          user: true,
        },
      });
      if (!alert) {
        throw new TypeError();
      }
      await request(app.getHttpServer())
        .patch(`/v1/alerts/${alert.id}/change-state`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
          observations: 'alguito aca',
          code: 'AA979KD',
          customerId: customer.id,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...alert,
            user: {
              ...omit(alert.user, 'password'),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              lastAccessToMenu: expect.any(String),
            },
            code: 'AA979KD',
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            observations: 'alguito aca',
            alertStateUpdatedAt: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          expect(new Date(res.body.updatedAt).getUTCMilliseconds()).not.toBe(
            new Date(alert.updatedAt).getUTCMilliseconds(),
          );
        });

      /*       const notification = await prisma.notification.findFirst({
        where: {
          title: `Alerta de ${alert.alertType.name}`,
          userId: alert.userId,
          alertId: alert.id,
        },
      });

      expect(notification).toStrictEqual({
        title: `Alerta de ${alert.alertType.name}`,
        userId: alert.userId,
        alertId: alert.id,
        authorizationRequestId: null,
        createdAt: expect.any(Date),
        customerId: customer.id,
        trialPeriod: true,
        description: 'La alerta de Mala compañía cambio de estado a Emitida',
        emergency: true,
        eventId: null,
        fromLot: null,
        id: expect.any(String),
        image: {
          name: '3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
          thumbnailUrl:
            'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c-thumbnail.jpg',
          url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/users/image/3ba8b71b-717c-4f73-841c-8a3ad273f95c.jpg',
        },
        locationId: null,
        notificationType: 'user',
        sendAt: expect.any(Date),
        toLot: null,
      }); */
    });

    it('/v1/alerts/${id}/change-state (PATCH) monitoringCustomer', async () => {
      const alert = await prisma.alert.create({
        data: {
          alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
          geolocation: {},
          userId: statesman.user.id,
          customerId: 'cb645c46-85fb-4d81-ba92-d827b8084186',
        },
        include: {
          alertState: true,
          alertType: true,
          user: true,
        },
      });
      if (!alert) {
        throw new TypeError();
      }
      await request(app.getHttpServer())
        .patch(`/v1/alerts/${alert.id}/change-state`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          alertStateId: '879b2fde-938f-40b9-9f53-9b48255ed3a0',
          observations: 'alguito aca',
          code: 'AA979KD',
          customerId: 'cb645c46-85fb-4d81-ba92-d827b8084186',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...alert,
            trialPeriod: false,
            user: {
              ...omit(alert.user, 'password'),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              lastAccessToMenu: null,
            },
            alertState: {
              active: true,
              customerId: null,
              id: '879b2fde-938f-40b9-9f53-9b48255ed3a0',
              name: 'Atendida',
            },
            code: 'AA979KD',
            alertStateId: '879b2fde-938f-40b9-9f53-9b48255ed3a0',
            observations: 'alguito aca',
            alertStateUpdatedAt: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });

          expect(new Date(res.body.updatedAt).getUTCMilliseconds()).not.toBe(
            new Date(alert.updatedAt).getUTCMilliseconds(),
          );
        });

      /*       const notification = await prisma.notification.findFirst({
        where: {
          title: `Alerta de ${alert.alertType.name}`,
          userId: alert.userId,
          alertId: alert.id,
        },
      });

      expect(notification).toStrictEqual({
        title: `Alerta de ${alert.alertType.name}`,
        userId: alert.userId,
        description: 'La alerta de Mala compañía cambio de estado a Atendida',
        alertId: alert.id,
        authorizationRequestId: null,
        createdAt: expect.any(Date),
        customerId: 'cb645c46-85fb-4d81-ba92-d827b8084186',
        emergency: true,
        eventId: null,
        fromLot: null,
        trialPeriod: false,
        id: expect.any(String),
        image: null,
        locationId: null,
        notificationType: 'user',
        sendAt: expect.any(Date),
        toLot: null,
      }); */
    });

    it('/v1/alerts/${id}/change-state (PATCH) ALERT NOT FOUND', async () => {
      return await request(app.getHttpServer())
        .patch(`/v1/alerts/53454af6-c2c0-4712-bead-ea982e767dd5/change-state`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: 'AA979KD',
          customerId: customer.id,
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'ALERT_NOT_FOUND',
            statusCode: 404,
          });
        });
    });

    it('/v1/alerts/${id}/change-state (PATCH) longer code no accepted', async () => {
      return await request(app.getHttpServer())
        .patch(`/v1/alerts/53454af6-c2c0-4712-bead-ea982e767dd5/change-state`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          code: '12345678908653245AA979KD',
          customerId: customer.id,
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Bad Request',
            message: ['code must be shorter than or equal to 15 characters'],
            statusCode: 400,
          });
        });
    });

    it('/v1/alerts/${id}/change-state (PATCH) ALERT STATE NOT FOUND', async () => {
      const alert = await prisma.alert.findUnique({
        where: {
          id: '53454af6-c2c0-4712-bead-ea982e767dd6',
        },
      });
      if (!alert) {
        throw new TypeError();
      }
      return await request(app.getHttpServer())
        .patch(`/v1/alerts/${alert.id}/change-state`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          customerId: customer.id,
          alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fdd',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'ALERT_STATE_NOT_FOUND',
            statusCode: 404,
          });
        });
    });
  });

  describe('/v1/alerts (POST)', () => {
    const notificationCreated: {
      title: string;
      description: string;
      emergency: boolean;
      notificationType: NotificationType;
      userId: string;
      customerId: string;
    }[] = [];

    const checkpointCreated: string[] = [];

    it('/v1/alerts (POST) (201) (business)', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };

      externalService.getCyberMapa.mockImplementation(cyberMapResponse);
      externalService.getTraccarDevices.mockResolvedValueOnce(
        JSON.stringify([
          {
            status: 'online',
            id: 'f285f646-152c-48fb-8727-32883a401d00',
            model: 'iphone',
            uniqueId: '7e501061-fdb1-42c3-b8eb-0356b9db2554',
            name: 'mauricio',
            category: 'bonito',
          },
          {
            status: 'offline',
            id: '691a7ffe-9126-488b-afb3-3987d2d9b1b4',
            model: 'alcatel',
            uniqueId: '7e501061-fdb1-42c3-b8eb-0356b9db2554',
            name: 'guillermo',
            category: 'feo',
          },
        ]),
      );
      externalService.getTraccarPositions.mockResolvedValueOnce(
        JSON.stringify([
          {
            deviceId: 'f285f646-152c-48fb-8727-32883a401d00',
            latitude: 15,
            longitude: 20,
            accuracy: 0,
            speed: 0,
            attributes: {},
          },
        ]),
      );
      externalService.reverseGeocoding.mockResolvedValueOnce(necochea460);

      const response = await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...data,
            geolocation: {
              ...data.geolocation,
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            geolocations: data.geolocations.map((i) => ({
              ...i,
              coords: {
                ...i.coords,
                altitude: expect.any(Number),
              },
            })),
            userId: finalUser.user.id,
            alertType: {
              id: expect.any(String),
              name: 'Mala compañía',
              type: 'bad-company',
            },
            alertState: {
              id: expect.any(String),
              customerId: null,
              name: 'Emitida',
              active: true,
            },
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            approximateAddress:
              'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
            district: null,
            dragged: null,
            attachment: null,
            city: null,
            code: null,
            country: null,
            state: null,
            trialPeriod: true,
            manual: false,
            neighborhoodId: null,
            neighborhoodAlarmId: null,
            observations: null,
            originalGeolocation: null,
            parentId: null,
            customerId: customer.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            alertStateUpdatedAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              ...omit(finalUser.user, ['customer', 'password']),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });

      checkpointCreated.push(response.body.id);

      notificationCreated.push({
        title: `Alerta de ${response.body.alertType.name}`,
        description: `${finalUser.user.firstName} ${finalUser.user.lastName} emitió una alerta de ${response.body.alertType.name}`,
        emergency: true,
        notificationType: NotificationType.alert,
        userId: finalUser.user.id,
        customerId: response.body.customerId,
      });
    });

    it('/v1/alerts (POST) (201) (government)', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.23790446917013,
            longitude: -61.11338038903867,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };
      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.reverseGeocoding.mockResolvedValueOnce(necochea460BOJ);

      const response = await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser2.token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...data,
            geolocation: {
              ...data.geolocation,
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            geolocations: data.geolocations.map((i) => ({
              ...i,
              coords: {
                ...i.coords,
                altitude: expect.any(Number),
              },
            })),
            userId: finalUser2.user.id,
            alertType: {
              id: expect.any(String),
              name: 'Mala compañía',
              type: 'bad-company',
            },
            alertState: {
              id: expect.any(String),
              customerId: null,
              name: 'Emitida',
              active: true,
            },
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            approximateAddress:
              'BOJ, Necochea 460, B6550 San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
            district: 'Bolívar',
            dragged: null,
            attachment: null,
            city: 'San Carlos de Bolivar',
            code: null,
            country: 'Argentina',
            neighborhoodAlarmId: null,
            state: 'Provincia de Buenos Aires',
            trialPeriod: false,
            manual: false,
            contactsOnly: true,
            neighborhoodId: 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32',
            observations: null,
            originalGeolocation: null,
            parentId: null,
            customerId: customer2.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            alertStateUpdatedAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              ...omit(finalUser2.user, ['customer', 'password']),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });

      checkpointCreated.push(response.body.id);

      notificationCreated.push({
        title: `Alerta de ${response.body.alertType.name}`,
        description: `${finalUser2.user.firstName} ${finalUser2.user.lastName} emitió una alerta de ${response.body.alertType.name}`,
        emergency: true,
        notificationType: NotificationType.alert,
        userId: finalUser2.user.id,
        customerId: response.body.customerId,
      });
    });

    it('/v1/alerts (POST) (201) (government) different customer', async () => {
      const anotherCustomer = await createGovernmentCustomer(prisma, {
        name: 'casa mio',
        state: 'Buenos Aires',
        district: 'CABA',
        country: 'Argentina',
        updatedBy: {
          connect: {
            id: '0e06aa6f-73c6-425c-9de1-5e533a3652f9',
          },
        },
        alertTypes: {
          createMany: {
            data: alertTypes.map((alert, index) => ({
              alertTypeId: alert?.id || '',
              order: index,
            })),
          },
        },
      });

      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -34.629906,
            longitude: -58.446436,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };
      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.reverseGeocoding.mockResolvedValueOnce(caba);

      return await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser2.token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...data,
            geolocation: {
              ...data.geolocation,
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            geolocations: data.geolocations.map((i) => ({
              ...i,
              coords: {
                ...i.coords,
                altitude: expect.any(Number),
              },
            })),
            userId: finalUser2.user.id,
            alertType: {
              id: expect.any(String),
              name: 'Mala compañía',
              type: 'bad-company',
            },
            alertState: {
              id: expect.any(String),
              customerId: null,
              name: 'Emitida',
              active: true,
            },
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            approximateAddress: 'Av. Directorio 1400-1302, C1406GZP CABA',
            dragged: null,
            attachment: null,
            code: null,
            city: 'San Carlos de Bolivar',
            state: 'Buenos Aires',
            district: 'CABA',
            country: 'Argentina',
            trialPeriod: false,
            neighborhoodAlarmId: null,
            manual: false,
            contactsOnly: true,
            neighborhoodId: null,
            observations: null,
            originalGeolocation: null,
            parentId: null,
            customerId: anotherCustomer.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            alertStateUpdatedAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              ...omit(finalUser2.user, ['customer', 'password']),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/alerts (POST) (201) (business) (approximateAddress)', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2369217,
            longitude: -61.1160461,
            speed: -1,
          },
        },
        approximateAddress:
          'Necochea 486, capital, Provincia de Buenos Aires, Argentina',
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };

      externalService.getCyberMapa.mockImplementation(cyberMapResponse);
      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.reverseGeocoding.mockResolvedValueOnce(rondeau515);

      const response = await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...data,
            geolocation: {
              ...data.geolocation,
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            geolocations: data.geolocations.map((i) => ({
              ...i,
              coords: {
                ...i.coords,
                altitude: expect.any(Number),
              },
            })),
            userId: finalUser.user.id,
            alertType: {
              id: expect.any(String),
              name: 'Mala compañía',
              type: 'bad-company',
            },
            alertState: {
              id: expect.any(String),
              customerId: null,
              name: 'Emitida',
              active: true,
            },
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            approximateAddress:
              'Rondeau 515, B6550CDK San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
            district: 'Bolívar',
            dragged: null,
            attachment: null,
            city: 'San Carlos de Bolivar',
            code: null,
            country: 'Argentina',
            state: 'Provincia de Buenos Aires',
            trialPeriod: true,
            manual: false,
            neighborhoodId: null,
            observations: null,
            originalGeolocation: null,
            parentId: null,
            customerId: customer.id,
            id: expect.any(String),
            neighborhoodAlarmId: null,
            createdAt: expect.any(String),
            alertStateUpdatedAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              ...omit(finalUser.user, ['customer', 'password']),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });

      checkpointCreated.push(response.body.id);

      notificationCreated.push({
        title: `Alerta de ${response.body.alertType.name}`,
        description: `${finalUser2.user.firstName} ${finalUser2.user.lastName} emitió una alerta de ${response.body.alertType.name}`,
        emergency: true,
        notificationType: NotificationType.alert,
        userId: finalUser2.user.id,
        customerId: response.body.customerId,
      });
    });

    it('/v1/alerts (POST) (422) alert type not found ', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5194',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };
      await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 422,
            message: 'ALERT_TYPE_NOT_FOUND',
          });
        });
    });

    it('/v1/alerts (POST) (400) bad request', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5194',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: '2022-04-27T03:11:46.535Z',
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };

      await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Bad Request',
            statusCode: 400,
            message: [
              'geolocation.coords.latitude must be a number conforming to the specified constraints',
              'geolocation.coords.latitude should not be empty',
              'geolocation.coords.longitude must be a number conforming to the specified constraints',
              'geolocation.coords.longitude should not be empty',
              'geolocations.0.timestamp must be a number conforming to the specified constraints',
            ],
          });
        });
    });

    it('validate if the notifications and checkpoints are created', async () => {
      await delay(1000);
      const findNotifications = await prisma.notification.findMany({
        where: {
          OR: notificationCreated.map((i) => ({
            userId: i.userId,
            customerId: i.customerId,
          })),
        },
      });

      expect(findNotifications.length).toBe(4);

      const findCheckpoints = await prisma.checkpoint.findMany({
        where: {
          OR: checkpointCreated.map((i) => ({
            alertId: i,
          })),
        },
      });

      expect(findCheckpoints.length).toBe(3);

      const cyberMap = await prisma.externalService.count({
        where: {
          service: 'Cybermapa',
        },
      });

      expect(cyberMap).toBe(2);

      const traccar = await prisma.externalService.count({
        where: {
          service: 'Traccar',
        },
      });

      expect(traccar).toBe(1);
    });
  });

  describe('/v1/alerts/sms (POST)', () => {
    it('/v1/alerts/sms (POST) (201) (alert)', async () => {
      const toEncrypt = {
        accessToken: finalUser.user.id,
        type: 'robbery',
        geolocation: {
          battery: { level: 0.59 },
          coords: {
            accuracy: 12,
            latitude: -36.2381023,
            longitude: -61.113611,
          },
        },
      };

      const hash = createSms(toEncrypt);

      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.getCyberMapa.mockImplementation(cyberMapResponse);

      await request(app.getHttpServer())
        .get(`/v1/alerts/sms`)
        .query({
          msj: hash,
        })
        .expect(200);

      const alertCreated = await prisma.alert.findMany({
        where: {
          userId: finalUser.user.id,
          alertType: {
            type: 'robbery',
          },
        },
      });
      expect(alertCreated.length).toBeGreaterThan(0);
    });

    it('/v1/alerts/sms (POST) (neigh)', async () => {
      const finalUserGovernment = await prisma.user.create({
        data: {
          customerId: customer2.id,
          username: '541166480626',
          password: '123456',
          firstName: 'mauricio',
          lastName: 'gallego',
          role: Role.user,
          fullName: 'mauricio gallego',
          customerType: 'government',
          updatedById: admin.user.id,
          alarmNumber: '112233',
          homeAddress: {
            fullAddress: {
              city: 'San Carlos de Bolivar',
              state: 'Provincia de Buenos Aires',
              number: '490',
              street: 'Necochea',
              country: 'Argentina',
              district: 'Bolívar',
              geolocation: { lat: '-36.2382288', lng: '-61.1135118' },
              formatted_address:
                'Necochea 490, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
            },
          },
        },
      });

      const panic = await prisma.alertType.create({
        data: {
          type: 'panic',
          name: 'panico',
        },
      });

      const toEncrypt = {
        accessToken: finalUserGovernment.id,
        type: 'neighborhood-alarm',
      };

      const hash = createSms(toEncrypt);

      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');
      externalService.getCyberMapa.mockImplementation(cyberMapResponse);

      await request(app.getHttpServer())
        .get(`/v1/alerts/sms`)
        .query({
          msj: hash,
        })
        .expect(200);

      const alertCreated = await prisma.alert.findFirst({
        where: {
          userId: finalUserGovernment.id,
          alertType: {
            type: 'panic',
          },
        },
      });
      expect(alertCreated).toStrictEqual({
        alertStateId: '674a171f-2180-4072-baa9-f8ad95325d2d',
        alertStateUpdatedAt: expect.any(Date),
        alertTypeId: panic.id,
        approximateAddress: 'Necochea 490 ',
        attachment: null,
        city: null,
        code: null,
        country: null,
        createdAt: expect.any(Date),
        customerId: customer2.id,
        district: null,
        dragged: null,
        geolocation: {
          battery: {
            level: 1,
          },
          coords: {
            latitude: '-36.2382288',
            longitude: '-61.1135118',
          },
          timestamp: expect.any(Number),
        },
        geolocations: null,
        id: expect.any(String),
        manual: false,
        neighborhoodAlarmId: expect.any(String),
        neighborhoodId: null,
        observations: null,
        originalGeolocation: null,
        parentId: null,
        state: null,
        trialPeriod: false,
        updatedAt: expect.any(Date),
        userId: finalUserGovernment.id,
      });

      const neigh = await prisma.neighborhoodAlarm.findFirst({
        where: {
          userId: finalUserGovernment.id,
          urgencyNumber: finalUserGovernment.alarmNumber,
        },
      });
      expect(neigh).toStrictEqual({
        approximateAddress: 'Necochea 490 ',
        createdAt: expect.any(Date),
        customerId: customer2.id,
        geolocation: {
          coords: {
            lat: '-36.2382288',
            lng: '-61.1135118',
          },
        },
        id: expect.any(String),
        updatedAt: expect.any(Date),
        urgencyNumber: '112233',
        userId: finalUserGovernment.id,
      });
    });

    it('/v1/alerts/sms (POST) (401)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/alerts/sms`)
        .query({
          msj: 'sdfsdfsd-sdfsdf',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unauthorized',
            statusCode: 401,
            message: 'AUTHORIZATION_REQUIRED',
          });
        });
    });

    it('/v1/alerts/sms (POST) (422)', async () => {
      const toEncrypt = {
        accessToken: finalUser.user.id,
        type: '',
        geolocation: {
          battery: { level: 0.59 },
          coords: {
            accuracy: 12,
            latitude: -36.2381023,
            longitude: -61.113611,
          },
        },
        alertTypeId: 'abc59c01-d8ac-4a2b-b6b6-ba18dac9c185',
      };

      const hash = createSms(toEncrypt);
      await request(app.getHttpServer())
        .get(`/v1/alerts/sms`)
        .query({
          msj: hash,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 422,
            message: 'ALERT_TYPE_NOT_FOUND',
          });
        });
    });
  });

  describe('/v1/alerts/:alert/checkpoint (POST)', () => {
    it('/v1/alerts/:alert/checkpoint (POST) (201)', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };
      externalService.reverseGeocoding.mockResolvedValueOnce(necochea460);
      externalService.getCyberMapa.mockImplementation(cyberMapResponse);
      externalService.getTraccarDevices.mockResolvedValueOnce('[]');
      externalService.getTraccarPositions.mockResolvedValueOnce('[]');

      const res = await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...data,
            geolocation: {
              ...data.geolocation,
              timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            geolocations: data.geolocations.map((i) => ({
              ...i,
              timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
              coords: {
                ...i.coords,
                altitude: expect.any(Number),
              },
            })),
            alertType: {
              id: expect.any(String),
              name: 'Mala compañía',
              type: 'bad-company',
            },
            alertState: {
              id: expect.any(String),
              customerId: null,
              name: 'Emitida',
              active: true,
            },
            alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            approximateAddress:
              'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
            district: null,
            dragged: null,
            attachment: null,
            city: null,
            code: null,
            country: null,
            state: null,
            // country: 'Argentina',
            // state: 'Provincia de Buenos Aires',
            userId: finalUser.user.id,
            trialPeriod: true,
            manual: false,
            neighborhoodId: null,
            neighborhoodAlarmId: null,
            observations: null,
            originalGeolocation: null,
            parentId: null,
            customerId: customer.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            alertStateUpdatedAt: expect.any(String),
            updatedAt: expect.any(String),
            user: {
              ...omit(finalUser.user, ['customer', 'password']),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });

      return await request(app.getHttpServer())
        .post(`/v1/alerts/${res.body.id}/checkpoint`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send({
          geolocation: {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.36762619018555,
              altitudeAccuracy: 11.466069221496582,
              heading: -1,
              latitude: -36.2381446852903,
              longitude: -61.113571765609045,
              speed: -1,
            },
          },
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toBeInstanceOf(Object);
          expect(body).toStrictEqual({
            geolocation: {
              ...data.geolocation,
              timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
              coords: {
                ...data.geolocation.coords,
                altitude: expect.any(Number),
              },
            },
            alertId: expect.any(String),
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            alert: {
              geolocation: {
                ...data.geolocation,
                timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
                coords: {
                  ...data.geolocation.coords,
                  altitude: expect.any(Number),
                },
              },
              geolocations: data.geolocations.map((i) => ({
                ...i,
                timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
                coords: {
                  ...i.coords,
                  altitude: expect.any(Number),
                },
              })),
              alertStateId: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
              approximateAddress:
                'Necochea 486, B6550BOJ San Carlos de Bolivar, Provincia de Buenos Aires, Argentina',
              district: null,
              dragged: null,
              userId: finalUser.user.id,
              attachment: null,
              city: null,
              code: null,
              country: null,
              state: null,
              trialPeriod: true,
              manual: false,
              neighborhoodId: null,
              neighborhoodAlarmId: null,
              observations: null,
              originalGeolocation: null,
              parentId: null,
              customerId: customer.id,
              id: expect.any(String),
              alertTypeId: expect.any(String),
              createdAt: expect.any(String),
              alertStateUpdatedAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/alerts/:alert/checkpoint (POST) (404) (ALERT_NOT_FOUND)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/alerts/71d56564-8062-4b79-9e54-5cae3ec1ce11/checkpoint`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send({
          geolocation: {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'wifi',
            timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.36762619018555,
              altitudeAccuracy: 11.466069221496582,
              heading: -1,
              latitude: -36.2381446852903,
              longitude: -61.113571765609045,
              speed: -1,
            },
          },
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            statusCode: 404,
            error: 'Not Found',
            message: 'ALERT_NOT_FOUND',
          });
        });
    });

    it('validate if the notifications, external service and checkpoints are created', async () => {
      await delay(1000);
      const findExternalService = await prisma.externalService.count({
        where: {},
      });

      expect(findExternalService).toBe(5);
    });
  });

  describe('/v1/alerts/:alert/checkpoints (GET)', () => {
    it('/v1/alerts/:alert/checkpoints', async () => {
      const data = {
        alertTypeId: '51a5424b-3956-41ca-8b5d-d0a15dcd5195',
        geolocation: {
          battery: {
            level: 0.49,
            is_charging: false,
          },
          network: 'wifi',
          timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
          coords: {
            accuracy: 35,
            altitude: 94.36762619018555,
            altitudeAccuracy: 11.466069221496582,
            heading: -1,
            latitude: -36.2381446852903,
            longitude: -61.113571765609045,
            speed: -1,
          },
        },
        geolocations: [
          {
            battery: {
              level: 0.49,
              is_charging: false,
            },
            network: 'red',
            timestamp: new Date('2022-04-27T03:11:46.535Z').getTime(),
            coords: {
              accuracy: 35,
              altitude: 94.30491256,
              altitudeAccuracy: 16.607820510864258,
              heading: -1,
              latitude: -36.2381905106935,
              longitude: -61.11356253441276,
              speed: -1,
            },
          },
        ],
      };
      const { body: alert } = await request(app.getHttpServer())
        .post(`/v1/alerts`)
        .set('Authorization', `Bearer ${finalUser.token}`)
        .send(data)
        .expect(201);

      await prisma.checkpoint.createMany({
        data: [
          {
            alertId: alert.id,
            geolocation: {
              coords: {
                speed: 6.67,
                longitude: -61.116053848863714,
                latitude: -36.2274554367994,
                accuracy: 4.6,
                altitude: 99.5,
                heading: 134.08,
              },
              battery: {
                level: 0.5099999904632568,
                is_charging: false,
              },
              timestamp: 13514141234134,
              network: 'wifi',
            },
          },
          {
            alertId: alert.id,
            geolocation: {
              coords: {
                speed: 6.67,
                longitude: -61.116053848863714,
                latitude: -36.2274554367994,
                accuracy: 4.6,
                altitude: 99.5,
                heading: 134.08,
              },
              battery: {
                level: 0.5099999904632568,
                is_charging: false,
              },
              timestamp: 13514141234134,
              network: 'wifi',
            },
          },
          {
            alertId: alert.id,
            geolocation: {
              coords: {
                speed: 6.67,
                longitude: -61.116053848863714,
                latitude: -36.2274554367994,
                accuracy: 4.6,
                altitude: 99.5,
                heading: 134.08,
              },
              battery: {
                level: 0.5099999904632568,
                is_charging: false,
              },
              timestamp: 13514141234134,
              network: 'wifi',
            },
          },
          {
            alertId: alert.id,
            geolocation: {
              coords: {
                speed: 6.67,
                longitude: -61.116053848863714,
                latitude: -36.2274554367994,
                accuracy: 4.6,
                altitude: 99.5,
                heading: 134.08,
              },
              battery: {
                level: 0.5099999904632568,
                is_charging: false,
              },
              timestamp: 13514141234134,
              network: 'wifi',
            },
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/alerts/${alert.id}/checkpoints`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          orderBy: JSON.stringify({
            createdAt: 'desc',
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.results).toEqual([
            {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              id: expect.any(String),
              alertId: alert.id,
              geolocation: {
                coords: {
                  speed: 6.67,
                  longitude: -61.116053848863714,
                  latitude: -36.2274554367994,
                  accuracy: 4.6,
                  altitude: 99.5,
                  heading: 134.08,
                },
                battery: {
                  level: 0.5099999904632568,
                  is_charging: false,
                },
                timestamp: 13514141234134,
                network: 'wifi',
              },
            },
            {
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              id: expect.any(String),
              alertId: alert.id,
              geolocation: {
                coords: {
                  speed: 6.67,
                  longitude: -61.116053848863714,
                  latitude: -36.2274554367994,
                  accuracy: 4.6,
                  altitude: 99.5,
                  heading: 134.08,
                },
                battery: {
                  level: 0.5099999904632568,
                  is_charging: false,
                },
                timestamp: 13514141234134,
                network: 'wifi',
              },
            },
            {
              updatedAt: expect.any(String),
              createdAt: expect.any(String),
              id: expect.any(String),
              alertId: alert.id,
              geolocation: {
                coords: {
                  speed: 6.67,
                  longitude: -61.116053848863714,
                  latitude: -36.2274554367994,
                  accuracy: 4.6,
                  altitude: 99.5,
                  heading: 134.08,
                },
                battery: {
                  level: 0.5099999904632568,
                  is_charging: false,
                },
                timestamp: 13514141234134,
                network: 'wifi',
              },
            },
            {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              id: expect.any(String),
              alertId: alert.id,
              geolocation: {
                coords: {
                  speed: 6.67,
                  longitude: -61.116053848863714,
                  latitude: -36.2274554367994,
                  accuracy: 4.6,
                  altitude: 99.5,
                  heading: 134.08,
                },
                battery: {
                  level: 0.5099999904632568,
                  is_charging: false,
                },
                timestamp: 13514141234134,
                network: 'wifi',
              },
            },
            {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              id: expect.any(String),
              alertId: alert.id,
              geolocation: {
                battery: {
                  level: 0.49,
                  is_charging: false,
                },
                network: 'wifi',
                timestamp: new Date('2022-04-27T03:11:56.656Z').getTime(),
                coords: {
                  accuracy: 35,
                  altitude: 94.36762619018556,
                  altitudeAccuracy: 11.466069221496582,
                  heading: -1,
                  latitude: -36.2381446852903,
                  longitude: -61.113571765609045,
                  speed: -1,
                },
              },
            },
          ]);
          expect(res.body.pagination).toEqual({
            total: 5,
            take: 100,
            skip: 0,
            size: 5,
            hasMore: false,
          });
        });
    });
  });
});
