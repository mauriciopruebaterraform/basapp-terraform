import { PartialType } from '@nestjs/mapped-types';
import { CreateEventCategoryDto } from './create-event-categor.dto';

export class UpdateEventCategoryDto extends PartialType(
  CreateEventCategoryDto,
) {}
