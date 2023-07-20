import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Lot } from './lot.entity';

export class LotList extends PaginatedResult<Lot> {
  results: Lot[];
}
