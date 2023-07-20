import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { EventStates } from './event-states.entity';

export class EventStatesList extends PaginatedResult<EventStates> {
  results: EventStates[];
}
