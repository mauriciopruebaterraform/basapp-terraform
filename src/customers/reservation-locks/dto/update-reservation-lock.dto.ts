import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReservationLockDto } from './reservation-lock.dto';

export class UpdateReservationLockDto extends PartialType(ReservationLockDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
