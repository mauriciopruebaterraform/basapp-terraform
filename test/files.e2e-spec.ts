import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@src/database/prisma.service';
import { createUserAndToken } from './utils/users';
import { Role } from '@prisma/client';
import { FILE_ADAPTER } from '@src/app.constants';
import { S3ServiceMock } from '@src/files/mocks/s3.service';
import { FileAdapter } from '@src/interfaces/types';
import * as fs from 'fs';
import { cleanData } from './utils/clearData';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fileAdapter: FileAdapter;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FILE_ADAPTER)
      .useValue(S3ServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });

    // Set the validation pipe
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    prisma = app.get(PrismaService);
    fileAdapter = app.get(FILE_ADAPTER);

    const result = await createUserAndToken(prisma, {
      username: `customer_${Date.now()}@mail.com`,
      password: '123456',
      firstName: 'Customer',
      lastName: 'Test',
      fullName: 'Customer Test',
      role: Role.admin,
      active: true,
    });

    token = result.token;
  });

  afterAll(async () => {
    await cleanData(prisma, app);
  });

  describe('/v1/files/upload (POST)', () => {
    it('should upload a file', async () => {
      fileAdapter.upload = jest
        .fn()
        .mockResolvedValueOnce({
          url: 'https://s3.amazonaws.com/bucket/file.jpeg',
        })
        .mockResolvedValueOnce({
          url: 'https://s3.amazonaws.com/bucket/file-thumbnail.jpeg',
        });

      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/files/test.jpeg`),
      );

      return request(app.getHttpServer())
        .post('/v1/files/upload')
        .field('path', 'test')
        .field('useThumbnail', 'true')
        .attach('file', buffer, 'test.jpeg')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            name: expect.any(String),
            url: expect.any(String),
            thumbnailUrl: expect.any(String),
          });

          // split extension
          const [name, extension] = res.body.name.split('.');

          // check if name is a uuid v4 string
          expect(name).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );

          // check if extension is jpg
          expect(extension).toEqual('jpeg');

          expect(res.body.url).toEqual(expect.stringContaining(extension));
          expect(res.body.thumbnailUrl).toEqual(
            expect.stringContaining(`-thumbnail.${extension}`),
          );
        });
    });

    it('should upload a file pdf', async () => {
      fileAdapter.upload = jest.fn().mockResolvedValueOnce({
        url: 'https://s3.amazonaws.com/bucket/file.pdf',
      });

      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/files/test.pdf`),
      );

      return request(app.getHttpServer())
        .post('/v1/files/upload')
        .field('path', 'test')
        .field('useThumbnail', 'false')
        .attach('file', buffer, 'test.pdf')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            name: expect.any(String),
            url: expect.any(String),
            thumbnailUrl: null,
          });

          // split extension
          const [name, extension] = res.body.name.split('.');

          // check if name is a uuid v4 string
          expect(name).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );

          // check if extension is pdf
          expect(extension).toEqual('pdf');

          expect(res.body.url).toEqual(expect.stringContaining(extension));
        });
    });

    it('should return an error if the file is not provided', async () => {
      return request(app.getHttpServer())
        .post('/v1/files/upload')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
          });
        });
    });

    it('should return an error if the path is not provided', async () => {
      const buffer = Buffer.from(
        fs.readFileSync(`${__dirname}/files/test.jpeg`),
      );

      return request(app.getHttpServer())
        .post('/v1/files/upload')
        .attach('file', buffer, 'test.jpeg')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 400,
            error: 'Bad Request',
          });
        });
    });
  });
});
