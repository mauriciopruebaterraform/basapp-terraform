import { Permission as PrismaPermission } from '@prisma/client';
export class Permission implements PrismaPermission {
  id: string;
  action: string;
  name: string;
  category: string;
  statesman: boolean;
  monitoring: boolean;
}
