import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReservationModeDto } from './reservation-mode.dto';

export class UpdateReservationModeDto extends PartialType(ReservationModeDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
