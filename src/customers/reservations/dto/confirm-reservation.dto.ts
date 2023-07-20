import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmReservationDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
