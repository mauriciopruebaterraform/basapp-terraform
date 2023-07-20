import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { ReservationMode } from './reservation-mode.entity';

export class ReservationModeList extends PaginatedResult<ReservationMode> {
  results: ReservationMode[];
}
