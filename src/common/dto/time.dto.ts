import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TimeDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  from?: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  to?: string;
}
