import { EventCategory } from '@src/event-category/entities/event-category.entity';

export class CustomerEventCategory {
  customerId?: string;
  categoryId?: string;
  category?: EventCategory;
  reservationTypeId?: string;
  order?: number;
}
