import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { ReservationSpace } from './reservation-space.entity';

export class ReservationSpaceList extends PaginatedResult<ReservationSpace> {
  results: ReservationSpace[];
}
