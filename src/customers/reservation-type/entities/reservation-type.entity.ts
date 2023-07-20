import { ReservationType as ReservationTypePrisma } from '@prisma/client';

export class ReservationType implements ReservationTypePrisma {
  pendingPerLot: boolean;
  allowsSimultaneous: boolean;
  requireConfirmation: boolean;
  daysSecondTime: number | null;
  id: string;
  code: string;
  customerId: string;
  days: number | null;
  display: string;
  groupCode: string;
  numberOfPending: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  minDays: number | null;
  maxPerMonth: number | null;
  minDaysBetweenReservation: number | null;
  termsAndConditions: boolean;
}
