import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelReservationDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  eventStateId?: string;
}
