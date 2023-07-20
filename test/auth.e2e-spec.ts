import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '@src/database/prisma.service';
import { AuthModule } from '@src/auth/auth.module';
import { errorCodes } from '@src/users/users.constants';
import { AppModule } from '@src/app.module';
import { FakeCustomer } from './fakes/customer.fake';
import {
  createFinalUser,
  createMonitoringUserAndToken,
  createUser,
} from './utils/users';
import { Role } from '@prisma/client';
import { cleanData } from './utils/clearData';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { createCustomer } from './utils/customer';
import { omit } from 'lodash';

jest.mock('firebase-admin', () => {
  return {
    database: () => ({
      ref: () => ({
        child: () => ({
          push: () => null,
          set: async () => null,
        }),
      }),
    }),
    auth: () => ({
      createCustomToken: () => 'random.token.basapp',
    }),
  };
});

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  it('/v1/auth/login (POST)', async () => {
    await createUser(prisma, {
      username: 'test',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: true,
    });

    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'test', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(typeof res.body.access_token).toBe('string');
      });
  });

  it('/v1/auth/login (POST) (user with the same number in different clients', async () => {
    const admin = await createUser(prisma, {
      username: 'test',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: true,
    });

    const customer = await createCustomer(prisma, {
      updatedBy: {
        connect: {
          id: admin.id,
        },
      },
      name: 'ibague',
      district: 'tolima',
      state: 'tolima',
      type: 'business',
      country: 'colombia',
    });

    const customer2 = await createCustomer(prisma, {
      updatedBy: {
        connect: {
          id: admin.id,
        },
      },
      name: 'bolivar',
      type: 'government',
      district: 'provincia',
      state: 'colonia',
      country: 'argentina',
    });

    const G = await createUser(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'G',
      lastName: 'Z',
      fullName: 'G Z',
      role: 'user',
      active: true,
      customer: {
        connect: {
          id: customer2.id,
        },
      },
      customerType: 'government',
    });

    const B = await createUser(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'B',
      lastName: 'Y',
      fullName: 'B Y',
      role: 'user',
      active: true,
      customerType: 'business',
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    const { body: businessUser } = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        username: '541166480626',
        password: '123456',
        customerType: 'business',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/v1/users/user/me')
      .set('Authorization', `Bearer ${businessUser.access_token}`)
      .expect((res) => {
        expect(res.body).toStrictEqual({
          ...omit(B, ['password']),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          customer: {
            ...B.customer,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });
      });

    const { body: governmentUser } = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        username: '541166480626',
        password: '123456',
        customerType: 'government',
      })
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(typeof res.body.access_token).toBe('string');
      });

    await request(app.getHttpServer())
      .get('/v1/users/user/me')
      .set('Authorization', `Bearer ${governmentUser.access_token}`)
      .expect((res) => {
        expect(res.body).toStrictEqual({
          ...omit(G, ['password']),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          customer: {
            ...G.customer,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });
      });
  });

  it('/v1/auth/login (POST) test invalid username or password', async () => {
    await createUser(prisma, {
      username: 'test_invalid_pass',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: true,
    });
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'test_invalid_pass', password: '1234567' })
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 401,
          message: errorCodes.INVALID_USERNAME_PASSWORD,
        });
      });
  });

  it('/v1/auth/login (POST) test disabled user', async () => {
    await createUser(prisma, {
      username: 'test_inactive',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'admin',
      active: false,
    });
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'test_inactive', password: '123456' })
      .expect(403)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 403,
          message: errorCodes.NOT_ACTIVE_USER,
        });
      });
  });

  it('/v1/auth/login (POST) test disabled user', async () => {
    await createFinalUser(prisma, {
      active: false,
      password: '123456',
    });
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: '541166480626', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(typeof res.body.access_token).toBe('string');
      });
  });

  it('/v1/auth/login (POST) test disabled customer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parentId, image, updatedById, ...customer } = new FakeCustomer()
      .getMockFactory()
      .plain()
      .one();

    const user = await createUser(prisma, {
      username: 'customer_inactive',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: 'user',
      active: true,
    });

    await prisma.customer.create({
      data: {
        ...customer,
        name: 'test',
        active: false,
        secretKey: undefined,
        users: {
          connect: {
            id: user.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'customer_inactive', password: '123456' })
      .expect(403)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 403,
          message: errorCodes.NOT_ACTIVE_CUSTOMER,
        });
      });
  });

  it('/v1/auth/login (POST) test enabled customer', async () => {
    const user = await createUser(prisma, {
      username: 'customer_active',
      password: '123456',
      firstName: 'test',
      lastName: 'test',
      fullName: 'test test',
      role: Role.user,
      active: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parentId, image, updatedById, ...customer } = new FakeCustomer()
      .getMockFactory()
      .plain()
      .one();
    await prisma.customer.create({
      data: {
        ...customer,
        active: true,
        secretKey: undefined,
        users: {
          connect: {
            id: user.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'customer_active', password: '123456' })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/v1/auth/firebase (GET)', async () => {
    const monitoring = await createMonitoringUserAndToken(prisma, {
      username: 'monitoring',
      password: '123456',
      firstName: 'test',
      lastName: 'monitoring',
      fullName: 'monitoring test',
      role: Role.monitoring,
      active: true,
    });

    return request(app.getHttpServer())
      .get('/v1/auth/firebase')
      .set('Authorization', `Bearer ${monitoring.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.firebaseToken).toBeDefined();
        expect(typeof res.body.firebaseToken).toBe('string');
      });
  });
});
