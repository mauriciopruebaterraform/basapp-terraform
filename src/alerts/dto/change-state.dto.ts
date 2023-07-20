import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class ChangeStateAlertDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  alertStateId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  customerId: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  observations?: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  @Length(0, 15)
  code?: string;
}
