import { CustomerHolidays as holidayPrisma } from '@prisma/client';
import { Customer } from '@src/customers/entities/customer.entity';

export class Holidays implements holidayPrisma {
  id: string;
  date: Date;
  customer?: Customer | null;
  customerId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
