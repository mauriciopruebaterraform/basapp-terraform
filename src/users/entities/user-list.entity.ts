import { UserWithoutPassword } from './user.entity';
import { PaginatedResult } from '@src/common/entities/paginated-result.entity';

export class UserList extends PaginatedResult<UserWithoutPassword> {
  results: UserWithoutPassword[];
}
