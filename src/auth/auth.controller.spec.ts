import '../__test__/winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import configuration from '@src/config/configuration';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UsersService } from '@src/users/users.service';
import { UsersServiceMock } from '@src/users/mocks/users.service';
import { DatabaseModule } from '@src/database/database.module';
import { PermissionsService } from '@src/permissions/permissions.service';
import { PermissionsServiceMock } from '@src/permissions/mocks/permissions.service';
import { FirebaseService } from '@src/firebase/firebase.service';
import { FirebaseServiceMock } from '@src/firebase/mock/firebase.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { PushNotificationServiceMock } from '@src/push-notification/mocks/push-notification.service';
import { FirebaseModule } from '@src/firebase/firebase.module';
import { PushNotificationModule } from '@src/push-notification/push-notification.module';
import { ConfigurationModule } from '@src/configuration/configuration.module';
import { SmsService } from '@src/sms/sms.service';
import { SmsServiceMock } from '@src/sms/mocks/sms.service';
import { SMSModule } from '@src/sms/sms.module';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { User } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let firebase: FirebaseServiceMock;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        FirebaseModule,
        PushNotificationModule,
        ConfigurationModule,
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        AuthModule,
        PassportModule,
        SMSModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('jwt.secret'),
            signOptions: { expiresIn: config.get('jwt.expiration') },
          }),
        }),
      ],
      providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        FirebaseService,
        { provide: UsersService, useValue: UsersServiceMock },
        { provide: PermissionsService, useValue: PermissionsServiceMock },
        {
          provide: PushNotificationService,
          useValue: PushNotificationServiceMock,
        },
      ],
      controllers: [AuthController],
    })
      .overrideProvider(SmsService)
      .useValue(SmsServiceMock)
      .overrideProvider(FirebaseService)
      .useValue(FirebaseServiceMock)
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .compile();

    controller = module.get<AuthController>(AuthController);
    firebase = module.get(FirebaseService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return an access token', async () => {
    const req = {
      user: {
        username: 'test',
        password: '123456',
      },
    };

    const tokeFirebase = 'random.token.basapp';
    firebase.createCustomToken.mockResolvedValueOnce(tokeFirebase);

    const result = await controller.login(req);
    expect(result).toBeDefined();
    expect(result).toEqual({
      access_token: expect.any(String),
    });
  });
  it('should return a firebase token', async () => {
    const req = {
      user: {
        username: 'test',
        password: '123456',
      },
    };

    const userMock = mockDeep<User>({
      username: 'test',
      password: '123456',
    });
    const tokeFirebase = 'random.token.basapp';
    firebase.createCustomToken.mockResolvedValueOnce(tokeFirebase);
    prisma.user.findUnique.mockResolvedValueOnce(userMock);
    const result = await controller.firebaseToken(req);
    expect(result).toBeDefined();
    expect(result).toEqual({
      firebaseToken: tokeFirebase,
    });
  });
});
