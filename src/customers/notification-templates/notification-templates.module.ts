import { Module } from '@nestjs/common';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationTemplatesService } from './notification-templates.service';

@Module({
  providers: [NotificationTemplatesService],
  exports: [NotificationTemplatesService],
  controllers: [NotificationTemplatesController],
})
export class NotificationTemplatesModule {}
