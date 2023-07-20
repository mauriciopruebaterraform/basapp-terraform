import { CustomerLot as CustomerLotPrisma } from '@prisma/client';
export class CustomerLot implements CustomerLotPrisma {
  id: string;
  lot: string | null;
  icmLot: string | null;
  icmUid: string | null;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
