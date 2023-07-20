import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlertSmsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  msj: string;
}
