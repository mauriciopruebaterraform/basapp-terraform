import { AlertState as AlertStatePrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AlertState implements AlertStatePrisma {
  id: string;
  name: string;
  active: boolean;
  @ApiProperty()
  customerId: string | null;

  constructor(partial?: Partial<AlertState>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
