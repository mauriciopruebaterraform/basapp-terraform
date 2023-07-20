import { ReservationType } from '@src/customers/reservation-type/entities/reservation-type.entity';
import {
  AuthorizedUserReservationType as AuthorizedUserReservationTypePrisma,
  ReservationType as ReservationTypePrisma,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedUserReservationType
  implements AuthorizedUserReservationTypePrisma
{
  id: string;
  authorizedUserId: string;
  reservationTypeId: string;
  @ApiProperty({ type: ReservationType })
  reservationType?: ReservationTypePrisma[] | null;
}
