/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, User, Lot } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';
import { errorCodes } from '@src/customers/lots/lots.constants';
import { errorCodes as errorCodesAuth } from '@src/auth/auth.constants';
import * as fs from 'fs';

describe('lotsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };

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

    token = result.token;
    user = result.user;

    customer = await createCustomer(prisma, {
      name: 'divercity',
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
    customer2 = await createCustomer(prisma, {
      name: 'bogota',
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
      username: 'james@mail.com',
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
      action: 'list-lots',
      name: 'listado de lotes',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-lot',
      name: 'crear lotes',
      category: 'list',
      statesman: true,
      monitoring: true,
    });
    await createPermission(prisma, {
      action: 'modify-lot',
      name: 'modificar lotes',
      category: 'list',
      statesman: true,
      monitoring: true,
    });
    await prisma.lot.createMany({
      data: [
        {
          lot: 'House',
          latitude: '-34.407568',
          longitude: '-58.827965',
          updatedById: user.id,
          customerId: customer2.id,
        },
        {
          lot: '264',
          latitude: '-34.411019',
          longitude: '-58.829745',
          updatedById: user.id,
          customerId: customer.id,
        },
        {
          customerId: customer.id,
          lot: 'Golf House',
          latitude: '-34.406696',
          longitude: '-58.825858',
          updatedById: user.id,
        },
        {
          customerId: customer.id,
          lot: '266',
          latitude: '-34.410698',
          longitude: '-58.829257',
          updatedById: user.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  it('/v1/customers/${customer}/lots (statesman) with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/lots`)
      .query({
        take: 20,
        skip: 0,
        where: JSON.stringify({
          active: true,
          lot: {
            contains: 'House',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            lot: 'Golf House',
            isArea: false,
            latitude: '-34.406696',
            longitude: '-58.825858',
            active: true,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: user.id,
            customerId: customer.id,
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

  it.each([
    ['264', 0],
    ['266', 1],
    ['Golf House', 2],
  ])(
    '/v1/customers/${customer}/lots (statesman) allows pagination (GET)',
    async (a, b) => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/lots`)
        .query({
          take: 1,
          skip: b,
          orderBy: JSON.stringify({
            lot: 'asc',
          }),
          where: JSON.stringify({
            active: true,
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results[0]).toMatchObject({
            lot: a,
            customerId: customer.id,
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 3,
            take: 1,
            skip: b,
            size: 1,
            hasMore: b !== 2,
          });
        });
    },
  );

  it('/v1/customers/${customer}/lots (statesman) (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/lots`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: Lot) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('active');
          expect(item).toHaveProperty('isArea');
          expect(item).toHaveProperty('latitude');
          expect(item).toHaveProperty('longitude');
          expect(item).toHaveProperty('lot');
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

  it('/v1/customers/${customer}/lots (POST)', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'carlitosgomez@gmail.com',
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
      .post(`/v1/customers/${customer2?.id}/lots`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'Golf House',
        latitude: '-34.407568',
        longitude: '-58.827965',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          active: true,
          isArea: false,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          updatedById: userMonitoring.user.id,
          customerId: customer2?.id,
          lot: 'Golf House',
          latitude: '-34.407568',
          longitude: '-58.827965',
        });
      });
  });

  it('/v1/customers/${customer}/lots (POST) Unprocessable Entity lot existent', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'esteban@gmail.com',
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
      .post(`/v1/customers/${customer2?.id}/lots`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_DUPLICATED_LOT,
        });
      });
  });

  it('/v1/customers/${customer}/lots (POST) 403 forbidden', async () => {
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
      .post(`/v1/customers/${customer2?.id}/lots`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'House',
        latitude: '-34.407568',
        longitude: '-58.827965',
      })
      .expect(403)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 403,
          error: 'Forbidden',
          message: errorCodesAuth.AUTHORIZATION_REQUIRED,
        });
      });
  });

  it('/v1/customers/${customerId}/lots/${id} (PATCH) Unprocessable Entity lot existent', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'tulisco@gmail.com',
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

    const newLot = await prisma.lot.create({
      data: {
        lot: 'varsovia',
        latitude: '-34.406696',
        longitude: '-58.825858',
        updatedBy: {
          connect: {
            id: userMonitoring.user.id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    return await request(app.getHttpServer())
      .patch(`/v1/customers/${customer.id}/lots/${newLot.id}`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'Golf House',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_DUPLICATED_LOT,
        });
      });
  });

  it('/v1/customers/${customerId}/lots/${id} (PATCH)', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'mauriciogallego@gmail.com',
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

    const newLot = await prisma.lot.create({
      data: {
        lot: 'ibague',
        latitude: '-34.406696',
        longitude: '-58.825858',
        updatedBy: {
          connect: {
            id: userMonitoring.user.id,
          },
        },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    return await request(app.getHttpServer())
      .patch(`/v1/customers/${customer.id}/lots/${newLot.id}`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'Golf',
        longitude: '-28.825858',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          active: true,
          isArea: false,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          updatedById: userMonitoring.user.id,
          customerId: customer?.id,
          lot: 'Golf',
          longitude: '-28.825858',
          latitude: '-34.406696',
        });
      });
  });

  it('/v1/customers/${customerId}/lots/${id} (PATCH) 403 forbidden', async () => {
    const userMonitoring = await createUserAndToken(prisma, {
      username: 'juandiegogallego@gmail.com',
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
      .patch(`/v1/customers/${customer2?.id}/lots/1231nfgd-12-sdf-123`)
      .set('Authorization', `Bearer ${userMonitoring.token}`)
      .send({
        lot: 'ibague',
        latitude: '-34.406696',
        longitude: '-58.825858',
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

  it('should upload a csv file', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/upload-lots.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/lots/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'upload-lots.csv')
      .expect(201)
      .expect((res) => {
        expect(res.body).toStrictEqual({ count: 2 });
      });
  });

  it('should throw err uploading a csv file', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/empty-field.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/lots/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'empty-field.csv')
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
        });
      });
  });

  it('should throw err uploading a file with different extension', async () => {
    const buffer = Buffer.from(fs.readFileSync(`${__dirname}/files/test.pdf`));

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/lots/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'test.pdf')
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          message: errorCodes.INVALID_FILE_EXTENSION,
        });
      });
  });
});
