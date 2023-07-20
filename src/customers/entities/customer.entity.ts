import {
  AlertType,
  CustomerAlertType as PrismaCustomerAlertType,
  CustomerEventCategory as PrismaCustomerEventCategories,
  CustomerType,
  Prisma,
  EventCategory,
  CustomerIntegration,
  CustomerSections,
  Location,
  CustomerSettings,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '@src/common/dto/file.dto';
import { ICustomerWithAlertTypes } from '@src/interfaces/types';
import { CustomerAlertType } from './customer-alert-type.entity';
import { CustomerEventCategory } from './customer-event-category.entity';
import { CustomerIntegrationEntity } from './customer-integration.entity';

export class Customer implements ICustomerWithAlertTypes {
  verifyBySms: boolean;
  sections: CustomerSections | null;
  id: string;
  @ApiProperty({ enum: CustomerType })
  type: CustomerType;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings?: CustomerSettings | null;
  district: string;
  state: string;
  country: string;
  secretKey: string | null;
  trialPeriod: boolean | null;
  countryCode: string | null;
  phoneLength: number | null;
  url: string | null;
  speed: string | null;
  notes: string | null;
  timezone: string | null;
  @ApiProperty({ type: File, required: false })
  image: Prisma.JsonValue;
  parentId: string | null;
  updatedById: string;
  @ApiProperty({ type: [CustomerAlertType] })
  alertTypes: (PrismaCustomerAlertType & { alertType: AlertType })[];
  @ApiProperty({ type: [CustomerEventCategory] })
  eventCategories: (PrismaCustomerEventCategories & {
    category: EventCategory;
  })[];
  parent?: Customer;
  isClient: boolean | null;
  @ApiProperty({ type: CustomerIntegrationEntity })
  integrations: CustomerIntegration | null;
  locations?: Location[] | null;
}
