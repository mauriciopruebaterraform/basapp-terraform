import { Module, forwardRef } from '@nestjs/common';
import { NeighborhoodController } from './neighborhood-alarm.controller';
import { NeighborhoodService } from './neighborhood-alarm.service';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { AlertsModule } from '@src/alerts/alerts.module';

@Module({
  imports: [forwardRef(() => AlertsModule)],
  providers: [NeighborhoodService, PushNotificationService],
  exports: [NeighborhoodService],
  controllers: [NeighborhoodController],
})
export class NeighborhoodModule {}
