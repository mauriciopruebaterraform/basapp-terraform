import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { Prisma, Role, User } from '@prisma/client';
import { createUserAndToken } from './utils/users';
import { errorCodes } from '@src/auth/auth.constants';
import { errorCodes as permissionsErrorCodes } from '@src/permissions/permissions.constants';
import { cleanData } from './utils/clearData';

const permissionsData: Prisma.PermissionCreateInput[] = [
  {
    id: '799c4674-ab27-4bdf-9ff1-a79fd22ab31b',
    action: 'monitor-alert',
    name: 'Monitoreo de alertas',
    category: 'alert',
  },
  {
    id: '0072ba56-cd93-4562-a643-f0981d116262',
    action: 'attend-alert',
    name: 'Atender alertas',
    category: 'alert',
  },
  {
    id: 'd85dada8-26d1-453b-8e9b-d55085576c59',
    action: 'monitor-event',
    name: 'Monitoreo de eventos',
    category: 'event',
    statesman: true,
  },
  {
    id: '3ef4053c-03a8-4374-985b-4e9374aa5353',
    action: 'attend-event',
    name: 'Atender eventos',
    category: 'event',
    monitoring: true,
  },
];

describe('PermissionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let statesman: { user: User; token: string };

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    prisma = app.get(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    const result = await createUserAndToken(prisma, {
      username: 'permissions-test-user',
      password: '123456',
      firstName: 'Permissions',
      lastName: 'Test',
      fullName: 'Permissions Test',
      role: Role.admin,
    });

    token = result.token;

    await prisma.permission.createMany({
      data: permissionsData,
    });

    statesman = await createUserAndToken(prisma, {
      username: 'permissions-test-user-not-admin-2',
      password: '123456',
      firstName: 'Permissions',
      lastName: 'Test',
      fullName: 'Permissions Test',
      role: Role.user,
    });
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/permissions (GET)', () => {
    it('/v1/permissions (GET) all permissions', async () => {
      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          res.body.results.forEach((item) => {
            const permission = permissionsData.find(
              (permission) => permission.id === item.id,
            );
            expect(permission).toBeDefined();
            expect(item).toMatchObject(permission as any);
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: permissionsData.length,
            take: 100,
            skip: 0,
            size: permissionsData.length,
            hasMore: false,
          });
        });
    });

    it('/v1/permissions (GET) statesman permissions', async () => {
      const data = permissionsData.filter((permission) => permission.statesman);

      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .query({
          where: JSON.stringify({
            statesman: true,
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toHaveLength(data.length);
          res.body.results.forEach((item) => {
            const permission = data.find(
              (permission) => permission.id === item.id,
            );
            expect(permission).toBeDefined();
            expect(item).toMatchObject(permission as any);
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: data.length,
            take: 100,
            skip: 0,
            size: data.length,
            hasMore: false,
          });
        });
    });

    it('/v1/permissions (GET) monitoring permissions', async () => {
      const data = permissionsData.filter(
        (permission) => permission.monitoring,
      );

      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .query({
          where: JSON.stringify({
            monitoring: true,
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toHaveLength(data.length);
          res.body.results.forEach((item) => {
            const permission = data.find(
              (permission) => permission.id === item.id,
            );
            expect(permission).toBeDefined();
            expect(item).toMatchObject(permission as any);
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: data.length,
            take: 100,
            skip: 0,
            size: data.length,
            hasMore: false,
          });
        });
    });

    it('/v1/permissions (GET) complex query', async () => {
      const data = permissionsData.filter(
        (permission) =>
          permission.statesman &&
          permission.monitoring &&
          permission.name.endsWith('eventos'),
      );

      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .query({
          where: JSON.stringify({
            statesman: true,
            monitoring: true,
            name: {
              endsWith: 'eventos',
            },
          }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.results).toBeInstanceOf(Array);
          expect(res.body.results).toHaveLength(data.length);
          res.body.results.forEach((item) => {
            const permission = data.find(
              (permission) => permission.id === item.id,
            );
            expect(permission).toBeDefined();
            expect(item).toMatchObject(permission as any);
          });
          expect(res.body.pagination).toBeInstanceOf(Object);
          expect(res.body.pagination).toEqual({
            total: data.length,
            take: 100,
            skip: 0,
            size: data.length,
            hasMore: false,
          });
        });
    });

    it('/v1/permissions (GET) invalid query', async () => {
      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .query({
          where: 'invalid',
        })
        .expect(400);
    });

    it('/v1/permissions (GET) invalid query (2)', async () => {
      const params = {
        statesman: true,
        monitoring: true,
        name: {
          endsWith: 'eventos',
        },
        invalid: true,
      };

      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${token}`)
        .query({
          where: JSON.stringify(params),
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Object);
          expect(res.body.message).toContain(
            'There was an error retrieving permission list.',
          );
        });
    });

    it('/v1/permissions (GET) Unauthorized', async () => {
      return request(app.getHttpServer())
        .get('/v1/permissions')
        .expect(401)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: errorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/permissions (GET) Unauthorized: not admin user', async () => {
      const result = await createUserAndToken(prisma, {
        username: 'permissions-test-user-not-admin',
        password: '123456',
        firstName: 'Permissions',
        lastName: 'Test',
        fullName: 'Permissions Test',
        role: Role.user,
      });

      return request(app.getHttpServer())
        .get('/v1/permissions')
        .set('Authorization', `Bearer ${result.token}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: errorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });
  });

  describe('/v1/permissions/${id} (PATCH)', () => {
    it('/v1/permissions (PATCH)', async () => {
      const permission = await prisma.permission.create({
        data: {
          name: 'Test permission',
          action: 'test-action',
          category: 'test-category',
        },
      });

      return request(app.getHttpServer())
        .patch(`/v1/permissions/${permission.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          statesman: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: permission.id,
            name: 'Test permission',
            action: permission.action,
            category: permission.category,
            statesman: true,
          });
        });
    });

    it('/v1/permissions (PATCH) Invalid body', async () => {
      const permissionId = '799c4674-ab27-4bdf-9ff1-a79fd22ab31b';

      return request(app.getHttpServer())
        .patch(`/v1/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'name is not allowed',
          statesman: 'invalid',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
          });
        });
    });

    it('/v1/permissions (PATCH) Unauthorized: not admin user', async () => {
      const permissionId = '799c4674-ab27-4bdf-9ff1-a79fd22ab31b';

      return request(app.getHttpServer())
        .patch(`/v1/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${statesman.token}`)
        .send({
          statesman: true,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 403,
            error: 'Forbidden',
            message: errorCodes.AUTHORIZATION_REQUIRED,
          });
        });
    });

    it('/v1/permissions (PATCH) Not found', async () => {
      return request(app.getHttpServer())
        .patch('/v1/permissions/123')
        .set('Authorization', `Bearer ${token}`)
        .send({
          statesman: true,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 404,
            error: 'Permission not found',
            message: permissionsErrorCodes.PERMISSION_NOT_FOUND,
          });
        });
    });
  });
});
