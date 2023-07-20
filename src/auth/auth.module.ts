import { PermissionsService } from '@src/permissions/permissions.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '@src/users/users.module';
import { PushNotificationService } from '@src/push-notification/push-notification.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
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
    PermissionsService,
    LocalStrategy,
    JwtStrategy,
    PushNotificationService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
