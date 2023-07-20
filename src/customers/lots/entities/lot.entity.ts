import { Lot as LotPrisma } from '@prisma/client';

export class Lot implements LotPrisma {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  latitude: string;
  longitude: string;
  lot: string;
  active: boolean;
  isArea: boolean;
  updatedById: string;
  customerId: string;
}
