/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  PrismaService,
  PrismaGirovisionService,
} from '@src/database/prisma.service';
import { CustomerType, Role, User, Lot, EventType } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { Customer } from '@src/customers/entities/customer.entity';
import { createCustomer } from './utils/customer';
import { createPermission } from './utils/permission';
import { cleanData } from './utils/clearData';
import { errorCodes } from '@src/customers/events/events.constants';
import { errorCodes as errorCodesAuth } from '@src/auth/auth.constants';
import { HttpService } from '@nestjs/axios';
import delay from './utils/delay';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';

jest.mock('firebase-admin', () => {
  return {
    database: () => ({
      ref: () => ({
        child: () => ({
          push: () => null,
          set: () => null,
        }),
      }),
    }),
  };
});

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaGV: PrismaGirovisionService;
  let httpService: HttpService;
  let token: string;
  let user: User;
  let firebase: FirebaseService;

  let customer: Customer;
  let customer2: Customer;
  let codigoIngreso: EventType;
  let permanenteMultiple: EventType;
  let visitaConDni: EventType;
  let finallyUser: { user: User; token: string };
  let finallyUser2: { user: User; token: string };
  let statesman: { user: User; token: string };
  let monitoring: { user: User; token: string };
  const EMITIDO = '455e49fe-32d8-4487-8121-dfaa07bf8f85';
  const ATENDIDO = '52e90f53-08c9-4572-b09f-23a4ae3464e7';
  const VISITAS = '1ef9cc67-0e45-4bd3-ae62-7ec71d28d579';
  const EVENTCATEGORY = '3ad58d34-31f8-4a48-a869-3810d1db199f';
  const CONFIRM = 'a146c578-834b-4edd-8712-f94d4d3b86d5';
  const CANCELLED = 'b69e4f8f-529c-4f51-a0e8-28caaa3568f8';
  const PROCESSING = '2f56ce53-06c7-4d88-8e49-9d6c7c5792e6';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseService)
      .useValue(FirebaseServiceMock)
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
    prismaGV = app.get(PrismaGirovisionService);
    httpService = app.get(HttpService);
    firebase = app.get(FirebaseService);

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
      countryCode: '54',
      settings: {
        create: {
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      integrations: {
        create: {
          giroVisionId: '12',
          icmUrl: 'http://url.com/',
          icmToken: 'este-es-el-token',
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
    monitoring = await createUserAndToken(prisma, {
      username: 'monitor@mail.com',
      password: '123456',
      firstName: 'monitor',
      lastName: 'test',
      fullName: 'monitor test',
      role: Role.monitoring,
      active: true,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
    await createPermission(prisma, {
      action: 'list-events',
      name: 'listado de eventos',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'attend-event',
      name: 'Modifica el evento',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-event',
      name: 'crea el evento',
      category: 'list',
      statesman: true,
      monitoring: true,
    });
    await createPermission(prisma, {
      action: 'list-reservations',
      name: 'listado de reservas',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await createPermission(prisma, {
      action: 'create-reservation',
      name: 'crear reserva',
      category: 'list',
      statesman: true,
      monitoring: false,
    });
    await prisma.eventType.createMany({
      data: [
        {
          id: VISITAS,
          code: 'AA100',
          title: 'VISITAS',
          updatedById: user.id,
          customerId: customer.id,
          generateQr: true,
          qrFormat: 2,
        },
      ],
    });
    await prisma.eventState.createMany({
      data: [
        {
          id: ATENDIDO,
          name: 'Atendido',
        },
        {
          id: EMITIDO,
          name: 'Emitido',
        },
        {
          id: CONFIRM,
          name: 'A confirmar',
        },
        {
          id: CANCELLED,
          name: 'Usuario canceló',
        },
        {
          id: PROCESSING,
          name: 'Procesando',
        },
      ],
    });
    await prisma.event.createMany({
      data: [
        {
          from: new Date('2020-04-22 03:00:00'),
          to: new Date('2020-04-23 02:59:00'),
          fullName: 'pepito perez',
          description: '',
          lot: 'DS123467',
          changeLog: '[]',
          userId: user.id,
          customerId: customer2.id,
          file: {},
          dni: '34773913',
          isPermanent: false,
          isCopy: false,
          firstName: 'pepito',
          lastName: 'perez',
          patent: '',
          qrCode:
            'data:image/png;base64,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',
          token: '1b059be0-84de-11ea-aec6-2b8255282cbf',
          qrPending: false,
        },
        {
          from: new Date('2020-04-13 03:00:00'),
          to: new Date('2020-04-14 02:59:00'),
          fullName: 'rodrigo perez',
          description: '',
          lot: 'DS123467',
          changeLog: '[]',
          file: {},
          userId: statesman.user.id,
          customerId: customer.id,
          dni: '34773913',
          isPermanent: false,
          isCopy: false,
          firstName: 'rodrigo',
          lastName: 'perez',
          patent: '',
          qrCode:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASgAAAEoCAMAAADc2ZwrAAAAHnRFWHRTb2Z0d2FyZQBid2lwLWpzLm1ldGFmbG9vci5jb21Tnbi0AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMA/1uRIrUAAAUBSURBVHic7dYxduNADARR+/6XdsKINF4XMCOZFgsZLQDT+Jvs1/ewvk51/jvtr+ZoP52r9uB7x4NCwUGh4KBQcFAoOCgUHBQKDj4V6vxAVam/fKgJND18NX/ZLxTsFwr2CwX7hYL9QsF+oWC/ULA/PUwPqB6YHpBypDw0P753PCgUHBQKDgoFB4WCg0LBQaHgoFBwEB6aYLqHTN8TSiihhBJKKKGEuivUrvm0Z1c+oWA+oWA+oWA+oWA+oWA+oWA+oWC+ZSh6wK5g9N1pnm7ecr9QcL9QcL9QcL9QcL9QcL9QcL9QcP85OK1dQf/qu33vePBmhwv1ou/2vePBmx0u1Iu+2/eOB292uFAv+m7fOx682eEvh9pV0wfoXPf3lx26WkLBEgqWULCEgiUULKFgfTxUejgFTX+n++iB9L1pv1CwXyjYLxTsFwr2CwX7hYL9QsH+WBSAPpQC0t9Tvunh0xxC0ftxo1CwUSjYKBRsFAo2CgUbnwpVDXQDT/vpAWnvar64LwVLAVf7hRJqFkSoxX6hhJoFEWqx/99A0aB0wTTI7j6ai+a8lFBCCbWSi+a8lFBCCbWSi+a8lFAFFA1GH6QH7to/BWl/CyWUUEIJJZRQQhXvJ7AuAD1otb/67ubC/UIJJdRv+YQSSqjR4d1+oWD/26HoAfTB1D8Nvgugyon3pwYaTCgYTCgYTCgYTCgYTCgYTCgY7OOg0kACoP1pf4Kk/akvvVPuE0ooVELBEgqWULCEgiUUrDYUHXgXwPRdmiPluvxdKJZDKJhDKJhDKJhDKJhDKJhDKJgjN4TF3fnuIdP9aW+Vp8wnlFCohIIlFCyhYAkFSyhYYyj6PQ3UDZ4Oogd365K7/EEooUgJBUsoWELBEgqWULBw7mqwG4zOUSgK/a45oYTaOyeUUHvnhBJq75xQ57nuoi5Q+j29kw5Je7u5y70puFDH3hRcqGNvCi7UsTcFF+rYm4ILdexNwYU69qbgQh170wMUcHpo93vX/vZeoYQSSiihhBJKqOAwDdwNkoJ198fDmvcIBd8TCr4nFHxPKPieUPA9oeB7QsH3Lv3dYKnig+Gg1b5pf8xNB4SCA0LBAaHggFBwQCg4IBQceDzUavBugO58lWeatyq6TyihhBJKKKGEEqqa7z7UfiC8swpXVcrRBhaK5RcK5hcK5hcK5hcK5hcK5heqyj8NnBbTA1aL/oPR+XJvd4AGTQF3lVCwhIIlFCyhYAkFSyhYb4OiD53/Pp1LAenB3TzTPjwoFBwUCg4KBQeFgoNCwUGh4KBQIUA6iB7Q3dPdWxXto/NCwXmh4LxQcF4oOC8UnBcKzgsF58/vt4seuHrQNFea3/UeDpQCCiVUL1AKKJRQvUApoFBC9QKlgP8eKgWki+jhqZ8CUJht3xSmCiJUKKFgCQVLKFhCwRIK1mOhUsC0KMGk/i5Iypf203eEgu8IBd8RCr4jFHxHKPiOUPAdoeA7JVR6iB6wOt+FSO+t9gsF+4WC/ULBfqFgv1CwXyjYLxTsX4aiQdKeBPLXgELBfqFgv1CwXyjYLxTsFwr2CwX7t/2Hswre7Ut50v707nifUHCfUHCfUHCfUHCfUHCfUHCfUHAfPYgurILQoKm6IPT3lFuokAsvpP1CwX6hYL9QsF8o2C8U7H8MVLcoUApMD6AHpb+P70kLxouFgouFgouFgouFgouFgouFgos/DOoHWymxgWVU6FAAAAAASUVORK5CYII=',
          token: '7f3550d0-7d8e-11ea-a3f7-1f205b8ef737',
          qrPending: false,
        },
        {
          from: new Date('2020-04-13 03:00:00'),
          to: new Date('2020-04-14 02:59:00'),
          fullName: 'castro perez',
          description: '',
          lot: 'DS123467',
          changeLog: '[]',
          file: {},
          userId: statesman.user.id,
          customerId: customer.id,
          dni: '34773913',
          isPermanent: false,
          isCopy: false,
          firstName: 'castro',
          lastName: 'perez',
          patent: '',
          qrCode:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASgAAAEoCAMAAADc2ZwrAAAAHnRFWHRTb2Z0d2FyZQBid2lwLWpzLm1ldGFmbG9vci5jb21Tnbi0AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMA/1uRIrUAAAUBSURBVHic7dYxduNADARR+/6XdsKINF4XMCOZFgsZLQDT+Jvs1/ewvk51/jvtr+ZoP52r9uB7x4NCwUGh4KBQcFAoOCgUHBQKDj4V6vxAVam/fKgJND18NX/ZLxTsFwr2CwX7hYL9QsF+oWC/ULA/PUwPqB6YHpBypDw0P753PCgUHBQKDgoFB4WCg0LBQaHgoFBwEB6aYLqHTN8TSiihhBJKKKGEuivUrvm0Z1c+oWA+oWA+oWA+oWA+oWA+oWA+oWC+ZSh6wK5g9N1pnm7ecr9QcL9QcL9QcL9QcL9QcL9QcL9QcP85OK1dQf/qu33vePBmhwv1ou/2vePBmx0u1Iu+2/eOB292uFAv+m7fOx682eEvh9pV0wfoXPf3lx26WkLBEgqWULCEgiUULKFgfTxUejgFTX+n++iB9L1pv1CwXyjYLxTsFwr2CwX7hYL9QsH+WBSAPpQC0t9Tvunh0xxC0ftxo1CwUSjYKBRsFAo2CgUbnwpVDXQDT/vpAWnvar64LwVLAVf7hRJqFkSoxX6hhJoFEWqx/99A0aB0wTTI7j6ai+a8lFBCCbWSi+a8lFBCCbWSi+a8lFAFFA1GH6QH7to/BWl/CyWUUEIJJZRQQhXvJ7AuAD1otb/67ubC/UIJJdRv+YQSSqjR4d1+oWD/26HoAfTB1D8Nvgugyon3pwYaTCgYTCgYTCgYTCgYTCgYTCgY7OOg0kACoP1pf4Kk/akvvVPuE0ooVELBEgqWULCEgiUUrDYUHXgXwPRdmiPluvxdKJZDKJhDKJhDKJhDKJhDKJhDKJgjN4TF3fnuIdP9aW+Vp8wnlFCohIIlFCyhYAkFSyhYYyj6PQ3UDZ4Oogd365K7/EEooUgJBUsoWELBEgqWULBw7mqwG4zOUSgK/a45oYTaOyeUUHvnhBJq75xQ57nuoi5Q+j29kw5Je7u5y70puFDH3hRcqGNvCi7UsTcFF+rYm4ILdexNwYU69qbgQh170wMUcHpo93vX/vZeoYQSSiihhBJKqOAwDdwNkoJ198fDmvcIBd8TCr4nFHxPKPieUPA9oeB7QsH3Lv3dYKnig+Gg1b5pf8xNB4SCA0LBAaHggFBwQCg4IBQceDzUavBugO58lWeatyq6TyihhBJKKKGEEqqa7z7UfiC8swpXVcrRBhaK5RcK5hcK5hcK5hcK5hcK5heqyj8NnBbTA1aL/oPR+XJvd4AGTQF3lVCwhIIlFCyhYAkFSyhYb4OiD53/Pp1LAenB3TzTPjwoFBwUCg4KBQeFgoNCwUGh4KBQIUA6iB7Q3dPdWxXto/NCwXmh4LxQcF4oOC8UnBcKzgsF58/vt4seuHrQNFea3/UeDpQCCiVUL1AKKJRQvUApoFBC9QKlgP8eKgWki+jhqZ8CUJht3xSmCiJUKKFgCQVLKFhCwRIK1mOhUsC0KMGk/i5Iypf203eEgu8IBd8RCr4jFHxHKPiOUPAdoeA7JVR6iB6wOt+FSO+t9gsF+4WC/ULBfqFgv1CwXyjYLxTsX4aiQdKeBPLXgELBfqFgv1CwXyjYLxTsFwr2CwX7t/2Hswre7Ut50v707nifUHCfUHCfUHCfUHCfUHCfUHCfUHAfPYgurILQoKm6IPT3lFuokAsvpP1CwX6hYL9QsF8o2C8U7H8MVLcoUApMD6AHpb+P70kLxouFgouFgouFgouFgouFgouFgos/DOoHWymxgWVU6FAAAAAASUVORK5CYII=',
          token: '7f3550d0-7d8e-11ea-a3f7-1f205b8ef737',
          qrPending: false,
        },
      ],
    });
    codigoIngreso = await prisma.eventType.create({
      data: {
        code: 'A3',
        title: 'Genera código de ingreso',
        monitor: true,
        addToStatistics: true,
        notifyUser: true,
        notifySecurityChief: true,
        notifySecurityGuard: true,
        additionalNotifications: '',
        autoCancelAfterExpired: true,
        lotFrom: null,
        lotTo: null,
        generateQr: true,
        qrFormat: 2,
        customer: {
          connect: {
            id: customer.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        eventCategory: {
          create: {
            category: {
              create: {
                id: EVENTCATEGORY,
                title: 'ingreso',
              },
            },
            customer: {
              connect: {
                id: customer.id,
              },
            },
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      },
    });

    permanenteMultiple = await prisma.eventType.create({
      data: {
        code: 'A1',
        title: 'Tipo permanente multiple',
        monitor: true,
        addToStatistics: true,
        requiresDni: true,
        isPermanent: true,
        notifyUser: true,
        notifySecurityChief: true,
        notifySecurityGuard: true,
        additionalNotifications: '',
        autoCancelAfterExpired: true,
        allowsMultipleAuthorized: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        eventCategory: {
          create: {
            category: {
              connect: {
                id: EVENTCATEGORY,
              },
            },
            customer: {
              connect: {
                id: customer.id,
              },
            },
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      },
    });

    visitaConDni = await prisma.eventType.create({
      data: {
        code: 'A4',
        title: 'Visita con DNI',
        monitor: true,
        addToStatistics: true,
        requiresDni: true,
        generateQr: true,
        qrFormat: 3,
        notifyUser: true,
        notifySecurityChief: true,
        notifySecurityGuard: true,
        additionalNotifications: '',
        autoCancelAfterExpired: true,
        customer: {
          connect: {
            id: customer.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
        eventCategory: {
          create: {
            category: {
              connect: {
                id: EVENTCATEGORY,
              },
            },
            customer: {
              connect: {
                id: customer.id,
              },
            },
            updatedBy: {
              connect: {
                id: user.id,
              },
            },
          },
        },
      },
    });
    const authorized = await prisma.authorizedUser.create({
      data: {
        id: '629c3a7f-ba14-4647-848a-2c157877b29e',
        firstName: 'raul',
        lastName: 'arias',
        username: '1166480626',
        sendEvents: true,
        lot: 'A6',
        customer: {
          connect: {
            id: customer.id,
          },
        },
        updatedBy: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    finallyUser = await createUserAndToken(prisma, {
      username: '541166480626',
      password: '123456',
      firstName: 'raul',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'raul arias',
      pushId: 'push-id',
      role: Role.user,
      active: true,
      authorizedUser: { connect: { id: authorized.id } },
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    finallyUser2 = await createUserAndToken(prisma, {
      username: '541166480115',
      password: '123456',
      firstName: 'mauricio',
      lastName: 'arias',
      lot: 'A6',
      fullName: 'mauricio arias',
      role: Role.user,
      active: true,
      authorizedUser: {
        create: {
          username: '541166480115',
          firstName: 'mauricio',
          lot: 'A6',
          lastName: 'arias',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      },
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app, prismaGV);
  });

  it('/v1/customers/${customer}/events (final user) with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/events`)
      .set('Authorization', `Bearer ${finallyUser.token}`)
      .query({
        take: 20,
        skip: 0,
        where: JSON.stringify({
          fullName: {
            contains: 'rodrigo perez',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            from: expect.any(String),
            to: expect.any(String),
            fullName: 'rodrigo perez',
            description: '',
            lot: 'DS123467',
            changeLog: '[]',
            observations: null,
            eventStateId: null,
            statesmanId: null,
            authorizedUserId: null,
            eventTypeId: null,
            trialPeriod: false,
            file: {},
            userId: expect.any(String),
            dni: '34773913',
            isPermanent: false,
            isCopy: false,
            firstName: 'rodrigo',
            lastName: 'perez',
            patent: '',
            monitorId: null,
            reservationId: null,
            isDelivery: false,
            qrCode:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASgAAAEoCAMAAADc2ZwrAAAAHnRFWHRTb2Z0d2FyZQBid2lwLWpzLm1ldGFmbG9vci5jb21Tnbi0AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMA/1uRIrUAAAUBSURBVHic7dYxduNADARR+/6XdsKINF4XMCOZFgsZLQDT+Jvs1/ewvk51/jvtr+ZoP52r9uB7x4NCwUGh4KBQcFAoOCgUHBQKDj4V6vxAVam/fKgJND18NX/ZLxTsFwr2CwX7hYL9QsF+oWC/ULA/PUwPqB6YHpBypDw0P753PCgUHBQKDgoFB4WCg0LBQaHgoFBwEB6aYLqHTN8TSiihhBJKKKGEuivUrvm0Z1c+oWA+oWA+oWA+oWA+oWA+oWA+oWC+ZSh6wK5g9N1pnm7ecr9QcL9QcL9QcL9QcL9QcL9QcL9QcP85OK1dQf/qu33vePBmhwv1ou/2vePBmx0u1Iu+2/eOB292uFAv+m7fOx682eEvh9pV0wfoXPf3lx26WkLBEgqWULCEgiUULKFgfTxUejgFTX+n++iB9L1pv1CwXyjYLxTsFwr2CwX7hYL9QsH+WBSAPpQC0t9Tvunh0xxC0ftxo1CwUSjYKBRsFAo2CgUbnwpVDXQDT/vpAWnvar64LwVLAVf7hRJqFkSoxX6hhJoFEWqx/99A0aB0wTTI7j6ai+a8lFBCCbWSi+a8lFBCCbWSi+a8lFAFFA1GH6QH7to/BWl/CyWUUEIJJZRQQhXvJ7AuAD1otb/67ubC/UIJJdRv+YQSSqjR4d1+oWD/26HoAfTB1D8Nvgugyon3pwYaTCgYTCgYTCgYTCgYTCgYTCgY7OOg0kACoP1pf4Kk/akvvVPuE0ooVELBEgqWULCEgiUUrDYUHXgXwPRdmiPluvxdKJZDKJhDKJhDKJhDKJhDKJhDKJgjN4TF3fnuIdP9aW+Vp8wnlFCohIIlFCyhYAkFSyhYYyj6PQ3UDZ4Oogd365K7/EEooUgJBUsoWELBEgqWULBw7mqwG4zOUSgK/a45oYTaOyeUUHvnhBJq75xQ57nuoi5Q+j29kw5Je7u5y70puFDH3hRcqGNvCi7UsTcFF+rYm4ILdexNwYU69qbgQh170wMUcHpo93vX/vZeoYQSSiihhBJKqOAwDdwNkoJ198fDmvcIBd8TCr4nFHxPKPieUPA9oeB7QsH3Lv3dYKnig+Gg1b5pf8xNB4SCA0LBAaHggFBwQCg4IBQceDzUavBugO58lWeatyq6TyihhBJKKKGEEqqa7z7UfiC8swpXVcrRBhaK5RcK5hcK5hcK5hcK5hcK5heqyj8NnBbTA1aL/oPR+XJvd4AGTQF3lVCwhIIlFCyhYAkFSyhYb4OiD53/Pp1LAenB3TzTPjwoFBwUCg4KBQeFgoNCwUGh4KBQIUA6iB7Q3dPdWxXto/NCwXmh4LxQcF4oOC8UnBcKzgsF58/vt4seuHrQNFea3/UeDpQCCiVUL1AKKJRQvUApoFBC9QKlgP8eKgWki+jhqZ8CUJht3xSmCiJUKKFgCQVLKFhCwRIK1mOhUsC0KMGk/i5Iypf203eEgu8IBd8RCr4jFHxHKPiOUPAdoeA7JVR6iB6wOt+FSO+t9gsF+4WC/ULBfqFgv1CwXyjYLxTsX4aiQdKeBPLXgELBfqFgv1CwXyjYLxTsFwr2CwX7t/2Hswre7Ut50v707nifUHCfUHCfUHCfUHCfUHCfUHCfUHAfPYgurILQoKm6IPT3lFuokAsvpP1CwX6hYL9QsF8o2C8U7H8MVLcoUApMD6AHpb+P70kLxouFgouFgouFgouFgouFgouFgos/DOoHWymxgWVU6FAAAAAASUVORK5CYII=',
            token: '7f3550d0-7d8e-11ea-a3f7-1f205b8ef737',
            qrPending: false,
            id: expect.any(String),
            createdAt: expect.any(String),
            externalId: null,
            updatedAt: expect.any(String),
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

  it('/v1/customers/${customer}/events (statesman) with filters (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/events`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .query({
        take: 20,
        skip: 0,
        where: JSON.stringify({
          fullName: {
            contains: 'rodrigo perez',
          },
        }),
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        expect(res.body.results).toStrictEqual([
          {
            from: expect.any(String),
            to: expect.any(String),
            fullName: 'rodrigo perez',
            description: '',
            lot: 'DS123467',
            changeLog: '[]',
            observations: null,
            trialPeriod: false,
            eventStateId: null,
            isDelivery: false,
            statesmanId: null,
            authorizedUserId: null,
            eventTypeId: null,
            file: {},
            userId: expect.any(String),
            dni: '34773913',
            isPermanent: false,
            isCopy: false,
            firstName: 'rodrigo',
            lastName: 'perez',
            patent: '',
            monitorId: null,
            reservationId: null,
            qrCode:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASgAAAEoCAMAAADc2ZwrAAAAHnRFWHRTb2Z0d2FyZQBid2lwLWpzLm1ldGFmbG9vci5jb21Tnbi0AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMA/1uRIrUAAAUBSURBVHic7dYxduNADARR+/6XdsKINF4XMCOZFgsZLQDT+Jvs1/ewvk51/jvtr+ZoP52r9uB7x4NCwUGh4KBQcFAoOCgUHBQKDj4V6vxAVam/fKgJND18NX/ZLxTsFwr2CwX7hYL9QsF+oWC/ULA/PUwPqB6YHpBypDw0P753PCgUHBQKDgoFB4WCg0LBQaHgoFBwEB6aYLqHTN8TSiihhBJKKKGEuivUrvm0Z1c+oWA+oWA+oWA+oWA+oWA+oWA+oWC+ZSh6wK5g9N1pnm7ecr9QcL9QcL9QcL9QcL9QcL9QcL9QcP85OK1dQf/qu33vePBmhwv1ou/2vePBmx0u1Iu+2/eOB292uFAv+m7fOx682eEvh9pV0wfoXPf3lx26WkLBEgqWULCEgiUULKFgfTxUejgFTX+n++iB9L1pv1CwXyjYLxTsFwr2CwX7hYL9QsH+WBSAPpQC0t9Tvunh0xxC0ftxo1CwUSjYKBRsFAo2CgUbnwpVDXQDT/vpAWnvar64LwVLAVf7hRJqFkSoxX6hhJoFEWqx/99A0aB0wTTI7j6ai+a8lFBCCbWSi+a8lFBCCbWSi+a8lFAFFA1GH6QH7to/BWl/CyWUUEIJJZRQQhXvJ7AuAD1otb/67ubC/UIJJdRv+YQSSqjR4d1+oWD/26HoAfTB1D8Nvgugyon3pwYaTCgYTCgYTCgYTCgYTCgYTCgY7OOg0kACoP1pf4Kk/akvvVPuE0ooVELBEgqWULCEgiUUrDYUHXgXwPRdmiPluvxdKJZDKJhDKJhDKJhDKJhDKJhDKJgjN4TF3fnuIdP9aW+Vp8wnlFCohIIlFCyhYAkFSyhYYyj6PQ3UDZ4Oogd365K7/EEooUgJBUsoWELBEgqWULBw7mqwG4zOUSgK/a45oYTaOyeUUHvnhBJq75xQ57nuoi5Q+j29kw5Je7u5y70puFDH3hRcqGNvCi7UsTcFF+rYm4ILdexNwYU69qbgQh170wMUcHpo93vX/vZeoYQSSiihhBJKqOAwDdwNkoJ198fDmvcIBd8TCr4nFHxPKPieUPA9oeB7QsH3Lv3dYKnig+Gg1b5pf8xNB4SCA0LBAaHggFBwQCg4IBQceDzUavBugO58lWeatyq6TyihhBJKKKGEEqqa7z7UfiC8swpXVcrRBhaK5RcK5hcK5hcK5hcK5hcK5heqyj8NnBbTA1aL/oPR+XJvd4AGTQF3lVCwhIIlFCyhYAkFSyhYb4OiD53/Pp1LAenB3TzTPjwoFBwUCg4KBQeFgoNCwUGh4KBQIUA6iB7Q3dPdWxXto/NCwXmh4LxQcF4oOC8UnBcKzgsF58/vt4seuHrQNFea3/UeDpQCCiVUL1AKKJRQvUApoFBC9QKlgP8eKgWki+jhqZ8CUJht3xSmCiJUKKFgCQVLKFhCwRIK1mOhUsC0KMGk/i5Iypf203eEgu8IBd8RCr4jFHxHKPiOUPAdoeA7JVR6iB6wOt+FSO+t9gsF+4WC/ULBfqFgv1CwXyjYLxTsX4aiQdKeBPLXgELBfqFgv1CwXyjYLxTsFwr2CwX7t/2Hswre7Ut50v707nifUHCfUHCfUHCfUHCfUHCfUHCfUHAfPYgurILQoKm6IPT3lFuokAsvpP1CwX6hYL9QsF8o2C8U7H8MVLcoUApMD6AHpb+P70kLxouFgouFgouFgouFgouFgouFgos/DOoHWymxgWVU6FAAAAAASUVORK5CYII=',
            token: '7f3550d0-7d8e-11ea-a3f7-1f205b8ef737',
            qrPending: false,
            id: expect.any(String),
            createdAt: expect.any(String),
            externalId: null,
            updatedAt: expect.any(String),
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
    ['castro perez', 0],
    ['rodrigo perez', 1],
  ])(
    '/v1/customers/${customer}/events (statesman) allows pagination (GET)',
    async (a, b) => {
      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .query({
          take: 1,
          skip: b,
          orderBy: JSON.stringify({
            fullName: 'asc',
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results[0]).toMatchObject({
            fullName: a,
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

  it('/v1/customers/${customer}/events (statesman) (GET)', async () => {
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/events`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.results).toBeInstanceOf(Array);
        res.body.results.forEach((item: Lot) => {
          expect(item).toHaveProperty('from');
          expect(item).toHaveProperty('to');
          expect(item).toHaveProperty('fullName');
          expect(item).toHaveProperty('description');
          expect(item).toHaveProperty('lot');
          expect(item).toHaveProperty('changeLog');
          expect(item).toHaveProperty('observations');
          expect(item).toHaveProperty('eventStateId');
          expect(item).toHaveProperty('statesmanId');
          expect(item).toHaveProperty('authorizedUserId');
          expect(item).toHaveProperty('eventTypeId');
          expect(item).toHaveProperty('file');
          expect(item).toHaveProperty('userId');
          expect(item).toHaveProperty('dni');
          expect(item).toHaveProperty('isPermanent');
          expect(item).toHaveProperty('isCopy');
          expect(item).toHaveProperty('trialPeriod');
          expect(item).toHaveProperty('firstName');
          expect(item).toHaveProperty('lastName');
          expect(item).toHaveProperty('patent');
          expect(item).toHaveProperty('monitorId');
          expect(item).toHaveProperty('qrCode');
          expect(item).toHaveProperty('token');
          expect(item).toHaveProperty('qrPending');
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('createdAt');
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

  it('/v1/customers/${customer}/events/%{id} (statesman) (GET)', async () => {
    const event = await prisma.event.create({
      data: {
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        fullName: 'alberto eduardo perez',
        description: '',
        lot: 'DS12351',
        changeLog: '[]',
        userId: user.id,
        customerId: customer.id,
        file: {},
        dni: '34773913',
        isPermanent: false,
        isCopy: false,
        firstName: 'pepito',
        lastName: 'perez',
        isDelivery: false,
        patent: '',
        qrCode:
          'data:image/png;base64,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',
        token: '1b059be0-84de-11ea-aec6-2b8255282cbf',
        qrPending: false,
      },
    });
    return await request(app.getHttpServer())
      .get(`/v1/customers/${customer.id}/events/${event.id}`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toStrictEqual({
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          statesmanId: null,
          reservationId: null,
          observations: null,
          monitorId: null,
          externalId: null,
          eventTypeId: null,
          eventStateId: null,
          authorizedUserId: null,
          from: expect.any(String),
          to: expect.any(String),
          fullName: 'alberto eduardo perez',
          description: '',
          lot: 'DS12351',
          trialPeriod: false,
          isDelivery: false,
          changeLog: '[]',
          userId: user.id,
          customerId: customer.id,
          file: {},
          dni: '34773913',
          isPermanent: false,
          isCopy: false,
          firstName: 'pepito',
          lastName: 'perez',
          patent: '',
          qrCode:
            'data:image/png;base64,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',
          token: '1b059be0-84de-11ea-aec6-2b8255282cbf',
          qrPending: false,
        });
      });
  });

  it('/v1/customers/${customer}/events/${id} (GET) 403 forbidden', async () => {
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
        `/v1/customers/${customer2?.id}/events/768c9482-bd38-480c-a213-48e97edfb2ac`,
      )
      .set('Authorization', `Bearer ${userMonitoring.token}`)
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

  it('/v1/customers/${customer}/events/${id} (GET) 403 not found', async () => {
    return await request(app.getHttpServer())
      .get(
        `/v1/customers/${customer?.id}/events/768c9482-bd38-480c-a213-48e97edfb2ac`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .expect(404)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 404,
          error: 'Not Found',
          message: errorCodes.EVENT_NOT_FOUND,
        });
      });
  });

  it('/v1/customers/${customer}/events/${id}/change-state', async () => {
    const event = await prisma.event.create({
      data: {
        from: new Date('2020-04-22 03:00:00'),
        to: new Date('2020-04-23 02:59:00'),
        fullName: 'mauricio gallego',
        description: '',
        lot: 'DS12351',
        changeLog: '[]',
        userId: finallyUser.user.id,
        customerId: customer.id,
        file: {},
        dni: '12345678910',
        isPermanent: false,
        isCopy: false,
        eventStateId: EMITIDO,
        eventTypeId: codigoIngreso.id,
        firstName: 'mauricio',
        lastName: 'gallego',
        patent: '',
        qrCode:
          'data:image/png;base64,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',
        token: '1b059be0-84de-11ea-aec6-2b8255282cbf',
        qrPending: false,
      },
    });
    await request(app.getHttpServer())
      .patch(`/v1/customers/${customer?.id}/events/${event.id}/change-state`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        eventStateId: ATENDIDO,
        observations: 'el señor cambio eso yo no se por que',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          eventStateId: ATENDIDO,
          observations: 'el señor cambio eso yo no se por que',
        });
        expect(JSON.parse(res.body.changeLog)).toStrictEqual([
          {
            user: {
              id: statesman.user.id,
              firstName: statesman.user.firstName,
              lastName: statesman.user.lastName,
            },
            state: { id: ATENDIDO, name: 'Atendido' },
            observations: 'el señor cambio eso yo no se por que',
            updatedAt: expect.any(String),
          },
        ]);
      });

    const notificationCreated = await prisma.notification.findFirst({
      where: {
        eventId: event.id,
      },
    });

    expect(notificationCreated).toBeInstanceOf(Object);
    expect(notificationCreated).toMatchObject({
      eventId: event.id,
      userId: statesman.user.id,
    });
    expect(firebase.updateEventFirebase).toBeCalledTimes(1);
  });

  it('/v1/customers/${customer}/events/${id}/change-state (GET) 403 not found', async () => {
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer?.id}/events/768c9482-bd38-480c-a213-48e97edfb2ac/change-state`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        eventStateId: ATENDIDO,
        observations: 'el señor cambio eso yo no se por que',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.EVENT_NOT_FOUND,
        });
      });
  });

  it('/v1/customers/${customer}/events/${id}/change-state (GET) 403 not found', async () => {
    const event = await prisma.event.findFirst({
      where: {
        fullName: 'mauricio gallego',
      },
    });
    return await request(app.getHttpServer())
      .patch(`/v1/customers/${customer?.id}/events/${event?.id}/change-state`)
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        eventStateId: '768c9482-bd38-480c-a213-48e97edfb2ac',
        observations: 'el señor cambio eso yo no se por que',
      })
      .expect(422)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toMatchObject({
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: errorCodes.EVENT_STATE_NOT_FOUND,
        });
      });
  });

  it('v1/customers/${id}/events/${id}/change-state (GET) 403 forbidden', async () => {
    return await request(app.getHttpServer())
      .patch(
        `/v1/customers/${customer2?.id}/events/768c9482-bd38-480c-a213-48e97edfb2ac/change-state`,
      )
      .set('Authorization', `Bearer ${statesman.token}`)
      .send({
        eventStateId: '768c9482-bd38-480c-a213-48e97edfb2ac',
        observations: 'el señor cambio eso yo no se por que',
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

  describe('/v1/customer/${id}/events (POST)', () => {
    beforeAll(() => {
      jest.spyOn(httpService.axiosRef, 'request').mockResolvedValue(true);
    });

    it('/v1/customer/${id}/events (statesman) (POST) only statesmanId', async () => {
      await prisma.eventType.update({
        data: {
          isPermanent: false,
          attachment: false,
        },
        where: {
          id: VISITAS,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toMatchObject({
              created: 1,
              from: expect.any(String),
              to: expect.any(String),
              qrCode: expect.any(String),
              qrPending: false,
              token: expect.any(String),
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
              utcOffset: -180,
              statesmanId: statesman.user.id,
              eventTypeId: VISITAS,
            });
          });
        });
    });

    it('/v1/customer/${id}/events (monitoring) (POST) only monitoring', async () => {
      await prisma.eventType.update({
        data: {
          isPermanent: false,
          attachment: false,
        },
        where: {
          id: VISITAS,
        },
      });

      const authorized = await prisma.authorizedUser.create({
        data: {
          firstName: 'camilo',
          lastName: 'gaallego',
          username: '112311750',
          sendEvents: true,
          lot: 'A6',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${monitoring.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          monitorId: monitoring.user.id,
          authorizedUserId: authorized.id,
          eventTypeId: VISITAS,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            created: 2,
            from: expect.any(String),
            to: expect.any(String),
            qrPending: false,
            authorizedUserId: authorized.id,
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            monitorId: monitoring.user.id,
            eventTypeId: VISITAS,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) with many authorized', async () => {
      await prisma.eventType.update({
        data: {
          isPermanent: true,
          attachment: false,
        },
        where: {
          id: VISITAS,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toMatchObject({
              created: 2,
              from: expect.any(String),
              to: expect.any(String),
              qrCode: expect.any(String),
              qrPending: false,
              token: expect.any(String),
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
              file: {
                name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
                url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
                thumbnailUrl:
                  'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
              },
              utcOffset: -180,
              authorizedUserId: null,
              statesmanId: statesman.user.id,
              eventTypeId: VISITAS,
              isCopy: false,
            });
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 400 DATES_ARE_INCORRECT', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-04T02:59:59.539Z'),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: errorCodes.DATES_ARE_INCORRECT,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 422 EVENT_TYPE_NOT_FOUND', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman.user.id,
          eventTypeId: '119811eb-f82f-4eba-8a24-4166be8eceaf',
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-04T02:59:59.539Z'),
        })
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.EVENT_TYPE_NOT_FOUND,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 422 AUTHORIZED_USER_NOT_FOUND', async () => {
      await prisma.eventType.update({
        data: {
          description: false,
          attachment: true,
        },
        where: {
          id: VISITAS,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          utcOffset: -180,
          authorizedUserId: '119811eb-f82f-4eba-8a24-4166be8eceaf',
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-14T02:59:59.539Z'),
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

    it('/v1/customer/${id}/events (statesman) (POST) 400 DESCRIPTION_NOT_ADDED', async () => {
      await prisma.eventType.update({
        data: {
          description: true,
        },
        where: {
          id: VISITAS,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-04T02:59:59.539Z'),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: errorCodes.DESCRIPTION_NOT_ADDED,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 400 FILE_NOT_ADDED', async () => {
      await prisma.eventType.update({
        data: {
          description: false,
          attachment: true,
        },
        where: {
          id: VISITAS,
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-04T02:59:59.539Z'),
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: errorCodes.FILE_NOT_ADDED,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 500 CUSTOMER_INTEGRATION_NOT_RELATED', async () => {
      const statesman3 = await createUserAndToken(prisma, {
        username: 'mauro@mail.com',
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
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer2.id}/events`)
        .set('Authorization', `Bearer ${statesman3.token}`)
        .send({
          utcOffset: -180,
          authorizedUserId: null,
          statesmanId: statesman3.user.id,
          eventTypeId: VISITAS,
          isCopy: false,
          authorized: [
            {
              name: 'Juan Perez',
              dni: '12334341',
            },
            {
              name: 'Pedro Lopez',
              dni: '95363401',
            },
          ],
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-04T02:59:59.539Z'),
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 500,
            error: 'Internal Server Error',
            message: errorCodes.CUSTOMER_RELATIONS_NOT_EXIST,
          });
        });
    });

    it('/v1/customer/${id}/events (statesman) (POST) 422 CANNOT_SEND_EVENTS', async () => {
      await prisma.authorizedUser.update({
        data: {
          sendEvents: false,
        },
        where: {
          id: '629c3a7f-ba14-4647-848a-2c157877b29e',
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from: new Date('2022-08-11T03:00:00.000Z'),
          to: new Date('2022-08-12T02:59:00.000Z'),
          firstName: 'Juan',
          lastName: 'Perez',
          dni: '123123123',
          patent: 'AB123CD',
          description: '',
          authorized: [],
          eventTypeId: codigoIngreso.id,
          utcOffset: -180,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: errorCodes.CANNOT_SEND_EVENTS,
          });
        });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) logged in app', async () => {
      const from = new Date('2023-02-07T03:00:00.000Z');
      const to = new Date('2023-02-08T02:59:00.000Z');

      await prisma.customerLot.create({
        data: {
          customerId: customer.id,
          lot: 'A6',
          icmUid: '9d0b598d-1ede-42c2-9412-4e364b830ee1',
        },
      });
      await prisma.authorizedUser.update({
        data: {
          sendEvents: true,
        },
        where: {
          id: '629c3a7f-ba14-4647-848a-2c157877b29e',
        },
      });
      await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from,
          to,
          firstName: 'Juan',
          lastName: 'Perez',
          dni: '9536340111',
          patent: 'AB123CD',
          description: '',
          authorized: [],
          eventTypeId: codigoIngreso.id,
          utcOffset: -180,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect((res) => {
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toMatchObject({
              created: 1,
              from: expect.any(String),
              to: expect.any(String),
              qrCode: expect.any(String),
              qrPending: false,
              token: expect.any(String),
            });
          });
        });

      await delay(2000);
      const eventCreated = await prisma.event.findFirst({
        where: {
          dni: '9536340111',
        },
      });

      expect(eventCreated).toMatchObject({
        from: new Date(from.getTime() + 3 * 1000 * 60 * 60),
        isDelivery: true,
      });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) logged in app without dni and patent', async () => {
      const authorized = await prisma.authorizedUser.create({
        data: {
          firstName: 'raul',
          lastName: 'arias',
          username: '1166480625',
          sendEvents: true,
          lot: 'A6',
          customer: {
            connect: {
              id: customer.id,
            },
          },
          updatedBy: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const finallyUser = await createUserAndToken(prisma, {
        username: '541166480625',
        password: '123456',
        firstName: 'raul',
        lastName: 'arias',
        lot: 'A6',
        fullName: 'raul arias',
        role: Role.user,
        active: true,
        authorizedUser: { connect: { id: authorized.id } },
        customer: {
          connect: {
            id: customer.id,
          },
        },
      });

      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from: new Date('2022-08-11T03:00:00.000Z'),
          to: new Date('2022-08-12T02:59:00.000Z'),
          firstName: 'Juan',
          lastName: 'Perez',
          description: '',
          authorized: [],
          eventTypeId: codigoIngreso.id,
          utcOffset: -180,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            created: 1,
            from: expect.any(String),
            to: expect.any(String),
            qrPending: true,
            token: expect.any(String),
          });
        });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) 400 DUPLICATE_PERMANENT_EVENT', async () => {
      const from = new Date('2023-02-07T03:00:00.000Z');
      const to = new Date('2023-02-08T02:59:00.000Z');
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from,
          to,
          firstName: 'Juan',
          lastName: 'Perez',
          dni: '9536340111',
          patent: 'AB123CD',
          description: '',
          authorized: [],
          eventTypeId: codigoIngreso.id,
          utcOffset: -180,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
            message: errorCodes.DUPLICATE_PERMANENT_EVENT,
          });
        });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) many events by users', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from: new Date('2022-08-11T03:00:00.000Z'),
          to: new Date('2022-08-12T02:59:00.000Z'),
          firstName: '',
          lastName: '',
          dni: '',
          patent: '',
          description: '',
          authorized: [
            {
              name: 'JUAN PEREZ',
              dni: '11222555',
            },
            {
              name: 'PEDRO LOPEZ',
              dni: '22444333',
            },
            {
              name: 'MARIA GOMEZ',
              dni: '33222111',
            },
          ],
          eventTypeId: permanenteMultiple.id,
          utcOffset: -180,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            created: 3,
            from: expect.any(String),
            to: expect.any(String),
            qrPending: false,
            firstName: '',
            lastName: '',
            dni: '11222555',
            patent: '',
            description: '',
            eventTypeId: permanenteMultiple.id,
          });
        });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) many events by days', async () => {
      const from = new Date('2023-01-10T11:00:00.000Z');
      const to = new Date('2023-01-12T12:59:59.000Z');

      await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from,
          to,
          firstName: 'JUAN',
          lastName: 'PEREZ',
          dni: '11222335',
          patent: '',
          description: 'many events by days',
          eventTypeId: visitaConDni.id,
          utcOffset: -180,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            created: 3,
            from: expect.any(String),
            to: expect.any(String),
            qrCode: expect.any(String),
            qrPending: false,
            token: expect.any(String),
            firstName: 'JUAN',
            lastName: 'PEREZ',
            dni: '11222335',
            patent: '',
            description: 'many events by days',
            eventTypeId: visitaConDni.id,
          });
        });

      const eventsCreated = await prisma.event.findMany({
        where: {
          description: 'many events by days',
        },
        orderBy: {
          from: 'asc',
        },
      });

      expect(eventsCreated[0]).toMatchObject({
        from: new Date(from.getTime() + 3 * 1000 * 60 * 60),
      });
      expect(eventsCreated[eventsCreated.length - 1]).toMatchObject({
        to: new Date(to.getTime() + 3 * 1000 * 60 * 60),
      });
    });

    it('/v1/customer/${id}/events (finalUser) (POST) proof utc', async () => {
      const from = new Date('2023-01-25T11:00:00.000Z');
      const to = new Date('2023-01-29T12:59:59.000Z');

      await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          from,
          to,
          firstName: 'JUAN',
          lastName: 'PEREZ',
          dni: '11222335',
          patent: '',
          description: 'time offset test',
          eventTypeId: visitaConDni.id,
          utcOffset: -120,
        })
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toMatchObject({
            created: 5,
            from: expect.any(String),
            to: expect.any(String),
            qrCode: expect.any(String),
            qrPending: false,
            token: expect.any(String),
            firstName: 'JUAN',
            lastName: 'PEREZ',
            dni: '11222335',
            patent: '',
            description: 'time offset test',
            eventTypeId: visitaConDni.id,
          });
        });

      const eventsCreated = await prisma.event.findMany({
        where: {
          description: 'time offset test',
        },
        orderBy: {
          from: 'asc',
        },
      });

      expect(eventsCreated[0]).toMatchObject({
        from: new Date(from.getTime() + 2 * 1000 * 60 * 60),
      });
      expect(eventsCreated[eventsCreated.length - 1]).toMatchObject({
        to: new Date(to.getTime() + 2 * 1000 * 60 * 60),
      });
    });

    it('see if girovision database is fill it', async () => {
      await delay(2000);
      const created = await prismaGV.invitados.count();
      expect(created).toBe(15);
    });
  });

  describe('/v1/customer/events/token/${token} (GET)', () => {
    it('/v1/customer/events/token/${token} (GET)', async () => {
      const lot = await prisma.lot.create({
        data: {
          lot: 'AA2',
          latitude: '43.75611123',
          longitude: '2.95123432',
          customerId: customer.id,
          updatedById: statesman.user.id,
        },
      });
      const event = await prisma.event.create({
        data: {
          token: 'generate-token-random',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          lot: 'AA2',
          customerId: customer.id,
          userId: finallyUser.user.id,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/events/token/generate-token-random`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            eventId: event.id,
            eventType: {
              id: VISITAS,
              title: 'VISITAS',
            },
            eventState: {
              id: EMITIDO,
              name: 'Emitido',
            },
            qrCode: event.qrCode,
            qrPending: event.qrPending,
            patent: event.patent,
            message:
              'raul arias te envió esta invitación a divercity para acceder el día 05/08/2022',
            lot: {
              ...lot,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/customer/events/token/${token} (GET) event not exist', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/events/token/generate-token-sdfsdf`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({});
        });
    });

    it('/v1/customer/events/token/${token} (GET) event without user', async () => {
      await prisma.event.create({
        data: {
          customerId: customer.id,
          token: 'generate-token-222',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          lot: 'AA2',
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/events/token/generate-token-222`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({});
        });
    });

    it('/v1/customer/events/token/${token} (GET) event without lot', async () => {
      await prisma.event.create({
        data: {
          customerId: customer.id,
          token: 'generate-token-333',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          userId: finallyUser.user.id,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .get(`/v1/customers/events/token/generate-token-333`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toStrictEqual({});
        });
    });
  });

  describe('/v1/customer/events/qr-code (POST)', () => {
    it('/v1/customer/events/qr-code (POST) without patent', async () => {
      const message =
        'raul arias te envió esta invitación a divercity para acceder el día 05/08/2022';
      const token = 'gene-token-123';

      const lot = await prisma.lot.create({
        data: {
          lot: 'A5',
          latitude: '43.75611123',
          longitude: '2.95123432',
          customerId: customer.id,
          updatedById: statesman.user.id,
        },
      });
      await prisma.event.create({
        data: {
          token,
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          firstName: 'raul',
          lastName: 'arias',
          lot: 'A5',
          customerId: customer.id,
          userId: finallyUser.user.id,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/events/qr-code`)
        .send({
          dni: '95363402',
          token,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            eventStateId: EMITIDO,
            qrCode: expect.any(String),
            qrPending: false,
            message,
            lot: {
              ...lot,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/customer/events/qr-code (POST)', async () => {
      const message =
        'raul arias te envió esta invitación a divercity para acceder el día 05/08/2022';
      const token = 'generate-token-4444';

      const lot = await prisma.lot.create({
        data: {
          lot: 'A6',
          latitude: '43.75611123',
          longitude: '2.95123432',
          customerId: customer.id,
          updatedById: statesman.user.id,
        },
      });
      await prisma.event.create({
        data: {
          token,
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          firstName: 'raul',
          lastName: 'arias',
          lot: 'A6',
          customerId: customer.id,
          userId: finallyUser.user.id,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/events/qr-code`)
        .send({
          dni: '95363401',
          patent: 'AA979KD',
          token,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            eventStateId: EMITIDO,
            qrCode: expect.any(String),
            qrPending: false,
            message,
            lot: {
              ...lot,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          });
        });
    });

    it('/v1/customer/events/qr-code (POST) invalid token', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/events/qr-code`)
        .send({
          dni: '95363401',
          patent: 'AA979KD',
          token: 'generate-token-12322',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({});
        });
    });

    it('/v1/customer/events/qr-code (POST) requirement fields', async () => {
      return await request(app.getHttpServer())
        .post(`/v1/customers/events/qr-code`)
        .send({
          patent: 'AA979KD',
          token: 'generate-token-4444',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Bad Request',
            message: ['dni should not be empty', 'dni must be a string'],
            statusCode: 400,
          });
        });
    });

    it('/v1/customer/events/qr-code (POST) without lot', async () => {
      await prisma.event.create({
        data: {
          token: 'generate-token-123',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          statesmanId: statesman.user.id,
          changeLog: '',
          eventTypeId: VISITAS,
          eventStateId: EMITIDO,
          firstName: 'raul',
          lastName: 'arias',
          lot: 'A61111',
          customerId: customer.id,
          userId: finallyUser.user.id,
          from: new Date('2022-08-05T03:00:00.539Z'),
          to: new Date('2022-08-06T04:59:59.539Z'),
        },
      });
      return await request(app.getHttpServer())
        .post(`/v1/customers/events/qr-code`)
        .send({
          dni: '95363401',
          patent: 'AA979KD',
          token: 'generate-token-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            eventStateId: EMITIDO,
            lot: null,
            message:
              'raul arias te envió esta invitación a divercity para acceder el día 05/08/2022',
            qrCode: expect.any(String),
            qrPending: false,
          });
        });
    });
  });

  describe('/v1/customer/${id}/events/${id}/cancel (PATCH)', () => {
    it('/v1/customer/${id}/events/${id}/cancel (PATCH)', async () => {
      const { body: event } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          eventTypeId: VISITAS,
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          from: new Date('2022-09-05T03:00:00.539Z'),
          to: new Date('2022-09-06T04:59:59.539Z'),
        });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            from: expect.any(String),
            to: expect.any(String),
            qrCode: null,
            qrPending: true,
            token: expect.any(String),
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            statesmanId: null,
            reservationId: null,
            eventTypeId: VISITAS,
            eventStateId: CANCELLED,
            updatedAt: expect.any(String),
            trialPeriod: false,
            userId: finallyUser.user.id,
            fullName: '',
            id: expect.any(String),
            isCopy: false,
            isPermanent: true,
            lastName: '',
            lot: 'A6',
            monitorId: null,
            observations: null,
            patent: '',
            dni: null,
            externalId: expect.any(String),
            isDelivery: false,
            authorizedUserId: null,
            changeLog: expect.any(String),
            createdAt: expect.any(String),
            customerId: customer.id,
            file: {
              name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
              thumbnailUrl:
                'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
              url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            },
            firstName: '',
          });
          expect(JSON.parse(res.body.changeLog)).toStrictEqual([
            {
              user: {
                id: finallyUser.user.id,
                firstName: finallyUser.user.firstName,
                lastName: finallyUser.user.lastName,
              },
              state: {
                id: expect.any(String),
                name: 'Usuario canceló',
              },
              observations: 'Cancelado por el usuario',
              updatedAt: expect.any(String),
            },
          ]);
        });
    });

    it('/v1/customer/${id}/events/${id}/cancel (PATCH) (STATESMAN)', async () => {
      const { body: event } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          eventTypeId: VISITAS,
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          from: new Date('2022-09-05T03:00:00.539Z'),
          to: new Date('2022-09-06T04:59:59.539Z'),
        });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            from: expect.any(String),
            to: expect.any(String),
            qrCode: null,
            qrPending: true,
            token: expect.any(String),
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            statesmanId: null,
            reservationId: null,
            eventTypeId: VISITAS,
            eventStateId: CANCELLED,
            updatedAt: expect.any(String),
            userId: finallyUser.user.id,
            fullName: '',
            id: expect.any(String),
            isCopy: false,
            isPermanent: true,
            trialPeriod: false,
            lastName: '',
            lot: 'A6',
            monitorId: null,
            observations: null,
            patent: '',
            dni: null,
            externalId: expect.any(String),
            isDelivery: false,
            authorizedUserId: null,
            changeLog: expect.any(String),
            createdAt: expect.any(String),
            customerId: customer.id,
            file: {
              name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
              thumbnailUrl:
                'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
              url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            },
            firstName: '',
          });
          expect(JSON.parse(res.body.changeLog)).toStrictEqual([
            {
              user: {
                id: finallyUser.user.id,
                firstName: finallyUser.user.firstName,
                lastName: finallyUser.user.lastName,
              },
              state: {
                id: expect.any(String),
                name: 'Usuario canceló',
              },
              observations: 'Cancelado por el usuario',
              updatedAt: expect.any(String),
            },
          ]);
        });
    });

    it('/v1/customer/${id}/events/${id}/cancel (PATCH) (EVENT NOT OWNER)', async () => {
      const { body: event } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          eventTypeId: VISITAS,
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          from: new Date('2022-09-05T03:00:00.539Z'),
          to: new Date('2022-09-06T04:59:59.539Z'),
        });

      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${finallyUser2.token}`)
        .send()
        .expect(422)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Unprocessable Entity',
            message: 'EVENT_NOT_OWNER',
            statusCode: 422,
          });
        });
    });

    it('/v1/customer/${id}/events/${id}/cancel (PATCH) (EVENT NOT FOUND)', async () => {
      return await request(app.getHttpServer())
        .patch(`/v1/customers/${customer.id}/events/${customer.id}/cancel`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send()
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'EVENT_NOT_FOUND',
            statusCode: 404,
          });
        });
    });
  });

  describe('/v1/customer/${id}/events/${id}/attend (GET)', () => {
    it('/v1/customer/${id}/events/${id}/attend (GET)', async () => {
      const { body: event } = await request(app.getHttpServer())
        .post(`/v1/customers/${customer.id}/events`)
        .set('Authorization', `Bearer ${finallyUser.token}`)
        .send({
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          utcOffset: -180,
          eventTypeId: VISITAS,
          file: {
            name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
            thumbnailUrl:
              'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          },
          from: new Date('2022-09-05T03:00:00.539Z'),
          to: new Date('2022-09-06T04:59:59.539Z'),
        });

      await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/events/${event.id}/attend`)
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            name: 'Ok',
            statusCode: 200,
            message: 'Evento actualizado',
          });
        });

      const eventUpdated = await prisma.event.findUnique({
        where: {
          id: event.id,
        },
      });

      if (!eventUpdated) {
        return expect(true).toBe(false);
      }

      expect(eventUpdated).toStrictEqual({
        from: expect.any(Date),
        to: expect.any(Date),
        qrCode: null,
        qrPending: true,
        token: expect.any(String),
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        statesmanId: null,
        reservationId: null,
        eventTypeId: VISITAS,
        eventStateId: ATENDIDO,
        updatedAt: expect.any(Date),
        userId: finallyUser.user.id,
        fullName: '',
        id: expect.any(String),
        isCopy: false,
        isPermanent: true,
        lastName: '',
        lot: 'A6',
        monitorId: null,
        observations: null,
        patent: '',
        trialPeriod: false,
        dni: null,
        externalId: expect.any(String),
        isDelivery: false,
        authorizedUserId: null,
        changeLog: expect.any(String),
        createdAt: expect.any(Date),
        customerId: customer.id,
        file: {
          name: '119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          thumbnailUrl:
            'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
          url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/events/file/119811eb-f82f-4eba-8a24-4166be8eceaf.png',
        },
        firstName: '',
      });
      expect(JSON.parse(eventUpdated.changeLog)).toStrictEqual([
        {
          user: {
            id: '',
            firstName: '',
            lastName: '',
          },
          state: {
            id: ATENDIDO,
            name: 'Atendido',
          },
          observations: 'Atendido por GiroVision',
          updatedAt: expect.any(String),
        },
      ]);

      expect(firebase.updateEventFirebase).toBeCalledTimes(1);
    });

    it('/v1/customer/${id}/events/${id}/attend (GET) (EVENT NOT FOUND)', async () => {
      return await request(app.getHttpServer())
        .get(`/v1/customers/${customer.id}/events/${customer.id}/attend`)
        .set('Authorization', `Bearer ${token}`)
        .send()
        .expect(404)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body).toStrictEqual({
            error: 'Not Found',
            message: 'EVENT_NOT_FOUND',
            statusCode: 404,
          });
        });
    });
  });
});
