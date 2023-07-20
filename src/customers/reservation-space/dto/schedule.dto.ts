import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TimeDto } from '@src/common/dto/time.dto';

export class ScheduleDto {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  mon: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  tue: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  wed: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  thu: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  fri: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  sat: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  sun: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  holiday: TimeDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TimeDto)
  holidayEve: TimeDto;
}
