import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';
import { Camera, CustomerType, Role, User } from '@prisma/client';

describe('CamerasController (e2e)', () => {
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

  describe('/v1/customers/${customer}/camera', () => {
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
        username: 'new-customer2123@mail.com',
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
        action: 'list-cameras',
        name: 'Configurar cliente',
        category: 'customer',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-camera',
        name: 'create camera',
        category: 'customer',
        statesman: true,
        monitoring: true,
      });
      await prisma.permission.create({
        data: {
          name: 'modify-camera',
          category: 'modify-camera',
          action: 'modify-camera',
          monitoring: true,
          statesman: true,
        },
      });
      await prisma.camera.createMany({
        data: [
          {
            description: 'test 1',
            code: 'test 1',
            updatedById: user.id,
            customerId: customer.id,
            geolocation: '',
          },
          {
            description: 'test 2',
            code: 'test 2',
            updatedById: user.id,
            customerId: customer.id,
            geolocation: '',
          },
          {
            description: 'test 3',
            code: 'test 3',
            customerId: customer.id,
            updatedById: user.id,
            geolocation: '',
          },
        ],
      });
    });
    // permission with list-cameras
    it('/v1/customers/${customer}/cameras (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/cameras`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Camera) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('url');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('geolocation');
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
    // permission with list-cameras and attend-alert
    it('/v1/customers/${customer}/cameras (statesman)', async () => {
      await prisma.permission.create({
        data: {
          action: 'attend-alert',
          name: 'atiende las alertas',
          category: 'list',
          statesman: true,
          monitoring: false,
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/cameras`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Camera) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('code');
            expect(item).toHaveProperty('url');
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('geolocation');
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
    it('/v1/customers/${customer}/cameras (GET) 403 forbidden', async () => {
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
        username: 'new-customer52222@gmail.com',
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
        .get(`/v1/customers/${customer2?.id}/cameras`)
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

    it('/v1/customers/${customer}/cameras (POST)', async () => {
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
        username: 'new-customer62f3@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/camera`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          description: 'test',
          geolocation: {
            lat: '32',
            lng: '54',
          },
          code: 'test code',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            url: null,
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            description: 'test',
            geolocation: {
              lat: '32',
              lng: '54',
            },
            code: 'test code',
          });
        });
    });

    it('/v1/customers/${customer}/camera (POST) 422 code exist', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/camera`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          geolocation: {
            lat: '32',
            lng: '54',
          },
          code: 'test 1',
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

    it('/v1/customers/${customer}/camera (POST) 403 forbidden', async () => {
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
        username: 'new-customer3s5@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/camera`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          geolocation: {
            lat: '32',
            lng: '54',
          },
          code: 'test code',
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

    it('/v1/customer/${customer}/camera/${id} (PATCH)', async () => {
      const camera = await prisma.camera.create({
        data: {
          description: 'test 12',
          geolocation: {
            lat: '10',
            lng: '12',
          },
          code: 'test 12',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/camera/${camera.id}`)
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
            updatedById: expect.any(String),
            customerId: expect.any(String),
          });
        });
    });

    it('/v1/customers/${customer}/camera/${id} (PATCH) (camera not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/camera/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
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
            message: 'CAMERA_NOT_FOUND',
          });
        });
    });

    it('/v1/customers/${customer}/camera (patch) 422 code exist', async () => {
      const camera = await prisma.camera.create({
        data: {
          description: 'test 13',
          geolocation: {
            lat: '10',
            lng: '12',
          },
          code: 'test 13',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'user13@gmail.com',
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
        .patch(`/v1/customers/${customer.id}/camera/${camera.id}`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          code: 'test 12',
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
