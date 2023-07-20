import { Module } from '@nestjs/common';
import { ReservationService } from './reservations.service';
import { ReservationController } from './reservations.controller';
import { PushNotificationService } from '@src/push-notification/push-notification.service';

@Module({
  providers: [ReservationService, PushNotificationService],
  exports: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
