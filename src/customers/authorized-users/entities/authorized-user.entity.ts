import { Customer } from '@src/customers/entities/customer.entity';
import {
  AuthorizedUser as AuthorizedUserPrisma,
  Customer as CustomerPrisma,
  AuthorizedUserReservationType as AuthorizedUserReservationTypePrisma,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { AuthorizedUserReservationType } from './authorized-user-reservation-type.entity';

export class AuthorizedUser implements AuthorizedUserPrisma {
  additionalLots: string | null;
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  lot: string | null;
  description: string | null;
  sendEvents: boolean | null;
  active: boolean;
  customerId: string;
  @ApiProperty({ type: Customer })
  customer?: CustomerPrisma | null;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  expireDate: Date | null;
  isOwner: boolean | null;
  @ApiProperty({ type: AuthorizedUserReservationType })
  reservationTypes?: AuthorizedUserReservationTypePrisma[] | null;
}
