import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Customer, Role, User } from '@prisma/client';
import { AlertState } from '@src/alert-states/entities/alert-states.entity';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { errorCodes as authErrorCodes } from '@src/alert-states/alert-states.constants';
import { FakeAlertState } from './fakes/alert-state.fake';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';

describe('AlertStateController (e2e)', () => {
  const alertStateData = new FakeAlertState().getMockFactory().plain().many(10);
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
  let user: User;

  let monitoring: { user: User; token: string };
  let statesman: { user: User; token: string };

  let customer: Customer;

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

    const result = await createUserAndToken(prisma, {
      username: 'new-customer@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.admin,
      active: true,
    });

    token = result.token;
    user = result.user;

    await prisma.alertState.createMany({
      data: alertStateData.map((alert) => ({
        ...alert,
      })),
    });
    customer = await createCustomer(prisma, {
      name: 'customer1',
      state: 'Capital Federal',
      district: 'Buenos Aires',
      country: 'Argentina',
      settings: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
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
          action: 'list-alert-states',
          name: 'Monitoreo de eventos',
          category: 'event',
          statesman: true,
          monitoring: false,
        },
        {
          id: '91603062-6c2a-4094-a642-3b32feaf0cc1',
          action: 'create-alert-state',
          name: 'Crear estados de alertas',
          category: 'alert',
          statesman: false,
          monitoring: true,
        },
        {
          id: '12303062-6c2a-4094-a642-3b32feaf0cc1',
          action: 'modify-alert-state',
          name: 'Crear estados de alertas',
          category: 'alert',
          statesman: true,
          monitoring: true,
        },
      ],
    });
    monitoring = await createUserAndToken(prisma, {
      username: 'monitoring@mail.com',
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

    statesman = await createUserAndToken(prisma, {
      username: 'new-user@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.statesman,
      active: true,
    });

    await prisma.alertState.create({
      data: {
        name: 'alert with customer',
        customerId: customer.id,
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/alert-states (GET)', () => {
    it('/v1/alert-states (GET) list admin', async () => {
      await request(app.getHttpServer())
        .get('/v1/alert-states')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: AlertState) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('customerId');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 11,
            take: 100,
            skip: 0,
            size: 11,
            hasMore: false,
          });
        });
    });

    it('/v1/alert-state (GET)', async () => {
      await request(app.getHttpServer())
        .get('/v1/alert-states')
        .set('Authorization', `Bearer ${monitoring.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });
    it('/v1/alert-states (GET) list stateman', async () => {
      await request(app.getHttpServer())
        .get('/v1/alert-states')
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: AlertState) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('customerId');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: alertStateData.length,
            take: 100,
            skip: 0,
            size: alertStateData.length,
            hasMore: false,
          });
        });
    });
  });

  describe('/v1/alert-states (POST)', () => {
    it('/v1/alert-state (POST)', async () => {
      await request(app.getHttpServer())
        .post('/v1/alert-states')
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });
    it('should create alert state', () => {
      return request(app.getHttpServer())
        .post('/v1/alert-states')
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'testing alert state',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            name: 'testing alert state',
            active: true,
            customerId: expect.any(String),
          });
        });
    });
  });

  describe('/v1/alert-states/${id} (PATCH)', () => {
    let newAlertState: AlertState;
    beforeAll(async () => {
      newAlertState = await prisma.alertState.create({
        data: {
          name: 'caution with the thief',
          customerId: customer.id,
        },
      });
    });

    it('/v1/alert-states update with admin user', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/alert-states/${newAlertState.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'caution with the thief modified',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: newAlertState.id,
            active: true,
            name: 'caution with the thief modified',
          });
        });
    });

    it('/v1/alert-states update with user allowed', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/alert-states/${newAlertState.id}`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'caution with the thief modified twice',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: newAlertState.id,
            active: true,
            name: 'caution with the thief modified twice',
          });
        });
    });

    it('/v1/alert-states not allowed', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/alert-states/${newAlertState.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          name: 'caution with the thief modified',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Unprocessable Entity',
            message: authErrorCodes.NOT_ALLOWED_TO_MODIFY,
          });
        });
    });

    it('/v1/alert-states alert not found', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/alert-states/12we3e-123wwa-123`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'did not change',
        })
        .expect(422);
    });
  });
});
