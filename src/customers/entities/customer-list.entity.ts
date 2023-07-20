import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Customer } from './customer.entity';

export class CustomerList extends PaginatedResult<Customer> {
  results: Customer[];
}
