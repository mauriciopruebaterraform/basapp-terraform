import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Alert } from './alert.entity';

export class AlertList extends PaginatedResult<Alert> {
  results: Alert[];
}
