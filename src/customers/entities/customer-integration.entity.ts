import { CustomerIntegration } from '@prisma/client';

export class CustomerIntegrationEntity implements CustomerIntegration {
  id: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  updatedById: string;
  traccarUsername: string | null;
  traccarPassword: string | null;
  traccarUrl: string | null;
  icmUrl: string | null;
  icmToken: string | null;
  giroVisionId: string | null;
  neighborhoodAlarm: boolean | null;
  neighborhoodAlarmLink: string | null;
  neighborhoodAlarmKey: string | null;
  cybermapaUrl: string | null;
  cybermapaPassword: string | null;
  cybermapaUsername: string | null;
}
