import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { ReservationLock } from './reservation-lock.entity';

export class ReservationLockList extends PaginatedResult<ReservationLock> {
  results: ReservationLock[];
}
