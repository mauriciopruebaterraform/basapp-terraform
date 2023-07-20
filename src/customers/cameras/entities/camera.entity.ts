import { Camera as CameraPrisma, Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Geolocation } from '@src/common/dto/geolocation.dto';

export class Camera implements CameraPrisma {
  id: string;
  active: boolean;
  code: string;
  description: string | null;
  @ApiProperty({ type: Geolocation, required: true })
  geolocation: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  updatedById: string;
  customerId: string;
  url: string | null;
}
