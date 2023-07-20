import { NotificationTemplatesService } from '../notification-templates.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(NotificationTemplatesServiceMock);
});

export type NotificationTemplatesServiceMock =
  DeepMockProxy<NotificationTemplatesService>;

export const NotificationTemplatesServiceMock =
  mockDeep<NotificationTemplatesService>() as unknown as DeepMockProxy<NotificationTemplatesService>;
