import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Camera } from './camera.entity';

export class CameraList extends PaginatedResult<Camera> {
  results: Camera[];
}
