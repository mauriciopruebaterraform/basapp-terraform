export type ExternalService = {
  attributes?: string;
  geolocation?: string;
  name?: string;
  description?: string;
  type?: string;
  url?: string;
  removed?: boolean;
  uniqueId?: string;
  alertId: string;
  service?: string;
};

export type UpdateExternalService = Partial<ExternalService> & {
  active?: boolean;
};
