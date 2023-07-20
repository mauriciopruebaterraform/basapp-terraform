import { ApiProperty } from '@nestjs/swagger';

export class UserPasswordInput {
  @ApiProperty()
  public username: string;
  @ApiProperty()
  public password: string;
  @ApiProperty()
  public customerType?: string;
}
