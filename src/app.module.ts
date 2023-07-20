import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AlertTypesModule } from './alert-types/alert-types.module';
import { AlertsModule } from './alerts/alerts.module';
import { RolesGuard } from './auth/roles.guard';
import { CustomerModule } from './customers/customers.module';
import { PoliciesGuard } from './auth/policies.guard';
import { PoliciesExcludeGuard } from './auth/policies-exclude.guard';
import { CustomerVerificationGuard } from './auth/customer-verification.guard';
import { PermissionsModule } from './permissions/permissions.module';
import { FilesController } from './files/files.controller';
import { FilesUploadService } from './files/files.service';
import { S3Service } from './files/s3.service';
import { FILE_ADAPTER } from './app.constants';
import { EventCategoryModule } from './event-category/event-category.module';
import { AlertStatesModule } from './alert-states/alert-states.module';
import { EventStatesModule } from './event-states/event-states.module';
import { CustomerLotsModule } from './customers/customer-lots/customer-lots.module';
import { PushNotificationModule } from './push-notification/push-notification.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { FirebaseModule } from './firebase/firebase.module';
import { SMSModule } from './sms/sms.module';

@Module({
  imports: [
    FirebaseModule,
    PushNotificationModule,
    CustomerLotsModule,
    TerminusModule,
    AuthModule,
    UsersModule,
    AlertTypesModule,
    DatabaseModule,
    PushNotificationModule,
    AlertsModule,
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CustomerModule,
    PermissionsModule,
    EventCategoryModule,
    AlertStatesModule,
    EventStatesModule,
    ConfigurationModule,
    SMSModule,
  ],
  controllers: [AppController, HealthController, FilesController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesExcludeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomerVerificationGuard,
    },
    {
      provide: FILE_ADAPTER,
      useClass: S3Service,
    },
    AppService,
    PrismaHealthIndicator,
    FilesUploadService,
  ],
  exports: [FILE_ADAPTER],
})
export class AppModule {}
