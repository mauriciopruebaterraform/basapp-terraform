import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Protocol } from './protocol.entity';

export class ProtocolList extends PaginatedResult<Protocol> {
  results: Protocol[];
}
