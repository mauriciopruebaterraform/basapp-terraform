import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { EventAuthorizationRequest } from './event-authorization-request.entity';

export class EventAuthorizationRequestList extends PaginatedResult<EventAuthorizationRequest> {
  results: EventAuthorizationRequest[];
}
