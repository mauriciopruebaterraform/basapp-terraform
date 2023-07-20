import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { Role } from '@prisma/client';
import { cleanData } from './utils/clearData';

describe('TypeAlertsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  it('/v1/alert-types (GET)', async () => {
    const data = [
      {
        type: 'perimeter-violation',
        name: 'Violación de perímetro',
      },
      {
        type: 'alarm-activated',
        name: 'Alarma activada',
      },
    ];

    const { token } = await createUserAndToken(prisma, {
      username: `test_${Date.now()}`,
      password: '123456',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: Role.admin,
      active: true,
    });

    await prisma.alertType.createMany({
      data,
    });

    return request(app.getHttpServer())
      .get('/v1/alert-types')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        res.body.forEach((item) => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('type');
        });
      });
  });
});
