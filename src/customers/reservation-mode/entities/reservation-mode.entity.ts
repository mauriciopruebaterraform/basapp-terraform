import { ApiProperty } from '@nestjs/swagger';
import { ReservationMode as ReservationModePrisma } from '@prisma/client';
import { ReservationType } from '@src/customers/reservation-type/entities/reservation-type.entity';
import { ReservationSpaceReservationMode } from './reservation-space-reservation-mode.entity';

export class ReservationMode implements ReservationModePrisma {
  updatedById: string;
  id: string;
  name: string;
  maxDuration: number | null;
  maxPeople: number | null;
  active: boolean;
  attachList: boolean;
  allowGuests: boolean;
  allParticipantsRequired: boolean;
  inactivityTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  maxPerMonth: number | null;
  email: string | null;
  @ApiProperty({ type: ReservationType })
  reservationType?: ReservationType | null;
  reservationTypeId: string;
  @ApiProperty({ type: [ReservationSpaceReservationMode] })
  reservationSpaces?: ReservationSpaceReservationMode[] | null;
  customerId: string;
}
