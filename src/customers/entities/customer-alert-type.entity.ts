import { AlertType } from '@src/alert-types/entities/alert-type.entity';

export class CustomerAlertType {
  alertTypeId: string;
  customerId: string;
  alertType: AlertType;
  order: number;
}
