import { CustomerEventCategory as CustomerEventCategoryPrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '@src/customers/entities/customer.entity';
import { EventCategory } from '@src/event-category/entities/event-category.entity';

export class CustomerEventCategories implements CustomerEventCategoryPrisma {
  categoryId: string;
  customerId: string;
  id: string;
  order: number;
  active: boolean;
  @ApiProperty({ type: EventCategory })
  category: string;
  @ApiProperty({ type: Customer })
  customer: string;
  reservationTypeId: string | null;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
}
