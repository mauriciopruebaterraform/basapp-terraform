import { Prisma, Reservation as ReservationPrisma } from '@prisma/client';
import { AuthorizedUser } from '@src/customers/authorized-users/entities/authorized-user.entity';
import { Customer } from '@src/customers/entities/customer.entity';
import { ReservationMode } from '@src/customers/reservation-mode/entities/reservation-mode.entity';
import { ReservationSpace } from '@src/customers/reservation-space/entities/reservation-space.entity';
import { ReservationType } from '@src/customers/reservation-type/entities/reservation-type.entity';
import { User } from '@src/users/entities/user.entity';

export class Reservation implements ReservationPrisma {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  trialPeriod: boolean;
  fromDate: Date;
  toDate: Date;
  inactiveToDate: Date | null;
  cancelDate: Date | null;
  numberOfGuests: number | null;
  createdById: string;
  lot: string | null;
  userId: string;
  user: User;
  authorizedUserId: string | null;
  authorizedUser?: AuthorizedUser | null;
  customerId: string;
  reservationTypeId: string;
  reservationType?: ReservationType | null;
  reservationModeId: string;
  reservationMode?: ReservationMode | null;
  reservationSpaceId: string;
  reservationSpace?: ReservationSpace | null;
  customer?: Customer;
  eventStateId: string;
  file: Prisma.JsonValue;
  noUser: boolean;
}
