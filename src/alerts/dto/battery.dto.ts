import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class Battery {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  level?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  is_charging?: boolean;
}
