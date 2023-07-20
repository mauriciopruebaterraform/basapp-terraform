import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ReservationTypeDto } from './reservation-type.dto';

export class UpdateReservationTypeDto extends PartialType(ReservationTypeDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
