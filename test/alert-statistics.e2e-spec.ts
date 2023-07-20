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
  alertStates,
  alertTypes,
  users,
  statesman as statesmanPrisma,
  customer as customerPrisma,
  customer2 as customer2Prisma,
} from './fakes/alerts.fake';
import { ExternalService } from '@src/common/services/external.service';
import { ExternalServiceMock } from '@src/common/services/mocks/external.service';

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

describe('AlertController (e2e) statistics', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let admin: { user: User; token: string };
  let statesman: { user: User; token: string };
  let customer: Customer;
  let customer2: Customer;
  const BUENOS_AIRES = 'ed7bcef1-eb11-4f09-91d8-17ff3cbd7a32';
  const MENDOZA = '3762661c-86bf-4a33-b392-ee538082a294';
  const BOSQUES_VARSOVIA = '2e150900-6c27-4f20-a73e-3cb9c1f7df55';
  const VERGEL = '5edd293a-bc5f-43ab-b210-901fcd81596c';
  const ATENDIDO = '879b2fde-938f-40b9-9f53-9b48255ed3a0';
  const EMITIDO = '85d18800-18e0-41e3-bf2f-4c624382fd3d';
  const INCENDIO = '89caacde-8bf0-4ff0-b548-55f4ce7f3b46';
  const MALA_COMPANIA = '51a5424b-3956-41ca-8b5d-d0a15dcd5195';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ExternalService)
      .useValue(ExternalServiceMock)
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
    await prisma.permission.create({
      data: {
        id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
        action: 'alert-statistics',
        name: 'Estadisticas de alertas',
        category: 'alerts',
        statesman: true,
        monitoring: true,
      },
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

    await prisma.location.createMany({
      data: [
        {
          id: BUENOS_AIRES,
          name: 'Buenos Aires',
          type: 'locality',
          createdAt: new Date('2020-09-18 19:50:30'),
          updatedById: admin.user.id,
          customerId: customer.id,
        },
        {
          id: MENDOZA,
          name: 'Mendoza',
          type: 'locality',
          createdAt: new Date('2020-09-18 19:50:30'),
          updatedById: admin.user.id,
          customerId: customer2.id,
        },
        {
          id: BOSQUES_VARSOVIA,
          name: 'Bosques de Varsovia',
          type: 'neighborhood',
          createdAt: new Date('2020-09-18 19:50:30'),
          updatedById: admin.user.id,
          customerId: customer.id,
        },
        {
          id: VERGEL,
          name: 'Vergel',
          type: 'neighborhood',
          createdAt: new Date('2020-09-18 19:50:30'),
          updatedById: admin.user.id,
          customerId: customer2.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/alerts/statistics (GET)', () => {
    it('/v1/alerts/statistics (GET) only to customer belonging to', async () => {
      await prisma.alert.createMany({
        data: [
          {
            alertTypeId: MALA_COMPANIA,
            alertStateId: EMITIDO,
            customerId: customer.id,
            neighborhoodId: BOSQUES_VARSOVIA,
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
          {
            alertTypeId: INCENDIO,
            alertStateId: ATENDIDO,
            customerId: customer.id,
            city: 'Buenos Aires',
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/alerts/statistics`)
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
                alertType: 'Mala compañía',
                count: 1,
                percentage: 50,
              },
              {
                alertType: 'Incendio',
                count: 1,
                percentage: 50,
              },
            ],
            totalByState: [
              {
                alertState: 'Emitida',
                count: 1,
                percentage: 50,
              },
              {
                alertState: 'Atendida',
                count: 1,
                percentage: 50,
              },
            ],
            totalByLocality: [
              {
                locality: 'Buenos Aires',
                count: 1,
                percentage: 50,
              },
              {
                locality: 'Otras',
                count: 1,
                percentage: 50,
              },
            ],
            totalByNeighborhood: [
              {
                neighborhood: 'Bosques de Varsovia',
                count: 1,
                percentage: 50,
              },
              {
                neighborhood: 'Otras',
                count: 1,
                percentage: 50,
              },
            ],
            total: 2,
          });
        });
    });
    it('/v1/alerts/statistics (GET) client to whom it belongs and their children', async () => {
      await prisma.alert.createMany({
        data: [
          {
            alertTypeId: MALA_COMPANIA,
            alertStateId: EMITIDO,
            customerId: customer2.id,
            neighborhoodId: VERGEL,
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
          {
            alertTypeId: MALA_COMPANIA,
            alertStateId: EMITIDO,
            customerId: customer2.id,
            city: 'Mendoza',
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/alerts/statistics`)
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
                alertType: 'Mala compañía',
                count: 3,
                percentage: (3 / 4) * 100,
              },
              {
                alertType: 'Incendio',
                count: 1,
                percentage: (1 / 4) * 100,
              },
            ],
            totalByState: [
              {
                alertState: 'Emitida',
                count: 3,
                percentage: (3 / 4) * 100,
              },
              {
                alertState: 'Atendida',
                count: 1,
                percentage: (1 / 4) * 100,
              },
            ],
            totalByLocality: [
              {
                locality: 'Buenos Aires',
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                locality: 'Mendoza',
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                locality: 'Otras',
                count: 2,
                percentage: 50,
              },
            ],
            totalByNeighborhood: [
              {
                neighborhood: 'Bosques de Varsovia',
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                neighborhood: 'Vergel',
                count: 1,
                percentage: (1 / 4) * 100,
              },
              {
                neighborhood: 'Otras',
                count: 2,
                percentage: 50,
              },
            ],
            total: 4,
          });
        });
    });
    it('/v1/alerts/statistics (GET) client to whom it belongs and their children. including "Otras"', async () => {
      await prisma.alert.createMany({
        data: [
          {
            alertTypeId: INCENDIO,
            alertStateId: ATENDIDO,
            customerId: customer2.id,
            city: 'Ibague',
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
          {
            alertTypeId: MALA_COMPANIA,
            alertStateId: EMITIDO,
            customerId: customer2.id,
            city: 'Bogota',
            userId: 'a4b43596-aa0b-4595-ae68-43bca7b39163',
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
          },
        ],
      });

      return await request(app.getHttpServer())
        .get(`/v1/alerts/statistics`)
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
                alertType: 'Mala compañía',
                count: 4,
                percentage: (4 * 100) / 6,
              },
              {
                alertType: 'Incendio',
                count: 2,
                percentage: (2 * 100) / 6,
              },
            ],
            totalByState: [
              {
                alertState: 'Emitida',
                count: 4,
                percentage: (4 * 100) / 6,
              },
              {
                alertState: 'Atendida',
                count: 2,
                percentage: (2 * 100) / 6,
              },
            ],
            totalByLocality: [
              {
                locality: 'Buenos Aires',
                count: 1,
                percentage: (1 * 100) / 6,
              },
              {
                locality: 'Mendoza',
                count: 1,
                percentage: (1 * 100) / 6,
              },
              {
                locality: 'Otras',
                count: 4,
                percentage: (4 * 100) / 6,
              },
            ],
            totalByNeighborhood: [
              {
                neighborhood: 'Bosques de Varsovia',
                count: 1,
                percentage: (1 * 100) / 6,
              },
              {
                neighborhood: 'Vergel',
                count: 1,
                percentage: (1 * 100) / 6,
              },
              {
                neighborhood: 'Otras',
                count: 4,
                percentage: (4 * 100) / 6,
              },
            ],
            total: 6,
          });
        });
    });
  });
});
