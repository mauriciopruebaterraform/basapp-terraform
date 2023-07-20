import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class TokenUser {
  @ApiProperty({ example: '5e9f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f' })
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ enum: Role })
  role: Role;
  @ApiProperty()
  active: boolean;
  @ApiProperty()
  customerId: string;
}
