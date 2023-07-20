import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { NeighborhoodAlarm } from './neighborhood-alarm.entity';

export class NeighborhoodAlarmList extends PaginatedResult<NeighborhoodAlarm> {
  results: NeighborhoodAlarm[];
}
