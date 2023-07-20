/* eslint-disable @typescript-eslint/no-unused-vars */
import { CustomerIntegrationsDto } from './../src/customers/dto/customer-integrations.dto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { FakeCustomer } from './fakes/customer.fake';
import {
  CustomerType,
  Customer as CustomerPrisma,
  Prisma,
  Role,
  User,
  EventCategory,
} from '@prisma/client';
import {
  createFinalUserAndToken,
  createMonitoringUser,
  createUser,
  createUserAndToken,
} from './utils/users';
import { CreateCustomerDto } from '@src/customers/dto/create-customer.dto';
import { errorCodes } from '@src/customers/customers.constants';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { Customer } from '@src/customers/entities/customer.entity';
import { UpdateCustomerDto } from '@src/customers/dto/update-customer.dto';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';

describe('CustomersController (e2e)', () => {
  const customerData = new FakeCustomer().getMockFactory().plain().many(10);
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .compile();

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

    await prisma.customer.createMany({
      data: customerData.map((customer) => ({
        ...customer,
        image: undefined,
        updatedById: user.id,
      })),
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/customers (GET)', () => {
    it('/v1/customers (GET) customer list', async () => {
      return await request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Customer) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('type');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('district');
            expect(item).toHaveProperty('state');
            expect(item).toHaveProperty('country');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: customerData.length,
            take: 100,
            skip: 0,
            size: customerData.length,
            hasMore: false,
          });
        });
    });

    it('/v1/customers (GET) customer list stateman and monitoring', async () => {
      const father = await createCustomer(prisma, {
        name: 'papa',
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
      await createCustomer(prisma, {
        name: 'hijo',
        type: CustomerType.business,
        active: true,
        district: 'San Fernando',
        state: 'Buenos Aires',
        country: 'Argentina',
        parent: {
          connect: {
            id: father.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      });
      const result = await createUserAndToken(prisma, {
        username: 'new-user@mail.com',
        password: '123456',
        firstName: 'jejes',
        lastName: 'otro nombre',
        fullName: 'nombre',
        role: Role.statesman,
        active: true,
        customer: {
          connect: {
            id: father.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${result.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: Customer) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('type');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('active');
            expect(item).toHaveProperty('createdAt');
            expect(item).toHaveProperty('updatedAt');
            expect(item).toHaveProperty('district');
            expect(item).toHaveProperty('state');
            expect(item).toHaveProperty('country');
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
  });

  describe('/v1/customers (POST)', () => {
    it('/v1/customers (POST)', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });
      const eventCategories = await prisma.eventCategory.create({
        data: {
          title: 'Violación de perímetro',
        },
      });
      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData: CreateCustomerDto = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: 'werqwd1',
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        alertTypes: [alertData.id],
        eventCategories: [eventCategories.id],
        isClient: true,
        integrations: {
          giroVisionId: '123456789',
        },
        sections: {
          alerts: false,
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            type: 'business',
            name: expect.any(String),
            active: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            district: expect.any(String),
            state: expect.any(String),
            country: expect.any(String),
            secretKey: 'werqwd1',
            trialPeriod: expect.any(Boolean),
            countryCode: expect.any(String),
            verifyBySms: false,
            phoneLength: expect.any(Number),
            url: expect.any(String),
            speed: expect.any(String),
            notes: expect.any(String),
            timezone: expect.any(String),
            image: {
              url: 'http://image.png',
              name: 'image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            isClient: true,
            parentId: null,
            updatedById: expect.any(String),
            sections: {
              id: expect.any(String),
              alerts: false,
              events: true,
              customerId: expect.any(String),
              notifications: true,
              reservations: true,
              protocols: true,
              usefulInformation: true,
              integrations: true,
              lots: true,
              cameras: true,
              locations: true,
            },
            integrations: {
              id: expect.any(String),
              customerId: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              updatedById: user.id,
              traccarUsername: null,
              cybermapaPassword: null,
              cybermapaUrl: null,
              cybermapaUsername: null,
              traccarPassword: null,
              traccarUrl: null,
              icmUrl: null,
              icmToken: null,
              giroVisionId: '123456789',
              neighborhoodAlarm: null,
              neighborhoodAlarmLink: null,
              neighborhoodAlarmKey: null,
            },
            settings: {
              id: expect.any(String),
              additionalNotifications: null,
              alarmActivatedNumbers: null,
              badCompanyNumbers: null,
              createdAt: expect.any(String),
              customerId: expect.any(String),
              daysToShow: null,
              fire: null,
              doubleConfirmMessage: null,
              doubleConfirmRequired: false,
              fireNumbers: null,
              genderViolenceNumbers: null,
              healthEmergency: null,
              healthEmergencyNumbers: null,
              kidnappingNumbers: null,
              maxAccuracy: null,
              minAccuracy: null,
              panicKey: null,
              panicNotifications: null,
              panicNumbers: null,
              perimeterViolationNumbers: null,
              publicViolence: null,
              publicViolenceNumbers: null,
              receiveAlertsFromOutside: false,
              reservationEmail: null,
              robbery: null,
              robberyNumbers: null,
              securityChief: null,
              securityGuard: null,
              updatedAt: expect.any(String),
              updatedById: user.id,
              validateUsers: false,
            },
            alertTypes: [
              {
                customerId: expect.any(String),
                alertTypeId: expect.any(String),
                order: 0,
                alertType: expect.any(Object),
              },
            ],
            eventCategories: [
              {
                id: expect.any(String),
                active: expect.any(Boolean),
                categoryId: expect.any(String),
                customerId: expect.any(String),
                reservationTypeId: null,
                order: null,
                updatedById: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                category: {
                  id: expect.any(String),
                  title: expect.any(String),
                  active: expect.any(Boolean),
                  image: null,
                },
              },
            ],
          });
        });
    });

    it('/v1/customers (POST) with parent customer', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });

      const { parentId } = await prisma.customer.create({
        data: {
          name: 'Parent Customer',
          type: CustomerType.business,
          active: true,
          district: 'district',
          state: 'state',
          country: 'country',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();
      const customerData: CreateCustomerDto = {
        ...customer,
        alertTypes: [alertData.id],
        type: CustomerType.business,
        eventCategories: [],
        active: true,
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        isClient: false,
        parent: parentId,
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            parentId: parentId,
          });
        });
    });

    it('/v1/customers (POST) should fail if user does not have an admin role', async () => {
      const { token } = await createUserAndToken(prisma, {
        username: 'no-admin@email.com',
        password: '123456',
        firstName: 'No',
        lastName: 'Admin',
        fullName: 'No Admin',
        role: Role.user,
        active: true,
      });

      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData: CreateCustomerDto = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        alertTypes: [alertData.id],
        isClient: false,
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: authErrorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/customers (POST) should fail if no alert type', async () => {
      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
          });
        });
    });

    it('/v1/customers (POST) should fail if invalid customer type is provided', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-2',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: 'invalid-type',
        active: true,
        secretKey: null,
        alertTypes: [alertData.id],
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: expect.arrayContaining(['Invalid customer type']),
          });
        });
    });

    it('/v1/customers (POST) should fail if invalid alert type is provided', async () => {
      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        eventCategories: [],
        secretKey: null,
        alertTypes: ['5951ea79-8594-4168-b8f1-7a5099cc0c63'],
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_ALERT_TYPE,
          });
        });
    });

    it('/v1/customers (POST) should fail if customer name already exists', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-3',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().many(2);

      const { parentId, image, updatedById, ...firstCustomer } = customer[0];
      const {
        parentId: secondParentId,
        image: secondImage,
        updatedById: secondUpdatedById,
        ...secondCustomer
      } = customer[1];

      await prisma.customer.create({
        data: {
          ...firstCustomer,
          name: 'already_exist',
          type: CustomerType.business,
          active: true,
          secretKey: null,
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const customerData = {
        ...secondCustomer,
        name: 'already_exist',
        type: CustomerType.business,
        active: true,
        secretKey: null,
        eventCategories: [],
        alertTypes: [alertData.id],
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_NAME,
          });
        });
    });

    it('/v1/customers (POST) should fail if customer secret key already exists', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-4',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().many(2);

      const { parentId, image, updatedById, ...firstCustomer } = customer[0];
      const {
        parentId: secondParentId,
        image: secondImage,
        updatedById: secondUpdatedById,
        ...secondCustomer
      } = customer[1];

      await prisma.customer.create({
        data: {
          ...firstCustomer,
          secretKey: 'already_exist',
          type: CustomerType.business,
          active: true,
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const customerData = {
        ...secondCustomer,
        secretKey: 'already_exist',
        type: CustomerType.business,
        active: true,
        eventCategories: [],
        alertTypes: [alertData.id],
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
      };

      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.INVALID_SECRET_KEY,
          });
        });
    });

    it("/v1/customers (POST) should fail if parentId doesn't exist", async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-5',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        eventCategories: [],
        alertTypes: [alertData.id],
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        parent: '6b0be523-9ef2-4e39-a6e8-a24891422fc1',
      };
      return request(app.getHttpServer())
        .post('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerData,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'There was an error processing parentId customer',
            message: errorCodes.INVALID_CUSTOMER,
          });
        });
    });
  });

  describe('/v1/customers (PATCH)', () => {
    it('/v1/customers (PATCH) should update customer', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-6',
          name: 'Violación de perímetro',
        },
      });

      const anotherAlert = await prisma.alertType.create({
        data: {
          type: 'robbery',
          name: 'robo',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = await prisma.customer.create({
        data: {
          ...customer,
          type: CustomerType.business,
          active: true,
          secretKey: null,
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
          alertTypes: {
            create: [
              {
                order: 0,
                alertTypeId: anotherAlert.id,
              },
            ],
          },
          sections: {
            create: {},
          },
        },
      });

      const customerUpdate: UpdateCustomerDto = {
        name: 'updated_customer',
        alertTypes: [alertData.id],
        isClient: true,
        sections: {
          alerts: false,
          locations: false,
        },
      };

      const monitoring = await createMonitoringUser(prisma, {
        customer: {
          connect: {
            id: customerData.id,
          },
        },
        userPermissions: {
          create: {
            monitoringAlertTypes: {
              connect: {
                id: anotherAlert.id,
              },
            },
          },
        },
      });

      const { token: tokenFinalUser, user: finalUser } =
        await createFinalUserAndToken(prisma, {
          username: '541166480626',
          password: '123456',
          firstName: 'mauricio',
          lastName: 'gallego',
          fullName: 'mauricio gallego',
          customer: {
            connect: {
              id: customerData.id,
            },
          },
        });

      const data = {
        phoneNumber: '541166490626',
        deviceContact: {
          id: '28',
          rawId: '36',
          name: 'andres gallego',
          nickname: null,
          phoneNumbers: [
            {
              id: '276',
              number: '+5491166490626',
            },
          ],
          emails: null,
          addresses: null,
          ims: null,
          organizations: null,
          birthday: null,
          note: '',
          photos: null,
          categories: null,
          urls: null,
        },
      };

      await request(app.getHttpServer())
        .post(`/v1/users/${finalUser.id}/contacts`)
        .set('Authorization', `Bearer ${tokenFinalUser}`)
        .send(data)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/v1/customers/${customerData.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerUpdate,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: customerData.id,
            name: customerUpdate.name,
            type: customerData.type,
            active: customerData.active,
            secretKey: customerData.secretKey,
            alertTypes: [
              {
                alertTypeId: alertData.id,
                customerId: customerData.id,
                order: 0,
                alertType: {
                  id: alertData.id,
                  type: alertData.type,
                  name: alertData.name,
                },
              },
            ],
            sections: {
              id: expect.any(String),
              alerts: false,
              events: true,
              notifications: true,
              reservations: true,
              protocols: true,
              usefulInformation: true,
              integrations: true,
              lots: true,
              cameras: true,
              locations: false,
            },
            image: customerData.image,
            isClient: true,
            parentId: null,
            updatedById: user.id,
          });
        });

      // I verify that the alert alerts of contacts and monitors are updated.

      const monitoringUpdated = await prisma.userPermission.findFirst({
        where: {
          userId: monitoring.id,
        },
        include: {
          monitoringAlertTypes: true,
        },
      });

      expect(monitoringUpdated).toMatchObject({
        monitoringAlertTypes: [alertData],
      });

      const contact = await prisma.contact.findFirst({
        where: {
          userId: finalUser.id,
        },
        include: {
          contactAlertTypes: {
            include: {
              alertType: true,
            },
          },
        },
      });

      expect(contact).toMatchObject({
        contactAlertTypes: [
          {
            alertType: alertData,
            alertTypeId: alertData.id,
            contactId: expect.any(String),
            id: expect.any(String),
          },
        ],
      });
    });

    describe('/v1/customers (PATCH) creating and updating event categories', () => {
      const listEventCategories: EventCategory[] = [];
      let customerToChangeEvents: CustomerPrisma;
      beforeAll(async () => {
        for await (const alertType of [
          'un evento',
          'un evento dos',
          'un evento tres',
        ]) {
          const event = await prisma.eventCategory.create({
            data: {
              title: alertType,
            },
          });
          listEventCategories.push(event);
        }
        const customer = new FakeCustomer().getMockFactory().plain().one();

        const customerData = {
          ...customer,
          type: CustomerType.business,
          active: true,
          secretKey: null,
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
        };

        customerToChangeEvents = await prisma.customer.create({
          data: {
            ...customerData,
          },
        });
      });

      it('event category add events', () => {
        return request(app.getHttpServer())
          .patch(`/v1/customers/${customerToChangeEvents.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            eventCategories: [
              listEventCategories[0].id,
              listEventCategories[1].id,
              listEventCategories[2].id,
            ],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.eventCategories.length).toEqual(3);
          });
      });
      it('event categories are not cleaned', () => {
        return request(app.getHttpServer())
          .patch(`/v1/customers/${customerToChangeEvents.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'mauricio',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.eventCategories.length).toEqual(3);
          });
      });
      it('event category going to enactive two events', () => {
        return request(app.getHttpServer())
          .patch(`/v1/customers/${customerToChangeEvents.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            eventCategories: [listEventCategories[0].id],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.eventCategories.length).toEqual(1);
          });
      });

      it('event category going to add one event', async () => {
        const newEvent = await prisma.eventCategory.create({
          data: {
            title: 'ultimo evento',
          },
        });
        return request(app.getHttpServer())
          .patch(`/v1/customers/${customerToChangeEvents.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            eventCategories: [newEvent.id, listEventCategories[0].id],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.eventCategories.length).toEqual(2);
          });
      });

      it('event category going to enactive all events', () => {
        return request(app.getHttpServer())
          .patch(`/v1/customers/${customerToChangeEvents.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            eventCategories: [],
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.eventCategories.length).toEqual(0);
          });
      });
    });
    it('/v1/customers (PATCH) should deactivate customer', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-7',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        updatedById: undefined,
        parentId: undefined,
      };

      const { id } = await prisma.customer.create({
        data: {
          ...customerData,
        },
      });

      const customerUpdate: UpdateCustomerDto = {
        active: false,
      };

      return request(app.getHttpServer())
        .patch(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerUpdate,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            active: false,
          });
        });
    });

    it('/v1/customers (PATCH) should activate customer', async () => {
      const alertData = await prisma.alertType.create({
        data: {
          type: 'perimeter-violation-8',
          name: 'Violación de perímetro',
        },
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: false,
        secretKey: null,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        updatedById: undefined,
        parentId: undefined,
      };

      const { id } = await prisma.customer.create({
        data: {
          ...customerData,
        },
      });

      const customerUpdate: UpdateCustomerDto = {
        active: true,
      };

      return request(app.getHttpServer())
        .patch(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...customerUpdate,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            active: true,
          });
        });
    });

    it('/v1/customers (PATCH) should update customer with parentId', async () => {
      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        updatedById: undefined,
        parentId: undefined,
      };

      const { id } = await prisma.customer.create({
        data: {
          ...customerData,
        },
      });

      const parentCustomer = new FakeCustomer().getMockFactory().plain().one();

      const parentCustomerData = {
        ...parentCustomer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        parentId: undefined,
        updatedById: undefined,
        image: undefined,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      };

      const { parentId } = await prisma.customer.create({
        data: {
          ...parentCustomerData,
        },
      });

      const customerUpdate: UpdateCustomerDto = {
        parent: parentId,
      };

      await request(app.getHttpServer())
        .patch(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(customerUpdate)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id,
            parentId: parentId,
          });
        });

      // should clean parent id
      await request(app.getHttpServer())
        .patch(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          parent: null,
        })
        .expect((res) => {
          expect(res.body).toMatchObject({
            id,
            parentId: null,
          });
        });
    });

    it('/v1/customers (PATCH) should update customer with updatedBy', async () => {
      const originalUser = await createUser(prisma, {
        username: 'updatedBy',
        password: 'updatedBy',
        firstName: 'updatedBy',
        lastName: 'updatedBy',
        fullName: 'updatedBy',
      });

      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        updatedBy: {
          connect: {
            id: originalUser.id,
          },
        },
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        updatedById: undefined,
        parentId: undefined,
      };

      const { id } = await prisma.customer.create({
        data: {
          ...customerData,
        },
      });

      return request(app.getHttpServer())
        .patch(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'updated by' })
        .expect((res) => {
          expect(res.body).toMatchObject({
            id,
            name: 'updated by',
            updatedById: user.id,
          });
        });
    });
  });

  describe('/v1/customers/:id (GET)', () => {
    it('/v1/customers/:id (GET) should return customer', async () => {
      const customerData: Prisma.CustomerCreateInput = {
        country: 'CO',
        name: 'Customer',
        state: 'state',
        district: 'district',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      };

      const { id } = await prisma.customer.create({
        data: customerData,
      });

      return request(app.getHttpServer())
        .get(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id,
            country: 'CO',
            district: 'district',
            name: 'Customer',
            state: 'state',
            updatedById: user.id,
          });
        });
    });

    it('/v1/customers/:id (GET) should return 404', async () => {
      return request(app.getHttpServer())
        .get('/v1/customers/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'CUSTOMER_NOT_FOUND',
            statusCode: 404,
          });
        });
    });

    it('/v1/customers/:id (GET) should return 403', async () => {
      const customerData: Prisma.CustomerCreateInput = {
        country: 'CO',
        name: 'Customer_2',
        state: 'state',
        district: 'district',
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      };

      const { id } = await prisma.customer.create({
        data: customerData,
      });

      const { token: newToken } = await createUserAndToken(prisma, {
        username: 'otherUser',
        password: 'otherUser',
        firstName: 'otherUser',
        lastName: 'otherUser',
        fullName: 'otherUser',
        customer: {
          create: {
            country: 'CO',
            name: 'other customer',
            state: 'state',
            district: 'district',
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      });

      return request(app.getHttpServer())
        .get(`/v1/customers/${id}`)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            message: 'AUTHORIZATION_REQUIRED',
            error: 'Forbidden',
          });
        });
    });
  });

  describe('/v1/customers/:id/integrations (PATCH)', () => {
    it('/v1/customers/:id/integrations (PATCH) should update customer integrations', async () => {
      const customer = new FakeCustomer().getMockFactory().plain().one();

      const customerData = {
        ...customer,
        type: CustomerType.business,
        active: true,
        secretKey: null,
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        image: {
          name: 'image.png',
          url: 'http://image.png',
          thumbnailUrl: 'http://thumbnail.image.png',
        },
        updatedById: undefined,
        parentId: undefined,
      };

      const { id } = await prisma.customer.create({
        data: customerData,
      });

      const integrationData: Prisma.CustomerIntegrationCreateInput = {
        giroVisionId: 'girovisionId',
        customer: {
          connect: {
            id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      };

      const { id: integrationId, updatedAt } =
        await prisma.customerIntegration.create({
          data: integrationData,
        });

      const integrationUpdate: CustomerIntegrationsDto = {
        giroVisionId: 'girovisionIdUpdated',
        icmToken: 'icmTokenUpdated',
        icmUrl: 'icmUrlUpdated',
      };

      return request(app.getHttpServer())
        .patch(`/v1/customers/${id}/integrations`)
        .set('Authorization', `Bearer ${token}`)
        .send(integrationUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: integrationId,
            giroVisionId: 'girovisionIdUpdated',
            icmToken: 'icmTokenUpdated',
            icmUrl: 'icmUrlUpdated',
            updatedById: user.id,
            customerId: id,
            neighborhoodAlarm: null,
            neighborhoodAlarmKey: null,
            neighborhoodAlarmLink: null,
            traccarPassword: null,
            traccarUsername: null,
            cybermapaPassword: null,
            cybermapaUrl: null,
            cybermapaUsername: null,
            traccarUrl: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
          expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
            updatedAt.getTime(),
          );
        });
    });
  });

  describe('/v1/customers/settings (PATCH)', () => {
    let customer: Customer;
    let customer2: Customer;
    let userStatesman: { user: User; token: string };
    let userMonitoring: { user: User; token: string };

    beforeAll(async () => {
      await createPermission(prisma, {
        action: 'configure-customer',
        name: 'Configurar cliente',
        category: 'customer',
        statesman: true,
        monitoring: false,
      });
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

      customer2 = await createCustomer(prisma, {
        name: 'customer2',
        state: 'otro state',
        district: 'otro district',
        country: 'otro country',
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

      userStatesman = await createUserAndToken(prisma, {
        username: 'stategmanWithCustomer@gmail.com',
        firstName: 'statesman',
        lastName: 'customer',
        password: '123456',
        fullName: 'stategmanWithCustomer',
        active: true,
        role: 'statesman',
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      userMonitoring = await createUserAndToken(prisma, {
        username: 'monitoringWithCustomer@gmail.com',
        firstName: 'monitoring',
        lastName: 'customer',
        password: '123456',
        role: 'monitoring',
        fullName: 'monitoringWithCustomer',
        active: true,
        customer: {
          connect: {
            id: customer2.id,
          },
        },
      });
    });
    it('/v1/customers/settings', () => {
      return request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/settings`)
        .set('Authorization', `Bearer ${userStatesman.token}`)
        .send({
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
          doubleConfirmMessage: 'yes',
          doubleConfirmRequired: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: expect.any(String),
            perimeterViolationNumbers: '123123123',
            alarmActivatedNumbers: '123123123',
            badCompanyNumbers: '123123123',
            panicNumbers: '123123123',
            publicViolenceNumbers: '123123123',
            doubleConfirmMessage: 'yes',
            doubleConfirmRequired: true,
          });
        });
    });

    it('/v1/customers/settings sending empty fields', () => {
      return request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/settings`)
        .set('Authorization', `Bearer ${userStatesman.token}`)
        .send({
          perimeterViolationNumbers: '',
          alarmActivatedNumbers: '',
          badCompanyNumbers: '',
          panicNumbers: '',
          publicViolenceNumbers: '',
          kidnappingNumbers: '',
          fireNumbers: '',
          healthEmergencyNumbers: '',
          genderViolenceNumbers: '',
          daysToShow: '',
          robberyNumbers: '',
          healthEmergency: '',
          publicViolence: '',
          securityGuard: '',
          securityChief: '',
          additionalNotifications: '',
          panicNotifications: '',
          reservationEmail: '',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: expect.any(String),
            minAccuracy: null,
            maxAccuracy: null,
            perimeterViolationNumbers: '',
            alarmActivatedNumbers: '',
            badCompanyNumbers: '',
            panicNumbers: '',
            publicViolenceNumbers: '',
            kidnappingNumbers: '',
            fireNumbers: '',
            panicKey: null,
            healthEmergencyNumbers: '',
            genderViolenceNumbers: '',
            daysToShow: '',
            robberyNumbers: '',
            healthEmergency: '',
            publicViolence: '',
            securityGuard: '',
            securityChief: '',
            additionalNotifications: '',
            panicNotifications: '',
            reservationEmail: '',
            receiveAlertsFromOutside: false,
            validateUsers: false,
          });
        });
    });

    it('/v1/customers/settings without permission', () => {
      return request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/settings`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toEqual('AUTHORIZATION_REQUIRED');
        });
    });

    it('/v1/customers/customer/settings different customer relation', () => {
      return request(app.getHttpServer())
        .patch(`/v1/customers/${customer2.id}/settings`)
        .set('Authorization', `Bearer ${userStatesman.token}`)
        .send({
          perimeterViolationNumbers: '123123123',
          alarmActivatedNumbers: '123123123',
          badCompanyNumbers: '123123123',
          panicNumbers: '123123123',
          publicViolenceNumbers: '123123123',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toEqual('ACTION_NOT_ALLOWED');
        });
    });
  });

  describe('/v1/customers/url/:url', () => {
    const customer = new FakeCustomer().getMockFactory().plain().one();
    let customerData;
    beforeAll(async () => {
      customerData = await prisma.customer.create({
        data: {
          ...customer,
          type: CustomerType.business,
          active: true,
          secretKey: null,
          speed: '20',
          notes: 'recuerda la velocidad',
          url: 'image.png',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
          sections: {
            create: {},
          },
        },
      });
    });

    it('/v1/customers/url/:url', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/url/${customerData.url}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            id: expect.any(String),
            name: customerData.name,
            image: customerData.image,
            notes: customerData.notes,
            speed: customerData.speed,
          });
        });
    });

    it('/v1/customers/url/:url', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/url/asdasdasmok`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
        });
    });
  });

  describe('/v1/customers/locations/neighborhood', () => {
    const customer = new FakeCustomer().getMockFactory().plain().one();
    let customerData;
    beforeAll(async () => {
      customerData = await prisma.customer.create({
        data: {
          ...customer,
          type: CustomerType.government,
          active: true,
          secretKey: null,
          district: 'CABA',
          state: 'Buenos aires',
          country: 'Argentina',
          speed: '20',
          notes: 'recuerda la velocidad',
          url: 'image.png',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
          sections: {
            create: {},
          },
          locations: {
            createMany: {
              data: [
                {
                  name: 'montserrat',
                  type: 'neighborhood',
                  updatedById: user.id,
                },
                {
                  name: 'san fernando',
                  type: 'locality',
                  updatedById: user.id,
                },
              ],
            },
          },
        },
      });
    });

    it('/v1/customers/locations/neighborhood', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/locations/neighborhood`)
        .query({
          district: 'CABA',
          state: 'Buenos aires',
          country: 'Argentina',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body).toStrictEqual([
            {
              active: true,
              createdAt: expect.any(String),
              customerId: customerData.id,
              id: expect.any(String),
              name: 'montserrat',
              type: 'neighborhood',
              updatedAt: expect.any(String),
              updatedById: expect.any(String),
            },
          ]);
        });
    });

    it('/v1/customers/locations/neighborhood', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/locations/neighborhood`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('/v1/customers/exists', () => {
    const customer = new FakeCustomer().getMockFactory().plain().one();
    let customerData;
    let customerData2;
    beforeAll(async () => {
      customerData = await prisma.customer.create({
        data: {
          ...customer,
          name: 'palermo',
          type: CustomerType.business,
          active: true,
          secretKey: 'llaveSecreta',
          speed: '20',
          notes: 'recuerda la velocidad',
          url: 'image.png',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
          sections: {
            create: {},
          },
        },
      });

      customerData2 = await prisma.customer.create({
        data: {
          ...customer,
          type: CustomerType.business,
          name: 'balvanera',
          active: true,
          secretKey: null,
          speed: '20',
          notes: 'recuerda la velocidad',
          url: 'image.png',
          district: 'ibague',
          state: 'tolima',
          country: 'colombia',
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
          image: {
            name: 'image.png',
            url: 'http://image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          updatedById: undefined,
          parentId: undefined,
          sections: {
            create: {},
          },
        },
      });
    });

    it('/v1/customers/exists (200) secret key', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .query({
          secretKey: 'llaveSecreta',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...customerData,
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
          });
        });
    });

    it('/v1/customers/exists (200) zone', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .query({
          district: 'ibague',
          state: 'tolima',
          country: 'colombia',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            ...customerData2,
            updatedAt: expect.any(String),
            createdAt: expect.any(String),
          });
        });
    });

    it('/v1/customers/exists (404) zone', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .query({
          district: 'mocoa',
          state: 'putumayo',
          country: 'colombia',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'CUSTOMER_NOT_FOUND',
            statusCode: 404,
          });
        });
    });

    it('/v1/customers/exists (400) some fields empty', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .query({
          state: 'tolima',
          country: 'colombia',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toEqual({
            error: 'Bad Request',
            message: expect.any(Array),
            statusCode: 400,
          });
        });
    });

    it('/v1/customers/exists (400) all fields empty', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toEqual({
            error: 'Bad Request',
            message: expect.any(Array),
            statusCode: 400,
          });
        });
    });

    it('/v1/customers/exists (404) CUSTOMER_NOT_FOUND', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/exists`)
        .query({
          secretKey: 'xxxxx',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'CUSTOMER_NOT_FOUND',
            statusCode: 404,
          });
        });
    });
  });
});
