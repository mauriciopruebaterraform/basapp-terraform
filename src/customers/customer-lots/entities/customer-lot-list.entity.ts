import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { CustomerLot } from './customer-lot.entity';

export class CustomerLotList extends PaginatedResult<CustomerLot> {
  results: CustomerLot[];
}
