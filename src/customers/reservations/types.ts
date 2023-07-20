import {
  Reservation,
  ReservationMode,
  ReservationSpace,
  ReservationType,
  Customer,
  AuthorizedUser,
  User,
} from '@prisma/client';

export type AuthorizedExtended = AuthorizedUser & {
  userAuthorizedUser: User[];
};

export type Participant = {
  fullName: string;
  userId?: string | null;
  authorizedUserId?: string | null;
};

export type ValidateDate = {
  userId?: string;
  authorizedUserId?: string;
  customerId: string;
  participants?: Participant[] | null;
  fromDate?: Date | string;
  toDate?: Date | string;
  reservationType: ReservationType;
};

export type ValidatePendingReservations = {
  userId?: string;
  customerId?: string;
  authorizedUser: AuthorizedExtended;
  reservationType: ReservationType;
  lot?: string | null;
};

export type ValidateMode = {
  reservationMode: ReservationMode;
  from: string | Date;
  customerId?: string;
};

export type ValidateLock = {
  customer: Customer;
  fromDate?: Date | string;
  reservationSpace: ReservationSpace;
  toDate?: Date | string;
};
export type ReservationExtended = Reservation & {
  reservationType: ReservationType;
  reservationMode: ReservationMode;
  customer: Customer;
  reservationSpace: ReservationSpace;
};

export type SetParticipants = {
  participants?: Participant[] | null;
  user?: User | null;
  authorizedUser?: AuthorizedExtended | null;
};

export type SetUserId = {
  user: User;
  authorizedUser?: AuthorizedExtended | null;
  noUser?: boolean;
  customerId: string;
};

export type SetData = {
  participants?: Participant[] | null;
  reservationMode: ReservationMode;
  dateFrom: Date | string;
  dateTo: Date | string;
};

export type Attributes = {
  email: string;
  where?: string;
  orderBy?: string;
};
