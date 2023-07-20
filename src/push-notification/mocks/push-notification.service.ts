import { PushNotificationService } from '../push-notification.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(PushNotificationServiceMock);
});

export type PushNotificationServiceMock =
  DeepMockProxy<PushNotificationService>;

export const PushNotificationServiceMock =
  mockDeep<PushNotificationService>() as unknown as DeepMockProxy<PushNotificationService>;
