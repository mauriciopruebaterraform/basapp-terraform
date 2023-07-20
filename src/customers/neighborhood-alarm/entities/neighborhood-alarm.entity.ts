import {
  NeighborhoodAlarm as NeighborhoodAlarmPrisma,
  Prisma,
} from '.prisma/client';
import { Customer } from '@prisma/client';

export class NeighborhoodAlarm implements NeighborhoodAlarmPrisma {
  id: string;
  urgencyNumber: string;
  approximateAddress: string;
  geolocation: Prisma.JsonValue;
  userId: string;
  customerId: string;
  customer?: Customer | null;
  createdAt: Date;
  updatedAt: Date;
}
