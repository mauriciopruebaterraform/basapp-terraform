import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Reservation } from './reservation.entity';

export class ReservationList extends PaginatedResult<Reservation> {
  results: Reservation[];
}
