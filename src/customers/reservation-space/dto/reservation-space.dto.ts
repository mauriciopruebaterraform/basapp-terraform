import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleDto } from './schedule.dto';

export class ReservationSpaceDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => ScheduleDto)
  schedule: ScheduleDto;

  @IsNumber()
  @IsOptional()
  interval?: number;

  @IsBoolean()
  @IsOptional()
  notifyParticipants?: boolean;

  @IsString()
  @IsOptional()
  additionalNumbers?: string;

  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  eventTypeId: string;

  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  reservationTypeId: string;
}
