import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { NotificationTemplateDto } from './notification-template.dto';

export class UpdateNotificationTemplateDto extends PartialType(
  NotificationTemplateDto,
) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
