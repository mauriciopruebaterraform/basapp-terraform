import { PartialType } from '@nestjs/mapped-types';
import { EventTypeDto } from './event-type.dto';

export class UpdateEventTypeDto extends PartialType(EventTypeDto) {}
