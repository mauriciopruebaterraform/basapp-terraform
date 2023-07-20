import { NotificationUser as NotificationUserPrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '@src/customers/notifications/entities/notification.entity';

export class NotificationUser implements NotificationUserPrisma {
  id: string;
  read: boolean;
  userId: string;
  notificationId: string;
  @ApiProperty({ type: Notification })
  notification: Notification;
  createdAt: Date;
}
