import { Contact as ContactPrisma, Prisma } from '@prisma/client';
import { User } from '@src/users/entities/user.entity';

export class Contact implements ContactPrisma {
  id: string;
  phoneNumber: string;
  deviceContact: Prisma.JsonValue;
  contactUserId: string | null;
  contactUser?: User | null;
  user?: User | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
