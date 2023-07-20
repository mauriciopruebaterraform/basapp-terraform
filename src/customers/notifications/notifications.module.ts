import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from '@src/push-notification/push-notification.service';

@Module({
  providers: [NotificationsService, PushNotificationService],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
