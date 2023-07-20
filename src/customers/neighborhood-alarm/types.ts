import {
  Customer,
  CustomerIntegration,
  NeighborhoodAlarm as NeighborhoodAlarmPrisma,
  User,
} from '@prisma/client';

export type NeighborhoodAlarm = NeighborhoodAlarmPrisma & {
  user: User;
  customer: Customer & {
    integrations: CustomerIntegration | null;
  };
};
