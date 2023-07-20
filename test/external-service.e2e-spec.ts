import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, ExternalService } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';
import { alertStates, alertTypes } from './fakes/alerts.fake';

describe('ExternalServiceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;

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
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${customer}/external-service', () => {
    let customer: Customer;
    let statesman: { user: User; token: string };
    beforeAll(async () => {
      customer = await createCustomer(prisma, {
        name: 'papa',
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
        ],
      });
      statesman = await createUserAndToken(prisma, {
        username: 'new-customer2@mail.com',
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

      await prisma.alertType.createMany({
        data: alertTypes,
      });

      await prisma.alertState.createMany({
        data: alertStates,
      });

      const alert = await prisma.alert.create({
        data: {
          alertState: {
            connect: {
              id: '85d18800-18e0-41e3-bf2f-4c624382fd3d',
            },
          },
          alertType: {
            connect: {
              id: '89caacde-8bf0-4ff0-b548-55f4ce7f3b46',
            },
          },
          geolocation: {
            coords: {
              speed: -1,
              heading: -1,
              accuracy: 5,
              altitude: 0,
              latitude: 37.785834,
              longitude: -122.406417,
              altitudeAccuracy: -1,
            },
            battery: { level: -1, is_charging: false },
            network: 'wifi',
            timestamp: 1673983952951.158,
          },
          geolocations: [
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250757.396,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250757.396,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
            {
              battery: { level: -1, is_charging: false },
              network: 'wifi',
              timestamp: 1670268250778.132,
              coords: {
                accuracy: 5,
                altitude: 0,
                altitudeAccuracy: -1,
                heading: -1,
                latitude: -36.232128,
                longitude: -61.128246,
                speed: -1,
              },
            },
          ],
          user: {
            connect: {
              id: statesman.user.id,
            },
          },
          originalGeolocation: {
            coords: {
              speed: -1,
              heading: -1,
              accuracy: 5,
              altitude: 0,
              latitude: 37.785834,
              longitude: -122.406417,
              altitudeAccuracy: -1,
            },
            battery: { level: -1, is_charging: false },
            network: 'wifi',
            timestamp: 1673983952951.158,
          },
          customer: {
            connect: {
              id: customer.id,
            },
          },
          dragged: true,
          manual: true,
        },
      });

      await prisma.externalService.createMany({
        data: [
          {
            alertId: alert.id,
            name: 'cyb',
          },
          {
            alertId: alert.id,
            name: 'maps',
          },
        ],
      });
    });

    it('/v1/customers/${customer}/external-service (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/external-service`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: ExternalService) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('attributes');
            expect(item).toHaveProperty('geolocation');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('type');
            expect(item).toHaveProperty('url');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('removed');
            expect(item).toHaveProperty('uniqueId');
            expect(item).toHaveProperty('alertId');
            expect(item).toHaveProperty('service');
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

    it('/v1/customers/${customer}/external-service (GET) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'lanus',
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
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'new-customer5@gmail.com',
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
        .get(`/v1/customers/${customer2?.id}/external-service`)
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
});
