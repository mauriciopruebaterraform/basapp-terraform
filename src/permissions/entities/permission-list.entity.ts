import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Permission } from './permission.entity';

export class PermissionList extends PaginatedResult<Permission> {
  results: Permission[];
}
