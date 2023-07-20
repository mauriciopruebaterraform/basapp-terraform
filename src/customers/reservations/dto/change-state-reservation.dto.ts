import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeStateReservationDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  eventStateId: string;
}
