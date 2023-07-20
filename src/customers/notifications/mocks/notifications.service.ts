import { NotificationsService } from '../notifications.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(NotificationsServiceMock);
});

export type NotificationsServiceMock = DeepMockProxy<NotificationsService>;

export const NotificationsServiceMock =
  mockDeep<NotificationsService>() as unknown as DeepMockProxy<NotificationsService>;
