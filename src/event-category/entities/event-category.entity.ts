import { Prisma, EventCategory as EventCategoryPrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '@src/common/dto/file.dto';

export class EventCategory implements EventCategoryPrisma {
  id: string;
  title: string;
  active: boolean;
  @ApiProperty({ type: File, required: false })
  image: Prisma.JsonValue;
}
