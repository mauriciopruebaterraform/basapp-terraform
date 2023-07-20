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

describe('HolidaysController (e2e)', () => {
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

  describe('/v1/customers/${customer}/holidays', () => {
    let customer: Customer;
    let statesman: { user: User; token: string };
    let finallyUser: { user: User; token: string };
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
        action: 'list-holidays',
        name: 'configura listado',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-holidays',
        name: 'creas locaciones',
        category: 'list',
        statesman: true,
        monitoring: true,
      });
      await createPermission(prisma, {
        action: 'modify-holidays',
        name: 'creas locaciones',
        category: 'list',
        statesman: true,
        monitoring: true,
      });
      await prisma.customerHolidays.createMany({
        data: [
          {
            date: new Date('01/01/2023'),
            customerId: customer.id,
          },
          {
            date: new Date('01/02/2023'),
            customerId: customer.id,
          },
          {
            date: new Date('01/03/2023'),
            customerId: customer.id,
          },
        ],
      });
    });

    it('/v1/customers/${customer}/holidays (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/holidays`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
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

    it('/v1/customers/${customer}/holidays (user)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/holidays`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventType) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
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

    it('/v1/customers/${customer}/holidays (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/holidays`)
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
    it('/v1/customers/${customer}/holidays (POST)', async () => {
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
        .post(`/v1/customers/${customer2?.id}/holidays`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          date: new Date('01/01/2023'),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            id: expect.any(String),
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
            date: new Date('01/01/2023').toISOString(),
            customerId: customer2?.id,
          });
        });
    });

    it('/v1/customers/${customer}/holidays (POST) 422 date exist', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/holidays`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          date: new Date('01/01/2023'),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'HOLIDAY_EXIST',
          });
        });
    });

    it('/v1/customers/${customer}/holidays (POST) 403 forbidden', async () => {
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
        .post(`/v1/customers/${customer2?.id}/holidays`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          date: new Date('01/01/2023'),
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

    it('/v1/customer/${customer}/holidays/${id} (PATCH)', async () => {
      const holidayCreated = await prisma.customerHolidays.create({
        data: {
          date: new Date('01/01/2023'),
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/holidays/${holidayCreated.id}`)
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
            date: new Date('01/01/2023').toISOString(),
            customerId: customer.id,
          });
        });
    });

    it('/v1/customers/${customer}/holidays/${id} (PATCH) (holidays not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/holidays/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
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
            message: 'HOLIDAY_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/holidays/${id} (patch) 422 date exist', async () => {
      const holiday = await prisma.customerHolidays.create({
        data: {
          date: new Date('07/02/2023'),
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
        .patch(`/v1/customers/${customer.id}/holidays/${holiday.id}`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          date: new Date('07/02/2023'),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: 'HOLIDAY_EXIST',
          });
        });
    });
  });
});
