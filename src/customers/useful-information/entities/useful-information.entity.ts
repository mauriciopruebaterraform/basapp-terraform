import { Prisma, UsefulInformation as UsefulPrisma } from '@prisma/client';
import { File } from '@src/common/dto/file.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UsefulInformation implements UsefulPrisma {
  id: string;
  code: string;
  title: string;
  @ApiProperty({ type: File, required: false })
  attachment: Prisma.JsonValue;
  active: boolean;
  isCategory: boolean;
  categoryId: string | null;
  link: string | null;
  description: string | null;
  customerId: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
}
