import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Holidays } from './holidays.entity';

export class HolidayList extends PaginatedResult<Holidays> {
  results: Holidays[];
}
