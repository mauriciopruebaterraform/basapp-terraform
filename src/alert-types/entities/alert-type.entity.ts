import { AlertType as PrismaAlertType } from '@prisma/client';

export class AlertType implements PrismaAlertType {
  id: string;
  type: string;
  name: string;
}
