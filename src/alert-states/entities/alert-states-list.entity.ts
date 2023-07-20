import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { AlertState } from './alert-states.entity';

export class AlertStatesList extends PaginatedResult<AlertState> {
  results: AlertState[];
}
