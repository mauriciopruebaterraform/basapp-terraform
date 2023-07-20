import { ApiProperty } from '@nestjs/swagger';
import { ReservationSpaceReservationMode as ReservationSpaceReservationModePrisma } from '@prisma/client';
import { ReservationSpace } from '@src/customers/reservation-space/entities/reservation-space.entity';

export class ReservationSpaceReservationMode
  implements ReservationSpaceReservationModePrisma
{
  reservationModeId: string;
  @ApiProperty({ type: ReservationSpace })
  reservationSpace?: ReservationSpace;
  reservationSpaceId: string;
}
