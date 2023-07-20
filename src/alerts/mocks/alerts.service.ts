import { AlertsService } from '../../alerts/alerts.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(AlertsServiceMock);
});

export type AlertsServiceMock = DeepMockProxy<AlertsService>;

export const AlertsServiceMock =
  mockDeep<AlertsService>() as unknown as DeepMockProxy<AlertsService>;
