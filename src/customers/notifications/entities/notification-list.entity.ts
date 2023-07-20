import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Notification } from './notification.entity';

export class NotificationList extends PaginatedResult<Notification> {
  results: Notification[];
}
