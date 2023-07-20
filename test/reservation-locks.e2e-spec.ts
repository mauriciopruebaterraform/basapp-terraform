import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import {
  CustomerType,
  Role,
  User,
  EventType,
  ReservationSpace,
  ReservationType,
} from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';

describe('ReservationLocksController (e2e)', () => {
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

  describe('/v1/customers/${customer}/reservation-locks', () => {
    let customer: Customer;
    let statesman: { user: User; token: string };
    let finallyUser: { user: User; token: string };
    let reservationType: ReservationType;
    let reservationSpace: ReservationSpace;

    beforeAll(async () => {
      customer = await createCustomer(prisma, {
        name: '123123123',
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
        username: 'new-otro@mail.com',
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
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      await createPermission(prisma, {
        action: 'list-reservation-locks',
        name: 'listado de espacios bloqueados',
        category: 'list',
        statesman: true,
        monitoring: false,
      });

      await createPermission(prisma, {
        action: 'create-reservation-locks',
        name: 'creas espacios bloqueados',
        category: 'list',
        statesman: true,
        monitoring: true,
      });

      await createPermission(prisma, {
        action: 'modify-reservation-locks',
        name: 'modifica espacios bloqueados',
        category: 'list',
        statesman: true,
        monitoring: true,
      });

      const eventType = await prisma.eventType.create({
        data: {
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
          customerId: customer.id,
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
      });

      reservationType = await prisma.reservationType.create({
        data: {
          code: 'Futbol',
          days: 1,
          display: 'day',
          groupCode: 'FU',
          numberOfPending: 0,
          createdAt: new Date('2021-02-01 13:27:28'),
          updatedAt: new Date('2021-02-01 13:27:28'),
          minDays: 0,
          maxPerMonth: null,
          minDaysBetweenReservation: null,
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });

      reservationSpace = await prisma.reservationSpace.create({
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
          reservationType: { connect: { id: reservationType.id } },
          eventType: { connect: { id: eventType.id } },
          customer: {
            connect: {
              id: customer.id,
            },
          },
        },
      });
      await prisma.reservationLock.createMany({
        data: [
          {
            date: new Date('01/01/2023'),
            customerId: customer.id,
            reservationSpaceId: reservationSpace.id,
            reservationTypeId: reservationType.id,
          },
          {
            date: new Date('08/12/2023'),
            customerId: customer.id,
            reservationSpaceId: reservationSpace.id,
            reservationTypeId: reservationType.id,
          },
          {
            date: new Date('25/12/2023'),
            customerId: customer.id,
            reservationSpaceId: reservationSpace.id,
            reservationTypeId: reservationType.id,
          },
        ],
      });
    });

    it('/v1/customers/${customer}/reservation-locks (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-locks`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('ignoreIfHoliday');
            expect(item).toHaveProperty('date');
            expect(item).toHaveProperty('sun');
            expect(item).toHaveProperty('mon');
            expect(item).toHaveProperty('tue');
            expect(item).toHaveProperty('wed');
            expect(item).toHaveProperty('thu');
            expect(item).toHaveProperty('fri');
            expect(item).toHaveProperty('sat');
            expect(item).toHaveProperty('holiday');
            expect(item).toHaveProperty('holidayEve');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('customerId');
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

    it('/v1/customers/${customer}/reservation-locks (user)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/reservation-locks`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('ignoreIfHoliday');
            expect(item).toHaveProperty('date');
            expect(item).toHaveProperty('sun');
            expect(item).toHaveProperty('mon');
            expect(item).toHaveProperty('tue');
            expect(item).toHaveProperty('wed');
            expect(item).toHaveProperty('thu');
            expect(item).toHaveProperty('fri');
            expect(item).toHaveProperty('sat');
            expect(item).toHaveProperty('holiday');
            expect(item).toHaveProperty('holidayEve');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('customerId');
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

    it('/v1/customers/${customer}/reservation-locks (GET) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: '12312312322',
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
        username: 'new-111@gmail.com',
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
        .get(`/v1/customers/${customer2?.id}/reservation-locks`)
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

    it('/v1/customers/${customer}/reservation-locks (POST)', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-locks`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          date: new Date('01/01/2023'),
          reservationSpaceId: reservationSpace.id,
          reservationTypeId: reservationType.id,
          mon: [
            { from: '11:00', to: '12:00' },
            { from: '12:00', to: '13:00' },
            { from: '13:00', to: '14:00' },
            { from: '14:00', to: '15:00' },
            { from: '15:00', to: '16:00' },
          ],
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            id: expect.any(String),
            fri: null,
            holiday: null,
            holidayEve: null,
            ignoreIfHoliday: false,
            mon: [
              { from: '11:00', to: '12:00' },
              { from: '12:00', to: '13:00' },
              { from: '13:00', to: '14:00' },
              { from: '14:00', to: '15:00' },
              { from: '15:00', to: '16:00' },
            ],
            name: null,
            sat: null,
            sun: null,
            thu: null,
            tue: null,
            wed: null,
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            date: new Date('01/01/2023').toISOString(),
            customerId: customer?.id,
            reservationSpaceId: reservationSpace.id,
            reservationTypeId: reservationType.id,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-locks (POST) 422 reservation type non-existent', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/reservation-locks`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          date: new Date('01/01/2023'),
          reservationSpaceId: reservationSpace.id,
          reservationTypeId: 'b18b7bce-f6dc-4163-96a7-a6b015d3f7dc',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'INVALID_RESERVATION_TYPE',
          });
        });
    });

    it('/v1/customers/${customer}/reservation-locks (POST) 422 reservation space non-existent', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer?.id}/reservation-locks`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          date: new Date('01/01/2023'),
          reservationSpaceId: 'b18b7bce-f6dc-4163-96a7-a6b015d3f7dc',
          reservationTypeId: reservationType.id,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'INVALID_RESERVATION_SPACE',
          });
        });
    });

    it('/v1/customer/${customer}/reservation-locks/${id} (PATCH)', async () => {
      const reservationLock = await prisma.reservationLock.create({
        data: {
          name: 'podar el pasto',
          date: new Date('05/07/2023'),
          reservationSpaceId: reservationSpace.id,
          reservationTypeId: reservationType.id,
          customerId: customer.id,
          tue: [
            { from: '11:00', to: '12:00' },
            { from: '12:00', to: '13:00' },
            { from: '13:00', to: '14:00' },
            { from: '14:00', to: '15:00' },
            { from: '15:00', to: '16:00' },
          ],
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-locks/${reservationLock.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          date: new Date('06/07/2023'),
          mon: [
            { from: '12:00', to: '13:00' },
            { from: '13:00', to: '14:00' },
            { from: '14:00', to: '15:00' },
            { from: '15:00', to: '16:00' },
          ],
          tue: null,
          active: false,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            name: 'podar el pasto',
            reservationSpaceId: reservationSpace.id,
            reservationTypeId: reservationType.id,
            active: false,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            date: new Date('06/07/2023').toISOString(),
            customerId: customer.id,
            mon: [
              { from: '12:00', to: '13:00' },
              { from: '13:00', to: '14:00' },
              { from: '14:00', to: '15:00' },
              { from: '15:00', to: '16:00' },
            ],
            sat: null,
            sun: null,
            thu: null,
            tue: null,
            wed: null,
            fri: null,
            holiday: null,
            holidayEve: null,
            ignoreIfHoliday: false,
          });
        });
    });

    it('/v1/customers/${customer}/reservation-locks/${id} (PATCH) (reservation lock not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-locks/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 404,
            error: 'Not Found',
            message: 'RESERVATION_LOCK_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/reservation-locks/${id} (patch) 422 date exist', async () => {
      const reservationLock = await prisma.reservationLock.create({
        data: {
          name: 'podar el pasto',
          date: new Date('05/07/2023'),
          reservationSpaceId: reservationSpace.id,
          reservationTypeId: reservationType.id,
          customerId: customer.id,
          mon: [
            { from: '11:00', to: '12:00' },
            { from: '12:00', to: '13:00' },
            { from: '13:00', to: '14:00' },
            { from: '14:00', to: '15:00' },
            { from: '15:00', to: '16:00' },
          ],
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-locks/${reservationLock.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          reservationTypeId: 'b18b7bce-f6dc-4163-96a7-a6b015d3f7dc',
          date: new Date('07/02/2023'),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'INVALID_RESERVATION_TYPE',
          });
        });
    });
    it('/v1/customers/${customer}/reservation-locks/${id} (patch) 422 date exist', async () => {
      const reservationLock = await prisma.reservationLock.create({
        data: {
          name: 'podar el pasto',
          date: new Date('05/07/2023'),
          reservationSpaceId: reservationSpace.id,
          reservationTypeId: reservationType.id,
          customerId: customer.id,
          fri: [
            { from: '11:00', to: '12:00' },
            { from: '12:00', to: '13:00' },
            { from: '13:00', to: '14:00' },
            { from: '14:00', to: '15:00' },
            { from: '15:00', to: '16:00' },
          ],
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/reservation-locks/${reservationLock.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          reservationSpaceId: 'b18b7bce-f6dc-4163-96a7-a6b015d3f7dc',
          date: new Date('07/02/2023'),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'INVALID_RESERVATION_SPACE',
          });
        });
    });
  });
});
