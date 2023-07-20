import { Customer } from '@src/customers/entities/customer.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  EventType as EventTypePrisma,
  Customer as CustomerPrisma,
  CustomerEventCategory,
} from '@prisma/client';

import { CustomerEventCategories } from '../../entities/customer-event-categories.entity';

export class EventType implements EventTypePrisma {
  isDelivery: boolean;
  icmDeliveryType: string | null;
  id: string;
  code: string;
  title: string;
  lotFrom: string | null;
  lotTo: string | null;
  additionalNotifications: string | null;
  qrFormat: number | null;
  description: boolean;
  attachment: boolean;
  monitor: boolean;
  addToStatistics: boolean;
  notifyUser: boolean;
  notifySecurityChief: boolean;
  notifySecurityGuard: boolean;
  autoCancelAfterExpired: boolean;
  allowsMultipleAuthorized: boolean;
  requiresDni: boolean;
  isPermanent: boolean;
  emergency: boolean;
  requiresPatent: boolean;
  generateQr: boolean;
  reservation: boolean;
  notifyGiroVision: boolean;
  active: boolean;
  customerId: string;
  gvEntryTypeId: number | null;
  gvGuestTypeId: number | null;
  updatedById: string;
  eventCategoryId: string | null;
  @ApiProperty({ type: Customer })
  customer?: CustomerPrisma | null;
  @ApiProperty({ type: CustomerEventCategories })
  eventCategory?: CustomerEventCategory | null;
}
