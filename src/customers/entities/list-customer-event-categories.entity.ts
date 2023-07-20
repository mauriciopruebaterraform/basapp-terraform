import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { CustomerEventCategories } from './customer-event-categories.entity';

export class CustomerEventCategoriesList extends PaginatedResult<CustomerEventCategories> {
  results: CustomerEventCategories[];
}
