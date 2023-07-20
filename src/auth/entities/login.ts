import { ApiProperty } from '@nestjs/swagger';

export class Login {
  @ApiProperty()
  public access_token: string;
}
