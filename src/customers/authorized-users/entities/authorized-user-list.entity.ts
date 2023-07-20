import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { AuthorizedUser } from './authorized-user.entity';

export class AuthorizedUserList extends PaginatedResult<AuthorizedUser> {
  results: AuthorizedUser[];
}
