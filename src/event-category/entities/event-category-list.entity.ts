import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { EventCategory } from './event-category.entity';

export class EventCategoryList extends PaginatedResult<EventCategory> {
  results: EventCategory[];
}
