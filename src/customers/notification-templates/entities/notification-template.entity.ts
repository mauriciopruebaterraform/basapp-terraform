import { File } from '@src/common/dto/file.dto';
import {
  NotificationTemplate as NotificationTemplatePrisma,
  Prisma,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationTemplate implements NotificationTemplatePrisma {
  id: string;
  title: string;
  description: string;
  active: boolean;
  customerId: string;
  @ApiProperty({ type: File, required: false })
  image: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}
