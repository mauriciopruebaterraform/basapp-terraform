import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { NotificationUser } from './notification-user.entity';

export class NotificationUserList extends PaginatedResult<NotificationUser> {
  results: NotificationUser[];
}
