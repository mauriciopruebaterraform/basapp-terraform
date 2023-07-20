import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { Customer } from '@src/customers/entities/customer.entity';
import { CustomerType, ReservationMode, Role, User } from '@prisma/client';
import {
  createFinalUser,
  createFinalUserAndToken,
  createUserAndToken,
} from './utils/users';
import { cleanData } from './utils/clearData';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { errorCodes } from '@src/customers/authorized-users/authorized-users.constants';
import * as fs from 'fs';

describe('AuthorizedUserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let user: User;

  let customer: Customer;
  let customer2: Customer;
  let statesman: { user: User; token: string };
  let statesman2: { user: User; token: string };
  let reservationType;

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

    customer = await createCustomer(prisma, {
      name: 'harvard',
      type: CustomerType.business,
      active: true,
      district: 'San Fernando',
      secretKey: 'another-key',
      state: 'Buenos Aires',
      country: 'Argentina',
      countryCode: '54',
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
      secretKey: 'this-is-a-key',
      countryCode: '54',
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

    statesman2 = await createUserAndToken(prisma, {
      username: 'jamesCustomer2@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.statesman,
      active: true,
      customer: {
        connect: {
          id: customer2.id,
        },
      },
    });
    await createPermission(prisma, {
      action: 'list-authorized-users',
      name: 'listado de usuarios habilitados',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-authorized-user',
      name: 'crear de usuario habilitado',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'modify-authorized-user',
      name: 'actualiza usuario habilitado',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.authorizedUser.createMany({
      data: [
        {
          firstName: 'Fernando',
          lastName: 'Bello',
          username: '1150281459',
          lot: 'DS123456',
          description: null,
          sendEvents: true,
          active: false,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
        {
          firstName: 'Nerina',
          lastName: 'Capital',
          username: '1123199052',
          lot: '',
          description: null,
          sendEvents: true,
          customerId: customer.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
        {
          firstName: 'Gonzalo',
          lastName: 'Buszmicz',
          username: '3413077090',
          lot: null,
          description: null,
          sendEvents: false,
          customerId: customer2.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expireDate: null,
          updatedById: user.id,
          isOwner: true,
        },
      ],
    });
    reservationType = await prisma.reservationType.create({
      data: {
        code: 'Tenis',
        days: 0,
        display: 'day',
        groupCode: 'TE',
        numberOfPending: 2,
        customerId: customer.id,
        createdAt: new Date('2021-02-01 13:27:10'),
        updatedAt: new Date('2021-09-04 15:21:14'),
        minDays: 0,
        maxPerMonth: null,
        minDaysBetweenReservation: null,
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });
  // permission list-authorized-users
  it('/v1/customers/${customer}/authorized-users (statesman) with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .query({
        take: 20,
        skip: 0,
        where: JSON.stringify({
          active: true,
          firstName: {
            contains: 'Nerina',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            firstName: 'Nerina',
            lastName: 'Capital',
            username: '1123199052',
            lot: '',
            description: null,
            active: true,
            sendEvents: true,
            additionalLots: null,
            expireDate: null,
            isOwner: true,
            customerId: customer.id,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: expect.any(String),
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
    ['Fernando', 0],
    ['Nerina', 1],
  ])(
    '/v1/customers/${customer}/authorized-users (statesman) allows pagination (GET)',
    async (a, b) => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/authorized-users`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 1,
          skip: b,
          orderBy: JSON.stringify({
            firstName: 'asc',
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results[0]).toMatchObject({
            firstName: a,
            customerId: customer.id,
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: 2,
            take: 1,
            skip: b,
            size: 1,
            hasMore: b !== 1,
          });
        });
    },
  );
  // with list-authorized-users and list-reservations
  it('/v1/customers/${customer}/authorized-users (statesman) (GET)', async () => {
    await prisma.permission.create({
      data: {
        action: 'list-reservations',
        name: 'listado de reservas',
        category: 'list',
        statesman: true,
        monitoring: false,
      },
    });

    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: ReservationMode) => {
          expect(item).toHaveProperty('firstName');
          expect(item).toHaveProperty('lastName');
          expect(item).toHaveProperty('username');
          expect(item).toHaveProperty('lot');
          expect(item).toHaveProperty('description');
          expect(item).toHaveProperty('sendEvents');
          expect(item).toHaveProperty('customerId');
          expect(item).toHaveProperty('createdAt');
          expect(item).toHaveProperty('updatedAt');
          expect(item).toHaveProperty('expireDate');
          expect(item).toHaveProperty('updatedById');
          expect(item).toHaveProperty('isOwner');
          expect(item).toHaveProperty('additionalLots');
        });
        expect(res.body.pagination).toBeInstanceOf(Object);
        expect(res.body.pagination).toEqual({
          total: 2,
          take: 100,
          skip: 0,
          size: 2,
          hasMore: false,
        });
      });
  });

  it('/v1/customers/${customer}/authorized-users (GET) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer2?.id}/authorized-users`)
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

  it('/v1/customers/${customer}/authorized-users (POST)', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'mauricio',
        lastName: 'gallego',
        username: '123455234',
        lot: '2',
        description: 'jejejeje',
        sendEvents: true,
        isOwner: true,
        reservationTypes: [reservationType.id],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          firstName: 'mauricio',
          lastName: 'gallego',
          username: '123455234',
          lot: '2',
          description: 'jejejeje',
          sendEvents: true,
          isOwner: true,
          expireDate: null,
          active: true,
          additionalLots: null,
          id: expect.any(String),
          customerId: expect.any(String),
          createdAt: expect.any(String),
          updatedById: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [
            {
              id: expect.any(String),
              authorizedUserId: expect.any(String),
              reservationTypeId: expect.any(String),
            },
          ],
        });
      });
  });

  it('/v1/customers/${customer}/authorized-users (POST) additionalLost empty string', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'camilo',
        lastName: 'gallego',
        username: '1166487153',
        lot: '2',
        description: 'jejejeje',
        additionalLots: '',
        sendEvents: true,
        isOwner: true,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          firstName: 'camilo',
          lastName: 'gallego',
          username: '1166487153',
          lot: '2',
          description: 'jejejeje',
          sendEvents: true,
          isOwner: true,
          expireDate: null,
          active: true,
          additionalLots: null,
          id: expect.any(String),
          customerId: expect.any(String),
          createdAt: expect.any(String),
          updatedById: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [],
        });
      });
  });

  it('/v1/customers/${customer}/authorized-users (POST) 422 unprocessable entity', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'mauricio',
        lastName: 'gallego',
        username: 'mauriciogallego',
        lot: '2',
        description: 'jejejeje',
        sendEvents: true,
        isOwner: true,
        reservationTypes: ['cf349f67-dc3d-4585-8cda-b04d6966be41'],
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_RESERVATION_TYPE,
        });
      });
  });

  it('/v1/customers/${customer}/authorized-users (POST) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer2.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'mauricio',
        username: 'mauriciogallego',
        lastName: 'gallego',
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

  it('/v1/customers/${customer}/authorized-users (POST) 422 user existing with the same customer', async () => {
    return await request(app.getHttpServer())
      .post(`/v1/customers/${customer.id}/authorized-users`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'mauricio',
        username: '1150281459',
        lastName: 'gallego',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'USERNAME_EXISTENT',
        });
      });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH)', async () => {
    const data = {
      firstName: 'carlos',
      lastName: 'Buszmicz',
      lot: 'A22',
    };

    const reservationType = await prisma.reservationType.create({
      data: {
        code: 'Frisbee',
        days: 0,
        display: 'day',
        groupCode: 'TE',
        numberOfPending: 2,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        ...data,
        username: '3413077090',
        description: null,
        sendEvents: false,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });

    const finalUser = await createFinalUser(prisma, {
      ...data,
      username: '543413077090',
      authorizedUser: {
        connect: {
          id: authorizedUser.id,
        },
      },
    });

    await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/${authorizedUser.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'pipe',
        lastName: 'andres',
        lot: '33B',
        reservationTypes: [reservationType.id],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          firstName: 'pipe',
          lastName: 'andres',
          lot: '33B',
          username: '3413077090',
          description: null,
          sendEvents: false,
          customerId: customer.id,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [
            {
              reservationTypeId: expect.any(String),
              id: expect.any(String),
              authorizedUserId: expect.any(String),
            },
          ],
          expireDate: null,
          updatedById: expect.any(String),
          isOwner: true,
        });
      });

    const finalUserUpdated = await prisma.user.findUnique({
      where: {
        id: finalUser.id,
      },
    });

    expect(finalUserUpdated).toMatchObject({
      firstName: 'pipe',
      lastName: 'andres',
      lot: '33B',
    });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH) changing between users to verify change of lots in users', async () => {
    const data = {
      firstName: 'carlos',
      lastName: 'Buszmicz',
    };

    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        ...data,
        lot: 'A22',
        username: '1166433625',
        description: null,
        sendEvents: false,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });

    const { user: finalUser, token } = await createFinalUserAndToken(prisma, {
      ...data,
      fullName: 'carlos Buszmics',
      lot: 'A22',
      customer: {
        connect: {
          id: customer.id,
        },
      },
      username: '541166433625',
      authorizedUser: {
        connect: {
          id: authorizedUser.id,
        },
      },
    });

    const authorizedUser2 = await prisma.authorizedUser.create({
      data: {
        ...data,
        lot: 'B1',
        username: '1166433625',
        description: null,
        sendEvents: false,
        customerId: customer2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });

    //cambio la relacion de user con authorizeUser
    await request(app.getHttpServer())
      .patch(`/v1/users/${finalUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        secretKey: 'this-is-a-key',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          ...data,
          lot: authorizedUser2.lot,
        });
      });

    const userWithRightRelation = await prisma.user.findUnique({
      where: {
        id: finalUser.id,
      },
    });

    expect(userWithRightRelation).toMatchObject({
      authorizedUserId: authorizedUser2.id,
    });

    await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/${authorizedUser.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        lot: '33B',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          ...data,
          firstName: 'carlos',
          lastName: 'Buszmicz',
          lot: '33B',
          username: '1166433625',
          description: null,
          sendEvents: false,
          customerId: customer.id,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [],
          expireDate: null,
          updatedById: expect.any(String),
          isOwner: true,
        });
      });

    const finalUserUpdated = await prisma.user.findUnique({
      where: {
        id: finalUser.id,
      },
    });

    // debe tener exactamente lo mismo por que se cambio de cliente
    expect(finalUserUpdated).toMatchObject({
      ...data,
      lot: 'B1',
    });

    await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer2.id}/authorized-users/${authorizedUser2.id}`,
      )
      .set('Authorization', `Bearer ${statesman2.token}`)
      .send({
        lot: 'A44',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          ...data,
          firstName: 'carlos',
          lastName: 'Buszmicz',
          lot: 'A44',
          username: '1166433625',
          description: null,
          sendEvents: false,
          customerId: customer2.id,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [],
          expireDate: null,
          updatedById: expect.any(String),
          isOwner: true,
        });
      });

    const finalUserUpdatedWithAuthorizedUser = await prisma.user.findUnique({
      where: {
        id: finalUser.id,
      },
    });

    // debe haber cambiado el lote
    expect(finalUserUpdatedWithAuthorizedUser).toMatchObject({
      ...data,
      lot: 'A44',
    });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH) without user', async () => {
    const data = {
      firstName: 'mauricio',
      lastName: 'gallego',
      lot: 'A22',
    };

    const reservationType = await prisma.reservationType.create({
      data: {
        code: 'ultimate',
        days: 1,
        display: 'day',
        groupCode: 'TE',
        numberOfPending: 2,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      },
    });
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        ...data,
        username: '1166480625',
        description: null,
        sendEvents: false,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });

    await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/${authorizedUser.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'daniel',
        lastName: 'felipe',
        lot: '11A',
        reservationTypes: [reservationType.id],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          firstName: 'daniel',
          lastName: 'felipe',
          lot: '11A',
          username: '1166480625',
          description: null,
          sendEvents: false,
          customerId: customer.id,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          reservationTypes: [
            {
              reservationTypeId: expect.any(String),
              id: expect.any(String),
              authorizedUserId: expect.any(String),
            },
          ],
          expireDate: null,
          updatedById: expect.any(String),
          isOwner: true,
        });
      });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH) (authorized users not found)', async () => {
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/5f0a5804-2f92-4958-b14c-bbd1e260e919`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        firstName: 'pipe',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.AUTHORIZED_USER_NOT_FOUND,
        });
      });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH) (user existing with the same customer)', async () => {
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        firstName: 'carlos',
        lastName: 'Buszmicz',
        username: '1123445566',
        lot: null,
        description: null,
        sendEvents: false,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/${authorizedUser.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        username: '1150281459',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.USERNAME_EXISTENT,
        });
      });
  });

  it('/v1/customer/${customer}/authorized-users/${id} (PATCH) (reservation type not found)', async () => {
    const authorizedUser = await prisma.authorizedUser.create({
      data: {
        firstName: 'carlos',
        lastName: 'Buszmicz',
        username: '341307711090',
        lot: null,
        description: null,
        sendEvents: false,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedById: user.id,
        isOwner: true,
      },
    });
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer.id}/authorized-users/${authorizedUser.id}`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        reservationTypes: ['5f0a5804-2f92-4958-b14c-bbd1e260e919'],
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.INVALID_RESERVATION_TYPE,
        });
      });
  });

  it('should upload a csv file', async () => {
    //adding another authorized user with the same username but different customer
    await prisma.authorizedUser.create({
      data: {
        firstName: 'Maria',
        lastName: 'Gomez',
        username: '1144445555',
        lot: null,
        description: null,
        sendEvents: false,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expireDate: null,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        isOwner: true,
      },
    });
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/authorized-users.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'authorized-users.csv')
      .expect(201)
      .expect((res) => {
        expect(res.body).toStrictEqual({ count: 2 });
      });
  });

  it('should upload a csv file no repeat reservation type', async () => {
    const findAuthorizedUser = await prisma.authorizedUser.findFirst({
      where: {
        firstName: 'Maria',
        lastName: 'Gomez',
        username: '1144445555',
        customerId: customer.id,
      },
      include: {
        reservationTypes: true,
      },
    });
    if (!findAuthorizedUser) {
      throw new Error();
    }

    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/authorized-users.csv`),
    );

    await request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'authorized-users.csv')
      .field('reservationTypes', reservationType.id)
      .expect(201)
      .expect((res) => {
        expect(res.body).toStrictEqual({ count: 0 });
      });

    const wasUpdated = await prisma.authorizedUserReservationType.findFirst({
      where: {
        reservationTypeId: reservationType.id,
        authorizedUserId: findAuthorizedUser.id,
      },
      include: {
        reservationType: true,
      },
    });

    expect(wasUpdated).toBeNull();
  });

  it('should throw err uploading a csv file', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/authorized-users-empty.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'authorized-users-empty.csv')
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.EMPTY_FIELD_USERNAME,
        });
      });
  });

  it('should throw err uploading a file with different extension', async () => {
    const buffer = Buffer.from(fs.readFileSync(`${__dirname}/files/test.pdf`));

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
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

  it('should create only one user', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/authorized-users-username.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'authorized-users-username.csv')
      .expect(201)
      .expect((res) => {
        expect(res.body).toStrictEqual({ count: 1 });
      });
  });

  it('should throw err uploading a file with few fields', async () => {
    const buffer = Buffer.from(
      fs.readFileSync(`${__dirname}/files/icm-lots-empty.csv`),
    );

    return request(app.getHttpServer())
      .post(`/v1/customers/${customer?.id}/authorized-users/import`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .attach('file', buffer, 'icm-lots-empty.csv')
      .expect(422)
      .expect((res) => {
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.EMPTY_FIELDS,
        });
      });
  });
});
