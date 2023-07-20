import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createFinalUserAndToken, createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';
import { Notification, CustomerType, Role, User } from '@prisma/client';
import { omit } from 'lodash';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customer: Customer;

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
      username: 'admin@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.admin,
      active: true,
    });

    user = result.user;

    customer = await createCustomer(prisma, {
      name: 'recoleta',
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
      settings: {
        create: {
          panicNotifications: '541166480626,54112311759',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers/${id}/notifications', () => {
    let customer2: Customer;
    let statesman: { user: User; token: string };
    let statesman2: { user: User; token: string };

    beforeAll(async () => {
      customer2 = await createCustomer(prisma, {
        name: 'varsovia',
        type: CustomerType.government,
        active: true,
        district: 'ibauge',
        state: 'tolima',
        country: 'colombia',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        parent: {
          connect: {
            id: customer.id,
          },
        },
      });
      statesman = await createUserAndToken(prisma, {
        username: 'andres@mail.com',
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
        username: 'andresFelipe@mail.com',
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
        action: 'list-notifications',
        name: 'listar notificacion',
        category: 'notifications',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-notification',
        name: 'crear notificacion',
        category: 'notifications',
        statesman: true,
        monitoring: false,
      });

      await prisma.location.createMany({
        data: [
          {
            id: '5673a126-ae72-4e7c-84e9-8d4a29d4c0db',
            name: 'ibague',
            type: 'locality',
            updatedById: user.id,
            customerId: customer2.id,
          },
          {
            id: '68c4ed72-fcf6-42c3-9875-e31ecb377482',
            name: 'tolima',
            type: 'neighborhood',
            updatedById: user.id,
            customerId: customer2.id,
          },
        ],
      });

      await prisma.user.createMany({
        data: [
          {
            username: '541166480626',
            firstName: 'carlos',
            password: '123456',
            lastName: 'alberto',
            fullName: 'carlos alberto',
            customerId: customer2.id,
            customerType: customer2.type,
            homeAddress: {
              neighborhoodId: '68c4ed72-fcf6-42c3-9875-e31ecb377482',
              apartment: '6',
              floor: 'B',
              fullAddress: {
                formatted_address: 'avenida belgrano 1657',
                number: '1657',
                street: 'avenida belgrano',
                city: 'Caba',
                district: 'Buenos Aires',
                state: 'Buenos Aires',
                country: 'Argentina',
                geolocation: {
                  lat: '54.123',
                  lng: '-54.12354',
                },
              },
            },
          },
          {
            username: '54112311759',
            firstName: 'mauricio',
            password: '123456',
            lastName: 'gallego',
            fullName: 'mauricio gallego',
            customerId: customer.id,
            customerType: customer.type,
            lot: '10',
          },
          {
            username: '54113608456',
            firstName: 'camilo',
            password: '123456',
            lastName: 'alfonso',
            fullName: 'camilo alfonso',
            customerId: customer2.id,
            customerType: customer2.type,
            homeAddress: {
              apartment: '6',
              floor: 'B',
              fullAddress: {
                formatted_address: 'avenida belgrano 1657',
                number: '1657',
                street: 'avenida belgrano',
                city: 'ibague',
                district: 'Buenos Aires',
                state: 'Buenos Aires',
                country: 'Argentina',
                geolocation: {
                  lat: '54.123',
                  lng: '-54.12354',
                },
              },
            },
          },
          {
            username: '54159782855',
            firstName: 'andrea',
            password: '123456',
            lastName: 'torres',
            fullName: 'andrea torres',
            lot: '30',
            customerId: customer.id,
            customerType: customer.type,
          },
          {
            username: '54478965445',
            firstName: 'sergio',
            password: '123456',
            lastName: 'toreto',
            fullName: 'sergio toreto',
            lot: '20',
            customerId: customer.id,
            customerType: customer.type,
          },
        ],
      });

      await prisma.notification.createMany({
        data: [
          {
            title: 'APERTURA DEL PUENTE',
            description:
              'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
            userId: statesman.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            authorizationRequestId: null,
            notificationType: 'massive',
          },
          {
            title: 'Prueba de funcionamiento del puente',
            description:
              'Informamos que se procederá a efectuar la prueba de funcionamiento del puente.',
            createdAt: new Date('2022-08-13 11:49:43'),
            userId: statesman.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            authorizationRequestId: null,
            notificationType: 'massive',
          },
          {
            title: 'Club House',
            description: `Les informamos que el Club  House estará cerrado por evento el Domingo a la noche y el Lunes al mediodía. El dia
            Martes el concesionario no brindará servicios durante toda la jornada.`,
            createdAt: new Date('2022-08-12 19:33:25'),
            userId: statesman.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            authorizationRequestId: null,
            notificationType: 'massive',
          },
          {
            title: 'recepción de paquetería',
            description:
              'Estimado/a vecino/a, le informamos que se recibió en guardia un paquete para su lote ',
            createdAt: new Date('2022-08-12 16:36:04'),
            userId: statesman2.user.id,
            customerId: customer2.id,
            image: 'null',
            emergency: false,
            fromLot: '007',
            toLot: '007',
            authorizationRequestId: null,
            notificationType: 'massive',
          },
        ],
      });
    });

    describe('/v1/customers/${id}/notifications (GET)', () => {
      it('/v1/customer/${id}/notifications (GET) (statesman)', async () => {
        return await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.results).toBeInstanceOf(Array);
            res.body.results.forEach((item: Notification) => {
              expect(item).toHaveProperty('id');
              expect(item).toHaveProperty('title');
              expect(item).toHaveProperty('description');
              expect(item).toHaveProperty('image');
              expect(item).toHaveProperty('userId');
              expect(item).toHaveProperty('customerId');
              expect(item).toHaveProperty('authorizationRequestId');
              expect(item).toHaveProperty('notificationType');
              expect(item).toHaveProperty('locationId');
              expect(item).toHaveProperty('createdAt');
              expect(item).toHaveProperty('sendAt');
              expect(item).toHaveProperty('fromLot');
              expect(item).toHaveProperty('toLot');
              expect(item).toHaveProperty('emergency');
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
      it('/v1/customer/${id}/notifications (GET) 403 forbidden', async () => {
        const userMonitoring = await createUserAndToken(prisma, {
          username: 'gallego@gmail.com',
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
          .get(`/v1/customers/${customer2?.id}/notifications`)
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

      it.each([
        ['APERTURA DEL PUENTE', 0],
        ['Club House', 1],
        ['Prueba de funcionamiento del puente', 2],
      ])(
        '/v1/customer/${id}/notifications (statesman) (GET) allows pagination',
        async (a, b) => {
          await request(app.getHttpServer())
            .get(`/v1/customers/${customer.id}/notifications`)
            .set('Authorization', `Bearer ${statesman.token}`)
            .query({
              take: 1,
              skip: b,
              orderBy: JSON.stringify({
                title: 'asc',
              }),
            })
            .expect(200)
            .expect((res) => {
              expect(res.body).toBeInstanceOf(Object);
              expect(res.body.results).toBeInstanceOf(Array);
              expect(res.body.results[0]).toMatchObject({
                title: a,
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
    });

    describe('/v1/customers/${id}/notifications (POST)', () => {
      it('/v1/customers/${id}/notifications (POST)', async () => {
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              trialPeriod: false,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              eventId: null,
              locationId: null,
              notificationType: 'massive',
              sendAt: expect.any(String),
              toLot: null,
              userId: statesman.user.id,
              alertId: null,
            });
          });
      });

      it('/v1/customers/${id}/notifications (POST) with location type neighborhood', async () => {
        const res = await request(app.getHttpServer())
          .post(`/v1/customers/${customer2?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman2.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            locationId: '68c4ed72-fcf6-42c3-9875-e31ecb377482',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer2.id,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              trialPeriod: false,
              locationId: '68c4ed72-fcf6-42c3-9875-e31ecb377482',
              notificationType: 'massive',
              sendAt: expect.any(String),
              eventId: null,
              toLot: null,
              userId: statesman2.user.id,
              alertId: null,
            });
          });

        const notificationUsers = await prisma.notificationUser.findMany({
          where: {
            notificationId: res.body.id,
          },
          include: {
            user: true,
          },
          orderBy: {
            user: {
              username: 'asc',
            },
          },
        });

        expect(notificationUsers.length).toBe(1);
        expect(notificationUsers).toMatchObject([
          {
            notificationId: res.body.id,
            user: {
              username: '541166480626',
            },
          },
        ]);
      });

      it('/v1/customers/${id}/notifications (POST) with location type locality', async () => {
        const res = await request(app.getHttpServer())
          .post(`/v1/customers/${customer2?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman2.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            locationId: '5673a126-ae72-4e7c-84e9-8d4a29d4c0db',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer2.id,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              locationId: '5673a126-ae72-4e7c-84e9-8d4a29d4c0db',
              notificationType: 'massive',
              eventId: null,
              sendAt: expect.any(String),
              toLot: null,
              trialPeriod: false,
              userId: statesman2.user.id,
              alertId: null,
            });
          });

        const notificationUsers = await prisma.notificationUser.findMany({
          where: {
            notificationId: res.body.id,
          },
          include: {
            user: true,
          },
          orderBy: {
            user: {
              username: 'asc',
            },
          },
        });

        expect(notificationUsers.length).toBe(1);
        expect(notificationUsers).toMatchObject([
          {
            notificationId: res.body.id,
            user: {
              username: '54113608456',
            },
          },
        ]);
      });

      it('/v1/customers/${id}/notifications (POST) with lots', async () => {
        const res = await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            fromLot: '10',
            toLot: '21',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta',
              fromLot: '10',
              toLot: '21',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergency: false,
              id: expect.any(String),
              locationId: null,
              trialPeriod: false,
              notificationType: 'massive',
              sendAt: expect.any(String),
              userId: statesman.user.id,
              eventId: null,
              alertId: null,
            });
          });

        const notificationUsers = await prisma.notificationUser.findMany({
          where: {
            notificationId: res.body.id,
          },
          include: {
            user: true,
          },
          orderBy: {
            user: {
              username: 'asc',
            },
          },
        });

        expect(notificationUsers.length).toBe(2);
        expect(notificationUsers).toMatchObject([
          {
            notificationId: res.body.id,
            user: {
              username: '54112311759',
            },
          },
          {
            notificationId: res.body.id,
            user: {
              username: '54478965445',
            },
          },
        ]);
      });

      it('/v1/customers/${id}/notifications (POST) with customers', async () => {
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta 2',
            description: 'muchos intrusos en el sector',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            additionalNotifications: [customer2.id],
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta 2',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [
                {
                  id: expect.any(String),
                  customerId: customer2.id,
                  customer: {
                    ...omit(customer2, [
                      'integrations',
                      'eventCategories',
                      'alertTypes',
                    ]),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                  },
                  notificationId: expect.any(String),
                },
              ],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              trialPeriod: false,
              locationId: null,
              notificationType: 'massive',
              sendAt: expect.any(String),
              toLot: null,
              eventId: null,
              userId: statesman.user.id,
              alertId: null,
            });
          });
      });

      it('/v1/customers/${id}/notifications (POST) (422) error with customers', async () => {
        const anotherCustomer = await createCustomer(prisma, {
          name: 'varsovia 3 ',
          type: CustomerType.business,
          active: true,
          district: 'ibauge',
          state: 'tolima',
          country: 'colombia',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        });
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            additionalNotifications: [anotherCustomer.id],
          })
          .expect(422)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              statusCode: 422,
              message: 'INVALID_CUSTOMER',
            });
          });
      });

      it('/v1/customers/${id}/notifications (POST) do not load location if type customer is business', async () => {
        const location = await prisma.location.create({
          data: {
            name: 'testing',
            type: 'locality',
            updatedById: user.id,
            customerId: customer2.id,
          },
        });
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta 3',
            description: 'muchos intrusos en el sector',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            locationId: location.id,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta 3',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              locationId: null,
              trialPeriod: false,
              eventId: null,
              notificationType: 'massive',
              sendAt: expect.any(String),
              toLot: null,
              userId: statesman.user.id,
              alertId: null,
            });
          });
      });

      it('/v1/customers/${id}/notifications (POST) do not load lots if type customer is government', async () => {
        const location = await prisma.location.create({
          data: {
            name: 'testing',
            type: 'locality',
            updatedById: user.id,
            customerId: customer2.id,
          },
        });
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer2?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman2.token}`)
          .send({
            title: 'alerta 3',
            description: 'muchos intrusos en el sector',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            locationId: location.id,
            fromLot: '11',
            toLot: '12',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'alerta 3',
              description: 'muchos intrusos en el sector',
              image: {
                name: 'image.png',
                url: 'http://image.png',
                thumbnailUrl: 'http://thumbnail.image.png',
              },
              additionalNotifications: [],
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer2.id,
              emergency: false,
              fromLot: null,
              id: expect.any(String),
              locationId: location.id,
              notificationType: 'massive',
              sendAt: expect.any(String),
              trialPeriod: false,
              eventId: null,
              toLot: null,
              userId: statesman2.user.id,
              alertId: null,
            });
          });
      });

      it('/v1/customers/${id}/notifications (POST) (422) error location not found', async () => {
        const location = await prisma.location.create({
          data: {
            name: 'testing',
            type: 'locality',
            updatedById: user.id,
            customerId: customer.id,
          },
        });
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer2?.id}/notifications`)
          .set('Authorization', `Bearer ${statesman2.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            locationId: location.id,
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(422)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              statusCode: 422,
              message: 'LOCATION_NOT_FOUND',
            });
          });
      });
    });

    describe('/v1/customers/${id}/notifications/send-message (POST)', () => {
      let monitoring;
      beforeAll(async () => {
        monitoring = await createUserAndToken(prisma, {
          username: 'andres-monitor@mail.com',
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

        await prisma.permission.update({
          data: {
            monitoring: true,
          },
          where: {
            action: 'create-notification',
          },
        });
      });
      it('/v1/customers/${id}/notifications/send-message (POST)', async () => {
        await prisma.user.createMany({
          data: [
            {
              customerId: customer.id,
              username: '541123117592',
              password: '123456',
              firstName: 'camilos',
              lastName: 'callao',
              fullName: 'camilos callao',
              lot: 'A6',
            },
            {
              customerId: customer.id,
              username: '5411664836233',
              password: '123456',
              firstName: 'camila',
              lastName: 'carlos',
              lot: 'A6',
              fullName: 'camila carlos',
            },
          ],
        });

        const res = await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications/send-message`)
          .set('Authorization', `Bearer ${monitoring.token}`)
          .send({
            lot: 'A6',
            description: 'muchos intrusos en el sector',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              title: 'Mensaje de la Guardia/Adm.',
              description: 'muchos intrusos en el sector',
              image: null,
              authorizationRequestId: null,
              createdAt: expect.any(String),
              customerId: customer.id,
              emergency: false,
              fromLot: 'A6',
              id: expect.any(String),
              eventId: null,
              locationId: null,
              trialPeriod: false,
              notificationType: 'monitoring',
              sendAt: expect.any(String),
              toLot: 'A6',
              userId: monitoring.user.id,
              alertId: null,
            });
          });

        const notificationUsers = await prisma.notificationUser.findMany({
          where: {
            notificationId: res.body.id,
          },
          include: {
            user: true,
          },
          orderBy: {
            user: {
              username: 'asc',
            },
          },
        });

        expect(notificationUsers.length).toBe(2);
        expect(notificationUsers).toMatchObject([
          {
            notificationId: res.body.id,
            user: {
              username: '541123117592',
            },
          },
          {
            notificationId: res.body.id,
            user: {
              username: '5411664836233',
            },
          },
        ]);
      });

      it('/v1/customers/${id}/notifications/send-message (POST) (USER_LOTS_NOT_FOUND)', async () => {
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications/send-message`)
          .set('Authorization', `Bearer ${monitoring.token}`)
          .send({
            lot: 'alerta',
            description: 'muchos intrusos en el sector',
          })
          .expect(422)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              statusCode: 422,
              error: 'Unprocessable Entity',
              message: 'USERS_LOT_NOT_FOUND',
            });
          });
      });

      it('/v1/customers/${id}/notifications/send-message (POST) (AUTHORIZATION_REQUIRED)', async () => {
        return await request(app.getHttpServer())
          .post(`/v1/customers/${customer?.id}/notifications/send-message`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .send({
            title: 'alerta',
            description: 'muchos intrusos en el sector',
            locationId: '68c4ed72-fcf6-42c3-9875-e31ecb377482',
            image: {
              name: 'image.png',
              url: 'http://image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          })
          .expect(403)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              statusCode: 403,
              error: 'Forbidden',
              message: 'AUTHORIZATION_REQUIRED',
            });
          });
      });
    });

    describe('v1/customers/${customer}/notifications/${id} (GET)', () => {
      it('/v1/customers/${customer}/notifications/${id} (statesman) (GET)', async () => {
        const notification = await prisma.notification.create({
          data: {
            title: 'APERTURA DEL PUENTE',
            description:
              'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
            createdAt: new Date('2022-08-13 16:25:37'),
            userId: statesman.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            authorizationRequestId: null,
            notificationType: 'massive',
            additionalNotifications: {
              create: {
                customer: {
                  connect: {
                    id: customer2.id,
                  },
                },
              },
            },
          },
        });
        return await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/notifications/${notification.id}`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            include: JSON.stringify({
              additionalNotifications: true,
            }),
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              id: expect.any(String),
              createdAt: expect.any(String),
              sendAt: expect.any(String),
              title: 'APERTURA DEL PUENTE',
              description:
                'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
              userId: statesman.user.id,
              trialPeriod: false,
              customerId: customer.id,
              emergency: false,
              fromLot: null,
              toLot: null,
              authorizationRequestId: null,
              notificationType: 'massive',
              image: null,
              alertId: null,
              eventId: null,
              locationId: null,
              additionalNotifications: [
                {
                  id: expect.any(String),
                  customerId: customer2.id,
                  notificationId: expect.any(String),
                },
              ],
            });
          });
      });

      it('/v1/customers/${customer}/notifications/${id} (GET) 403 forbidden', async () => {
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
          .get(
            `/v1/customers/${customer2?.id}/notifications/768c9482-bd38-480c-a213-48e97edfb2ac`,
          )
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

      it('/v1/customers/${customer}/notifications/${id} (GET) 403 not found', async () => {
        return await request(app.getHttpServer())
          .get(
            `/v1/customers/${customer?.id}/notifications/768c9482-bd38-480c-a213-48e97edfb2ac`,
          )
          .set('Authorization', `Bearer ${statesman.token}`)
          .expect(404)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toMatchObject({
              statusCode: 404,
              error: 'Not Found',
              message: 'NOTIFICATION_NOT_FOUND',
            });
          });
      });
    });

    describe('/v1/${customer}/notifications/${notificationUser}/read', () => {
      let finalUser;
      beforeAll(async () => {
        finalUser = await createFinalUserAndToken(prisma, {
          username: '541155482358',
          customer: {
            connect: {
              id: customer.id,
            },
          },
        });
      });

      it('/v1/${customer}/notifications/${notificationUser}/read (GET)', async () => {
        const notification = await prisma.notification.create({
          data: {
            title: 'APERTURA DEL PUENTE',
            description:
              'SE PROCEDERÁ CON LA APERTURA DEL PUENTE POR EGRESO DE EMBARCACIÓN',
            createdAt: new Date('2022-08-13 16:25:37'),
            userId: statesman.user.id,
            customerId: customer.id,
            emergency: false,
            fromLot: null,
            toLot: null,
            authorizationRequestId: null,
            notificationType: 'massive',
            additionalNotifications: {
              create: {
                customer: {
                  connect: {
                    id: customer2.id,
                  },
                },
              },
            },
            toUsers: {
              create: {
                userId: finalUser.user.id,
              },
            },
          },
          include: {
            toUsers: true,
          },
        });

        return await request(app.getHttpServer())
          .get(
            `/v1/customers/${customer.id}/notifications/${notification.toUsers[0].id}/read`,
          )
          .set('Authorization', `Bearer ${finalUser.token}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              id: expect.any(String),
              notificationId: notification.id,
              read: true,
            });
          });
      });
      it('/v1/${customer}/notifications/${notificationUser}/read (GET) notification-user not found', async () => {
        return await request(app.getHttpServer())
          .get(
            `/v1/customers/${customer.id}/notifications/75d7988c-2cbc-4a01-aeb1-a86b2804a05c/read`,
          )
          .set('Authorization', `Bearer ${finalUser.token}`)
          .expect(404)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              message: 'NOTIFICATION_NOT_FOUND',
              statusCode: 404,
            });
          });
      });
      it('/v1/${customer}/notifications/${notificationUser}/read (GET) customer not found', async () => {
        return await request(app.getHttpServer())
          .get(
            `/v1/customers/75d7988c-2cbc-4a01-aeb1-a86b2804a05c/notifications/75d7988c-2cbc-4a01-aeb1-a86b2804a05c/read`,
          )
          .set('Authorization', `Bearer ${finalUser.token}`)
          .expect(403)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toStrictEqual({
              error: 'Forbidden',
              message: 'AUTHORIZATION_REQUIRED',
              statusCode: 403,
            });
          });
      });
    });
  });

  describe('/v1/customers/${customer}/notifications/panic', () => {
    let monitoring: { user: User; token: string };
    beforeAll(async () => {
      monitoring = await createUserAndToken(prisma, {
        username: 'andrescamilo@mail.com',
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
    });
    it('/v1/customers/${customer}/notifications/panic', async () => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/notifications/panic`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            message: 'users notified',
          });
        });

      const notificationsCreated = await prisma.notificationUser.count({
        where: {
          notification: {
            description: {
              contains: 'Ha pulsado el botón de pánico el usuario',
            },
          },
          OR: [
            {
              user: {
                username: {
                  contains: '54112311759',
                },
              },
            },
            {
              user: {
                username: {
                  contains: '541166480626',
                },
              },
            },
          ],
        },
      });

      expect(notificationsCreated).toBe(1);
    });

    it('/v1/customers/${customer}/notifications/panic without customer', async () => {
      const monitoring2 = await createUserAndToken(prisma, {
        username: 'andrescamilogallego@mail.com',
        password: '123456',
        firstName: 'New',
        lastName: 'Customer',
        fullName: 'New Customer',
        role: Role.monitoring,
        active: true,
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/notifications/panic`)
        .set('Authorization', `Bearer ${monitoring2.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Forbidden',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 403,
          });
        });
    });

    it('/v1/customers/${customer}/notifications/panic without user', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/notifications/panic`)
        .expect(401)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unauthorized',
            message: 'AUTHORIZATION_REQUIRED',
            statusCode: 401,
          });
        });
    });
  });
});
