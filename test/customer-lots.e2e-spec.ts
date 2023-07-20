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
import { cleanData } from './utils/clearData';
import * as fs from 'fs';

describe('CustomerLotsController (e2e)', () => {
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

    await prisma.customerLot.createMany({
      data: [
        {
          lot: 'House',
          icmLot: 'AL000003',
          icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
          customerId: customer2.id,
        },
        {
          lot: '264',
          icmLot: 'AL000002',
          icmUid: '5111C2E9-07AC-410B-AB3C-914DDD823E29',
          customerId: customer.id,
        },
        {
          customerId: customer.id,
          lot: 'Golf House',
          icmLot: 'AL000001',
          icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
        },
        {
          customerId: customer.id,
          lot: '266',
          icmLot: 'AL000000',
          icmUid: '69ADAFCE-E6CB-480E-A8A8-AA40775DEC2F',
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  it('/v1/customers/icm-lots with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${token}`)
      .query({
        take: 20,
        skip: 0,
        where: JSON.stringify({
          icmLot: {
            contains: 'AL000003',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            lot: 'House',
            icmLot: 'AL000003',
            icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
            customerId: customer2.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
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
    ['House', 3],
  ])('/v1/customer/icm-lots allows pagination (GET)', async (a, b) => {
    await request(app.getHttpServer())
      .get(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${token}`)
      .query({
        take: 1,
        skip: b,
        orderBy: JSON.stringify({
          lot: 'asc',
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results[0]).toMatchObject({
          lot: a,
        });
        expect(res.body.pagination).toBeInstanceOf(Object);
        expect(res.body.pagination).toEqual({
          total: 4,
          take: 1,
          skip: b,
          size: 1,
          hasMore: b !== 3,
        });
      });
  });

  it('/v1/customer/icm-lots (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: Lot) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('lot');
          expect(item).toHaveProperty('icmLot');
          expect(item).toHaveProperty('icmUid');
          expect(item).toHaveProperty('customerId');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
        });
        expect(res.body.pagination).toBeInstanceOf(Object);
        expect(res.body.pagination).toEqual({
          total: 4,
          take: 100,
          skip: 0,
          size: 4,
          hasMore: false,
        });
      });
  });

  it('/v1/customers/icm-lots (GET) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${statesman.token}`)
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

  it('/v1/customers/icm-lots (POST)', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer2?.id,
        lot: 'House2',
        icmLot: 'AL000005',
        icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          lot: 'House2',
          icmLot: 'AL000005',
          icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
          customerId: customer2?.id,
        });
      });
  });

  it('/v1/customers/icm-lots (POST) (INVALID CUSTOMER)', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
        lot: 'House2',
        icmLot: 'AL000005',
        icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'INVALID_CUSTOMER',
        });
      });
  });

  it('/v1/customers/${customer}/camera (POST) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/icm-lots`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        customerId: customer2?.id,
        lot: 'House2',
        icmLot: 'AL000005',
        icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
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

  it('/v1/customers/icm-lots (PATCH)', async () => {
    const lotExistent = await prisma.customerLot.create({
      data: {
        lot: 'casa de los altos',
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      },
    });
    return await request(app.getHttpServer())
      .patch(`/v1/customers/icm-lots/${lotExistent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer?.id,
        lot: 'casa de los altos actualizado',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          lot: 'casa de los altos actualizado',
          icmLot: null,
          icmUid: null,
          customerId: customer?.id,
        });
      });
  });

  it('/v1/customers/${customer}/camera (PATCH) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .patch(`/v1/customers/icm-lots/32575744-63BC-45B5-81F1-FFB80EF98FA5`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        customerId: customer2?.id,
        lot: 'House2',
        icmLot: 'AL000005',
        icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
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

  it('/v1/customers/${customer}/camera (PATCH) 422 customer lot not found', async () => {
    return await request(app.getHttpServer())
      .patch(`/v1/customers/icm-lots/32575744-63BC-45B5-81F1-FFB80EF98FA5`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer2?.id,
        lot: 'House2',
        icmLot: 'AL000005',
        icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
      })
      .expect(404)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 404,
          error: 'Not Found',
          message: 'CUSTOMER_LOT_NOT_FOUND',
        });
      });
  });

  it('/v1/customers/icm-lots (PATCH)', async () => {
    const lotExistent = await prisma.customerLot.create({
      data: {
        lot: 'casa de los altos 2',
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      },
    });
    return await request(app.getHttpServer())
      .patch(`/v1/customers/icm-lots/${lotExistent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
        lot: 'casa de los altos actualizado',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'INVALID_CUSTOMER',
        });
      });
  });

  it('should upload a csv file', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/icm-lots.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/icm-lots/import`)
      .set('Authorization', `Bearer ${token}`)
      .field('customerId', customer.id)
      .attach('file', buffer, 'icm-lots.csv')
      .expect(201)
      .expect((res) => {
        expect(res.body).toStrictEqual({ count: 2 });
      });
  });

  it('should throw err uploading a csv file', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/icm-lots-empty.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/icm-lots/import`)
      .set('Authorization', `Bearer ${token}`)
      .field('customerId', customer.id)
      .attach('file', buffer, 'icm-lots-empty.csv')
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
      .post(`/v1/customers/icm-lots/import`)
      .set('Authorization', `Bearer ${token}`)
      .field('customerId', customer.id)
      .attach('file', buffer, 'test.pdf')
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          message: 'INVALID_FILE_EXTENSION',
        });
      });
  });

  it('should throw err uploading a csv file with invalid customer', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/icm-lots.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/icm-lots/import`)
      .set('Authorization', `Bearer ${token}`)
      .field('customerId', '32575744-63BC-45B5-81F1-FFB80EF98FA5')
      .attach('file', buffer, 'icm-lots.csv')
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'INVALID_CUSTOMER',
        });
      });
  });
});
