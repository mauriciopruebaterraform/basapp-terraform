import { Location as LocationPrisma, LocationType } from '@prisma/client';
export class Location implements LocationPrisma {
  id: string;
  active: boolean;
  name: string;
  type: LocationType;
  updatedById: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}
