import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Event } from './event.entity';

export class EventList extends PaginatedResult<Event> {
  results: Event[];
}
