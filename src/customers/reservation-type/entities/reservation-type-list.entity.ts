import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { ReservationType } from './reservation-type.entity';

export class ReservationTypeList extends PaginatedResult<ReservationType> {
  results: ReservationType[];
}
