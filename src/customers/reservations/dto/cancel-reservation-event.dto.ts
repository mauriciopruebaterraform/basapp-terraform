import { IsNotEmpty, IsString } from 'class-validator';

export class CancelReservationEventDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
