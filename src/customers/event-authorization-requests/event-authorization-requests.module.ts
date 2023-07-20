import { Module } from '@nestjs/common';
import { EventAuthorizationRequestService } from './event-authorization-requests.service';
import { EventAuthorizationRequestController } from './event-authorization-requests.controller';
import { PushNotificationService } from '@src/push-notification/push-notification.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [EventAuthorizationRequestService, PushNotificationService],
  exports: [EventAuthorizationRequestService],
  controllers: [EventAuthorizationRequestController],
})
export class EventAuthorizationRequestModule {}
