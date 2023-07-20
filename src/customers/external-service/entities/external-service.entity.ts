import { ExternalService as ExternalServicePrisma } from '@prisma/client';

export class ExternalService implements ExternalServicePrisma {
  id: string;
  attributes: string | null;
  geolocation: string | null;
  name: string | null;
  description: string | null;
  type: string | null;
  url: string | null;
  active: boolean;
  removed: boolean;
  uniqueId: string | null;
  alertId: string;
  service: string | null;
  createdAt: Date;
  updatedAt: Date;
}
