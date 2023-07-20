import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, Protocol } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';

describe('ProtocolsController (e2e)', () => {
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

  describe('/v1/customers/${customer}/protocols', () => {
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
        username: 'new-otro-mas@mail.com',
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
        action: 'list-protocols',
        name: 'configura protocolo',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-protocol',
        name: 'configura protocolo',
        category: 'list',
        statesman: true,
        monitoring: true,
      });
      await createPermission(prisma, {
        action: 'modify-protocol',
        name: 'Modificar protocolos',
        category: 'protocol',
        statesman: true,
        monitoring: true,
      });
      await prisma.protocol.createMany({
        data: [
          {
            title: 'testing',
            code: 'testing',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            title: 'testing 2',
            code: 'testing 2',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            customerId: customer.id,
            title: 'testing 3',
            code: 'testing 3',
            updatedById: user.id,
          },
        ],
      });
    });

    it('/v1/customers/${customer}/protocols (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/protocols`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Protocol) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('code');
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
    it('/v1/customers/${customer}/protocols (GET) 403 forbidden', async () => {
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
        .get(`/v1/customers/${customer2?.id}/protocols`)
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
    it('/v1/customers/${customer}/protocols (POST)', async () => {
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
        username: 'new-customegerf62f3@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/protocols`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test 1',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            attachment: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            title: 'test',
            code: 'test 1',
          });
        });
    });

    it('/v1/customers/${customer}/protocols (POST) attachment', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'balvanera',
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
        username: 'new-custome2f3@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/protocols`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'test',
          code: 'test 1',
          attachment: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            active: true,
            id: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            title: 'test',
            code: 'test 1',
            attachment: {
              url: 'http://image.png',
              name: 'image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          });
        });
    });
    it('/v1/customers/${customer}/protocols (POST) 403 forbidden', async () => {
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
        username: 'news-customer3es5@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/protocols`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'locality',
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

    it('/v1/customers/${customer}/protocols/${id} (PATCH)', async () => {
      const protocol = await prisma.protocol.create({
        data: {
          title: 'test 12',
          code: 'locality',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/protocols/${protocol.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          active: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: false,
            attachment: null,
            id: expect.any(String),
            updatedById: statesman.user.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            title: 'test 12',
            code: 'locality',
          });
        });
    });

    it('/v1/customers/${customer}/protocols/${id} (PATCH) add attachment', async () => {
      const protocol = await prisma.protocol.create({
        data: {
          title: 'test 112',
          code: 'locality',
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/protocols/${protocol.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          attachment: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            id: expect.any(String),
            updatedById: statesman.user.id,
            customerId: customer.id,
            title: 'test 112',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            code: 'locality',
            attachment: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          });
        });
    });

    it('/v1/customers/${customer}/protocols/${id} (PATCH) null attachment', async () => {
      const protocol = await prisma.protocol.create({
        data: {
          title: 'test 112',
          code: 'locality',
          updatedById: user.id,
          customerId: customer.id,
          attachment: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
        },
      });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/protocols/${protocol.id}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          attachment: null,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(String),
            updatedById: statesman.user.id,
            customerId: customer.id,
            title: 'test 112',
            code: 'locality',
            attachment: null,
          });
        });
    });

    it('/v1/customers/${customer}/protocols/${id} (PATCH) (protocols not found)', async () => {
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/protocols/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
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
            message: 'PROTOCOL_NOT_FOUND',
          });
        });
    });
  });
});
