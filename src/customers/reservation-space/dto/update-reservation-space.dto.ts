import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReservationSpaceDto } from './reservation-space.dto';

export class UpdateReservationSpaceDto extends PartialType(
  ReservationSpaceDto,
) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
