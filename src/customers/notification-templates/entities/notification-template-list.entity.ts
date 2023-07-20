import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { NotificationTemplate } from './notification-template.entity';

export class NotificationTemplateList extends PaginatedResult<NotificationTemplate> {
  results: NotificationTemplate[];
}
