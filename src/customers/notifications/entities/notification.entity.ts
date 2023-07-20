import {
  Prisma,
  Notification as NotificationPrisma,
  NotificationType,
  NotificationCustomer as NotificationCustomerPrisma,
  NotificationUser,
} from '@prisma/client';
import { Customer } from '@src/customers/entities/customer.entity';

class NotificationCustomer implements NotificationCustomerPrisma {
  id: string;
  notificationId: string;
  customerId: string;
  customer?: Customer | null;
}

export class Notification implements NotificationPrisma {
  eventId: string | null;
  alertId: string | null;
  notificationType: NotificationType;
  id: string;
  trialPeriod: boolean;
  title: string;
  description: string;
  image: Prisma.JsonValue;
  userId: string;
  customerId: string;
  authorizationRequestId: string | null;
  locationId: string | null;
  emergency: boolean;
  createdAt: Date;
  sendAt: Date | null;
  fromLot: string | null;
  toLot: string | null;
  additionalNotifications?: NotificationCustomer[];
  toUsers?: NotificationUser[];
}
