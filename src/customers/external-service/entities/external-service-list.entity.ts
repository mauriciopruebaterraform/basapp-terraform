import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { ExternalService } from './external-service.entity';

export class ExternalServiceList extends PaginatedResult<ExternalService> {
  results: ExternalService[];
}
