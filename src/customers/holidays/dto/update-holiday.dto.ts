import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { HolidayDto } from './holiday.dto';

export class UpdateHolidayDto extends PartialType(HolidayDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
