import { Prisma, Protocol as ProtocolPrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '@src/common/dto/file.dto';

export class Protocol implements ProtocolPrisma {
  id: string;
  active: boolean;
  title: string;
  code: string;
  @ApiProperty({ type: File, required: false })
  attachment: Prisma.JsonValue;
  customerId: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
}
