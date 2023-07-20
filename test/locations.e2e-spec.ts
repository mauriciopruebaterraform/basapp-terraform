import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, EventType } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';

describe('LocationsController (e2e)', () => {
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

  describe('/v1/customers/${customer}/location', () => {
    let customer: Customer;
    let statesman: { user: User; token: string };
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
      await createPermission(prisma, {
        action: 'list-locations',
        name: 'configura listado',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-locations',
        name: 'creas locaciones',
        category: 'list',
        statesman: true,
        monitoring: true,
      });
      await createPermission(prisma, {
        action: 'modify-locations',
        name: 'creas locaciones',
        category: 'list',
        statesman: true,
        monitoring: true,
      });
      await prisma.location.createMany({
        data: [
          {
            name: 'testing',
            type: 'locality',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            name: 'testing 2',
            type: 'locality',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            customerId: customer.id,
            name: 'testing 3',
            type: 'locality',
            updatedById: user.id,
          },
        ],
      });
    });

    it('/v1/customers/${customer}/location (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/locations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('type');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('updatedById');
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
    it('/v1/customers/${customer}/location (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/locations`)
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
    it('/v1/customers/${customer}/locations (POST)', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'papa222',
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
        username: 'new-customegrf62f3@gmail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2?.id}/locations`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          name: 'test',
          type: 'neighborhood',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            id: expect.any(String),
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            name: 'test',
            type: 'neighborhood',
          });
        });
    });

    it('/v1/customers/${customer}/locations (POST) 422 name exist', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/locations`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          type: 'locality',
          name: 'testing',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'ER_DUP_ENTRY',
          });
        });
    });

    it('/v1/customers/${customer}/locations (POST) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'papa23',
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
        username: 'new-customer3es5@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/locations`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          type: 'locality',
          name: 'test code',
        })
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

    it('/v1/customer/${customer}/locations/${id} (PATCH)', async () => {
      const location = await prisma.location.create({
        data: {
          name: 'test 12',
          type: 'locality',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: false,
            id: expect.any(String),
            updatedById: statesman.user.id,
            customerId: customer.id,
          });
        });
    });

    it('/v1/customers/${customer}/locations/${id} (PATCH) (locations not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/locations/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
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
            message: 'LOCATION_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/location (patch) 422 name exist', async () => {
      const location = await prisma.location.create({
        data: {
          name: 'test 13',
          type: 'neighborhood',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'user1v3@gmail.com',
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
        .patch(`/v1/customers/${customer.id}/locations/${location.id}`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          name: 'test 12',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'ER_DUP_ENTRY',
          });
        });
    });
  });
});
