import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { UsefulInformation } from './useful-information.entity';

export class UsefulInformationList extends PaginatedResult<UsefulInformation> {
  results: UsefulInformation[];
}
