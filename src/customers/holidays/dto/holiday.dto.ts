import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class HolidayDto {
  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  date: Date;
}
