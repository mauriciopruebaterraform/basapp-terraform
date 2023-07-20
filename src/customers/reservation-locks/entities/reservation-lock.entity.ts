import {
  Prisma,
  ReservationLock as reservationLockPrisma,
} from '@prisma/client';
import { Customer } from '@src/customers/entities/customer.entity';
import { ReservationSpace } from '@src/customers/reservation-space/entities/reservation-space.entity';
import { ReservationType } from '@src/customers/reservation-type/entities/reservation-type.entity';

export class ReservationLock implements reservationLockPrisma {
  id: string;
  name: string | null;
  active: boolean;
  ignoreIfHoliday: boolean;
  date: Date | null;
  sun: Prisma.JsonValue;
  mon: Prisma.JsonValue;
  tue: Prisma.JsonValue;
  wed: Prisma.JsonValue;
  thu: Prisma.JsonValue;
  fri: Prisma.JsonValue;
  sat: Prisma.JsonValue;
  holiday: Prisma.JsonValue;
  holidayEve: Prisma.JsonValue;
  customerId: string;
  customer?: Customer | null;
  reservationSpaceId: string;
  reservationSpace?: ReservationSpace | null;
  reservationTypeId: string;
  reservationType?: ReservationType | null;
  createdAt: Date;
  updatedAt: Date;
}
