import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { EventType } from './event-type.entity';

export class EventTypeList extends PaginatedResult<EventType> {
  results: EventType[];
}
