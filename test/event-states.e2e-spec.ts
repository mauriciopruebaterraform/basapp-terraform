import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Customer, EventState, Role, User } from '@prisma/client';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { createCustomer } from './utils/customer';
import { cleanData } from './utils/clearData';

describe('EventStatesController (e2e)', () => {
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

    await prisma.permission.createMany({
      data: [
        {
          id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
          action: 'create-event-state',
          name: 'Monitoreo de eventos',
          category: 'event',
          statesman: true,
          monitoring: true,
        },
        {
          id: 'd85dada8-26d1-453b-8e9b-123123123',
          action: 'modify-event-state',
          name: 'Monitoreo de eventos',
          category: 'event',
          statesman: true,
          monitoring: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/event-states (GET)', () => {
    beforeAll(async () => {
      await prisma.eventState.createMany({
        data: [
          {
            name: 'test 1',
          },
          {
            name: 'test 2',
            customerId: monitoring.user.customerId,
          },
          {
            name: 'test 3',
            customerId: statesman.user.customerId,
          },
        ],
      });
    });
    it('/v1/event-states (GET) list statesman', async () => {
      await request(app.getHttpServer())
        .get('/v1/event-states')
        .set('Authorization', `Bearer ${monitoring.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventState) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
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
    it('/v1/event-states (GET) admin', async () => {
      await request(app.getHttpServer())
        .get('/v1/event-states')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventState) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
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
  });

  describe('/v1/event-states (POST)', () => {
    it('create with statesman', async () => {
      await request(app.getHttpServer())
        .post('/v1/event-states')
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'pepito',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: expect.any(String),
            name: 'pepito',
            customerId: monitoring.user.customerId,
            active: true,
          });
        });
    });

    it('should reject with admin user', async () => {
      await request(app.getHttpServer())
        .post('/v1/event-states')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'pepito',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toMatchObject({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });
  });

  describe('/v1/event-states (PATH)', () => {
    it('/v1/event-states (PATH)', async () => {
      const state = await prisma.eventState.create({
        data: {
          name: 'pepito',
          customerId: monitoring.user.customerId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/v1/event-states/${state.id}`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'pepito 2',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            ...state,
            name: 'pepito 2',
          });
        });
    });

    it('/v1/event-states (PATH) event does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/event-states/dsfsdfsdfsdfsdfsdfsdfsdf`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'pepito 2',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            message: 'EVENT_STATE_NOT_FOUND',
            statusCode: 404,
            error: 'Not Found',
          });
        });
    });

    it('/v1/event-states (PATH) event does not permit to modify', async () => {
      const event = await prisma.eventState.create({
        data: {
          name: 'test',
        },
      });
      await request(app.getHttpServer())
        .patch(`/v1/event-states/${event.id}`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          name: 'pepito 2',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toMatchObject({
            message: 'NOT_ALLOWED_TO_MODIFY',
            statusCode: 403,
            error: 'Forbidden',
          });
        });
    });
  });
});
