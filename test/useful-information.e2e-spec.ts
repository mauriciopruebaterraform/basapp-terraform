import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { CustomerType, Role, UsefulInformation, User } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';

describe('UsefulInformationController (e2e)', () => {
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

  describe('/v1/customers/${customer}/useful-information', () => {
    let customer: Customer;
    let customer2: Customer;
    let statesman: { user: User; token: string };
    beforeAll(async () => {
      customer = await createCustomer(prisma, {
        name: 'varsovia',
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
        name: 'bosques de varsovia',
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
        username: 'new-otro-mas-statesman@mail.com',
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
        action: 'list-useful-information',
        name: 'configura informacion util',
        category: 'list',
        statesman: true,
        monitoring: false,
      });
      await createPermission(prisma, {
        action: 'create-useful-information',
        name: 'crea informacion util',
        category: 'useful-information',
        statesman: true,
        monitoring: true,
      });
      await createPermission(prisma, {
        action: 'modify-useful-information',
        name: 'actualizar util',
        category: 'useful-information',
        statesman: true,
        monitoring: true,
      });
      await prisma.usefulInformation.createMany({
        data: [
          {
            title: 'Novedades',
            code: 'AA0001',
            updatedById: user.id,
            customerId: customer2.id,
          },
          {
            title: 'Expensas',
            code: 'AA0002',
            updatedById: user.id,
            customerId: customer.id,
          },
          {
            customerId: customer.id,
            title: 'Whatsapp',
            code: 'WAPP',
            updatedById: user.id,
          },
          {
            customerId: customer.id,
            title: 'Novedades',
            code: 'AA0003',
            updatedById: user.id,
          },
        ],
      });
    });

    it('/v1/customers/${customer}/useful-information (statesman) with filters', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/useful-information`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 20,
          skip: 0,
          where: JSON.stringify({
            active: true,
            title: {
              contains: 'Expensas',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toStrictEqual([
            {
              title: 'Expensas',
              code: 'AA0002',
              attachment: null,
              active: true,
              isCategory: false,
              categoryId: null,
              link: null,
              description: null,
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
      ['Expensas', 0],
      ['Novedades', 1],
      ['Whatsapp', 2],
    ])(
      '/v1/customers/${customer}/useful-information (statesman) allows pagination',
      async (a, b) => {
        await request(app.getHttpServer())
          .get(`/v1/customers/${customer.id}/useful-information`)
          .set('Authorization', `Bearer ${statesman.token}`)
          .query({
            take: 1,
            skip: b,
            orderBy: JSON.stringify({
              title: 'asc',
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
    it('/v1/customers/${customer}/useful-information (statesman)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/useful-information`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: UsefulInformation) => {
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

    it('/v1/customers/${customer}/useful-information (user)', async () => {
      const { token } = await createUserAndToken(prisma, {
        username: 'newUser@mail.com',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: { connect: { id: customer.id } },
        role: Role.user,
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/useful-information`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item: UsefulInformation) => {
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

    it('/v1/customers/${customer}/useful-information (user)', async () => {
      const { token } = await createUserAndToken(prisma, {
        username: 'newUser2@mail.com',
        password: '123456',
        firstName: 'New User',
        lastName: 'New User',
        fullName: 'New User New User',
        customer: { connect: { id: customer2.id } },
        role: Role.user,
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/useful-information`)
        .set('Authorization', `Bearer ${token}`)
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

    it('/v1/customers/${customer}/useful-information (GET) 403 forbidden', async () => {
      const customer2 = await createCustomer(prisma, {
        name: 'san fernandito',
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
        username: 'indiacatalina@gmail.com',
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
        .get(`/v1/customers/${customer2?.id}/useful-information`)
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

    it('/v1/customers/${customer}/useful-information (POST) isCategory true', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'juanalberto@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/useful-information`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'WHATSAPP',
          code: 'WPP',
          isCategory: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            isCategory: true,
            categoryId: null,
            link: null,
            description: null,
            active: true,
            attachment: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            title: 'WHATSAPP',
            code: 'WPP',
          });
        });
    });

    it('/v1/customers/${customer}/useful-information (POST) when isCategory si true and it try to send attachment, description, link', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'alberticodelacreuz@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/useful-information`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'Emergencia',
          code: 'AA000045',
          isCategory: false,
          attachment: {
            url: 'http://image.png',
            name: 'image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            isCategory: false,
            categoryId: null,
            attachment: {
              url: 'http://image.png',
              name: 'image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
            description:
              '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
            link: 'http://tucasita.com.ar',
            active: true,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            title: 'Emergencia',
            code: 'AA000045',
          });
        });
    });
    it('/v1/customers/${customer}/useful-information (POST) isCategory false and link', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'alberticodelatorre@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/useful-information`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'Oportunidades',
          code: 'A0003',
          link: 'http://google.com.ar',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            isCategory: false,
            categoryId: null,
            link: 'http://google.com.ar',
            description: null,
            active: true,
            attachment: null,
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            updatedById: userMonitoring.user.id,
            customerId: customer2?.id,
            title: 'Oportunidades',
            code: 'A0003',
          });
        });
    });

    it('/v1/customers/${customer}/useful-information (POST) attachment, description, link', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'carlitostevez@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/useful-information`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'Aclaraciones',
          code: 'A000111',
          isCategory: false,
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
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
            description:
              '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
            link: 'http://tucasita.com.ar',
            customerId: customer2?.id,
            active: true,
            id: expect.any(String),
            updatedById: userMonitoring.user.id,
            title: 'Aclaraciones',
            code: 'A000111',
            isCategory: false,
            attachment: {
              url: 'http://image.png',
              name: 'image.png',
              thumbnailUrl: 'http://thumbnail.image.png',
            },
          });
        });
    });

    it('/v1/customers/${customer}/useful-information (POST) 403 forbidden', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'josedavid@gmail.com',
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
        .post(`/v1/customers/${customer2?.id}/useful-information`)
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'Robo',
          code: 'A004',
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

    it('/v1/customers/${customerId}/useful-information/${id} (PATCH) isCategory false', async () => {
      const usefulInformation = await prisma.usefulInformation.create({
        data: {
          title: 'Novedad',
          code: 'AA0001',
          isCategory: false,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/useful-information/${usefulInformation.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'Experiencia',
          code: 'AA0003',
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            attachment: null,
            categoryId: null,
            description:
              '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
            link: 'http://tucasita.com.ar',
            isCategory: false,
            id: expect.any(String),
            updatedById: statesman.user.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            title: 'Experiencia',
            code: 'AA0003',
          });
        });
    });

    it('/v1/customers/${customerId}/useful-information/${id} (PATCH) isCategory true', async () => {
      const usefulInformation = await prisma.usefulInformation.create({
        data: {
          title: 'Experiencia',
          code: 'AA0002',
          isCategory: true,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/useful-information/${usefulInformation.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'Novedad',
          code: 'AA0001',
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            attachment: null,
            categoryId: null,
            description: null,
            isCategory: true,
            link: null,
            id: expect.any(String),
            updatedById: statesman.user.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            title: 'Novedad',
            code: 'AA0001',
          });
        });
    });
    it('/v1/customers/${customerId}/useful-information/${id} (PATCH) change isCategory', async () => {
      const usefulInformation = await prisma.usefulInformation.create({
        data: {
          title: 'Experiencia',
          code: 'AA0002',
          isCategory: true,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/useful-information/${usefulInformation.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'Novedad',
          isCategory: false,
          code: 'AA0001',
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            attachment: null,
            categoryId: null,
            isCategory: false,
            description:
              '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
            link: 'http://tucasita.com.ar',
            id: expect.any(String),
            updatedById: statesman.user.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            title: 'Novedad',
            code: 'AA0001',
          });
        });
    });

    it('/v1/customers/${customerId}/useful-information/${id} change isCateory false (PATCH)', async () => {
      const usefulInformation = await prisma.usefulInformation.create({
        data: {
          title: 'Novedad',
          code: 'AA0001',
          attachment: {
            url: 'http://image.png',
            name: 'image.png',
            thumbnailUrl: 'http://thumbnail.image.png',
          },
          description:
            '<p></p><div class="W4P4ne " style="font-size: 14px;text-align: left;"><div class="PHBdkd"><div class="DWPxHb"><div>Coronavirus Covid-19 es la app oficial del Ministerio de Salud de la Nación y tiene como objetivo que los argentinos y las argentinas puedan realizarse un rápido autodiagnóstico para saber si sus síntomas son compatibles con el COVID-19 .<br/>La aplicación tiene las siguientes características:<br/><br/></div><div>-Información sobre diversos temas (síntomas, cómo prevenirlos, qué hacer en caso de sospecha e infección, etc).<br/><br/></div><div>-En caso de sospecha de infección, los ciudadanos recibirán instrucciones y serán remitidos al centro de salud más cercano;<br/><br/></div><div>-Información oficial del Ministerio de Salud en relación al Coronavirus.</div></div></div></div><p><br/></p><p><br/></p><p></p>',
          link: 'http://tucasita.com.ar',
          isCategory: false,
          updatedById: user.id,
          customerId: customer.id,
        },
      });
      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer.id}/useful-information/${usefulInformation.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          isCategory: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            active: true,
            attachment: null,
            categoryId: null,
            description: null,
            isCategory: true,
            link: null,
            id: expect.any(String),
            updatedById: statesman.user.id,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            customerId: customer.id,
            title: 'Novedad',
            code: 'AA0001',
          });
        });
    });

    it('/v1/customers/${customer}/useful-information (PATCH) 403 forbidden', async () => {
      const userMonitoring = await createUserAndToken(prisma, {
        username: 'josedavidGallego@gmail.com',
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
        .patch(
          `/v1/customers/${customer2?.id}/useful-information/1231nfgd-12-sdf-123`,
        )
        .set('Authorization', `Bearer ${userMonitoring.token}`)
        .send({
          title: 'Robo',
          code: 'A004',
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

    it('/v1/customers/${customer}/useful-information (PATCH) 403 forbidden', async () => {
      const usefulInformation = await prisma.usefulInformation.create({
        data: {
          title: 'robo',
          code: 'AA00014',
          isCategory: false,
          updatedById: user.id,
          customerId: customer.id,
        },
      });

      return await request(app.getHttpServer())
        .patch(
          `/v1/customers/${customer?.id}/useful-information/${usefulInformation.id}`,
        )
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          title: 'Robo',
          code: 'A004',
          categoryId: usefulInformation.id,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: 'INVALID_SAME_CATEGORY_USEFUL_INFORMATION',
          });
        });
    });
  });
});
