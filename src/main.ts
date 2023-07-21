import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  PrismaGirovisionService,
  PrismaService,
} from './database/prisma.service';
import * as admin from 'firebase-admin';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });
  const configService: ConfigService = app.get(ConfigService);

  // firebase config
  const { databaseURL, projectId, clientEmail, privateKey } =
    configService.get('firebase');

  if (databaseURL && projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
      databaseURL,
    });
  }

  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Swagger setup
  if (process.env.NODE_ENV !== 'production') {
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: { persistAuthorization: true },
    };
    const config = new DocumentBuilder()
      .setTitle('Basapp')
      .setDescription('The basapp API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, customOptions);
  }

  // Prisma shutdown
  const prismaService: PrismaService = app.get(PrismaService);
  const prismaGirovisionService: PrismaGirovisionService = app.get(
    PrismaGirovisionService,
  );

  prismaService.enableShutdownHooks(app);
  prismaGirovisionService.enableShutdownHooks(app);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  // Set the versioning type
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Start the server
  await app.listen(configService.get('port') as number);
}
bootstrap();
