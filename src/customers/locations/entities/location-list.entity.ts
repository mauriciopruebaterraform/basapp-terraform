import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Location } from './location.entity';

export class LocationList extends PaginatedResult<Location> {
  results: Location[];
}
