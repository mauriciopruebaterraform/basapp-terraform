import { Test, TestingModule } from '@nestjs/testing';
import { EventCategory, Role } from '@prisma/client';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { PrismaService } from '@src/database/prisma.service';
import { AppModule } from '../src/app.module';
import { createUserAndToken } from './utils/users';
import * as request from 'supertest';
import { errorCodes as authErrorCodes } from '@src/auth/auth.constants';
import { FakeEventCategory } from './fakes/event.category.fake';
import { cleanData } from './utils/clearData';
import { createBusinessCustomerAndAdmin } from './utils/customer';
import { Customer } from '@prisma/client';

describe('EventCategoryController (e2e)', () => {
  let dataToFetch: any = new FakeEventCategory().getMockFactory().one();
  const eventCategoryData = new FakeEventCategory()
    .getMockFactory()
    .plain()
    .many(10);
  let app: INestApplication;
  let prisma: PrismaService;

  let token: string;
  let tokenStatesman: string;

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

    await prisma.eventCategory.createMany({
      data: eventCategoryData.map((event) => ({
        ...event,
        image: undefined,
      })),
    });

    const result = await createUserAndToken(prisma, {
      username: 'new-customer@mail.com',
      password: '123456',
      firstName: 'New',
      lastName: 'Customer',
      fullName: 'New Customer',
      role: Role.admin,
      active: true,
    });

    const userStatesman = await createUserAndToken(prisma, {
      username: 'new-customer-statesman@mail.com',
      password: '123456',
      firstName: 'New-1',
      lastName: 'Customer-1',
      fullName: 'New-1 Customer',
      role: Role.statesman,
      active: true,
    });

    token = result.token;
    tokenStatesman = userStatesman.token;
    dataToFetch = {
      title: 'un evento',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77.png',
        name: 'd2966fb1-a30f-4e37-9110-46af19750b77.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77-thumbnail.png',
      },
    };
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/event-category (POST)', () => {
    it('/v1/event-category (POST)', () => {
      return request(app.getHttpServer())
        .post('/v1/event-category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...dataToFetch,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(String),
            title: 'un evento',
            active: true,
            image: expect.any(Object),
          });
        });
    });

    it('/v1/event-category (POST) fail', async () => {
      const { token } = await createUserAndToken(prisma, {
        username: 'no-admin@email.com',
        password: '123456',
        firstName: 'No',
        lastName: 'Admin',
        fullName: 'No Admin',
        role: Role.user,
        active: true,
      });
      return request(app.getHttpServer())
        .post('/v1/event-category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...dataToFetch,
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

    it('/v1/event-category (POST) body incomplete', () => {
      return request(app.getHttpServer())
        .post('/v1/event-category')
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(400)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 400,
            error: 'Bad Request',
            message: expect.any(Array),
          });
        });
    });
  });

  describe('/v1/event-category (GET)', () => {
    it('get list', () => {
      request(app.getHttpServer())
        .get('/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: EventCategory) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('active');
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: eventCategoryData.length,
            take: 100,
            skip: 0,
            size: eventCategoryData.length,
            hasMore: false,
          });
        });
    });
  });

  describe('/v1/event-category/${id} (PATCH)', () => {
    let eventCategoryCreated;
    let customer: Customer;
    beforeAll(async () => {
      const data = await createBusinessCustomerAndAdmin(prisma);
      customer = data.customer;
      eventCategoryCreated = await prisma.eventCategory.create({
        data: {
          title: 'title not modified',
          active: true,
          image: undefined,
          customerEventCategories: {
            createMany: {
              data: [
                {
                  customerId: customer.id,
                  updatedById: data.user.id,
                },
              ],
            },
          },
        },
      });
    });

    it('/v1/event-category/${id} (PATCH)', async () => {
      const { body: eventCategory } = await request(app.getHttpServer())
        .patch(`/v1/event-category/${eventCategoryCreated.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'title modified',
          active: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: eventCategoryCreated.id,
            title: 'title modified',
            active: false,
          });
        });

      const customerEventCategory = await prisma.customerEventCategory.findMany(
        {
          select: {
            active: true,
          },
          where: {
            categoryId: eventCategory.id,
          },
        },
      );

      expect(customerEventCategory).toStrictEqual([
        {
          active: false,
        },
      ]);
    });

    it('/v1/event-category/${id} (PATCH) AUTHORIZATION_REQUIRED', () => {
      return request(app.getHttpServer())
        .patch(`/v1/event-category/${eventCategoryCreated.id}`)
        .set('Authorization', `Bearer ${tokenStatesman}`)
        .send({
          title: 'try to change title',
          active: true,
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

    it('/v1/event-category/${id} EVENT CATEGORY NOT FOUND', () => {
      return request(app.getHttpServer())
        .patch(`/v1/event-category/4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'title modified',
          active: true,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toEqual('EVENT_CATEGORY_NOT_FOUND');
        });
    });
  });
});
