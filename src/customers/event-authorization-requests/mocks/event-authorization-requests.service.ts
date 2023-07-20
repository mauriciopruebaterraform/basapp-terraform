import { EventAuthorizationRequestService } from '../event-authorization-requests.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(EventAuthorizationRequestServiceMock);
});

export type EventAuthorizationRequestServiceMock =
  DeepMockProxy<EventAuthorizationRequestService>;

export const EventAuthorizationRequestServiceMock =
  mockDeep<EventAuthorizationRequestService>() as unknown as DeepMockProxy<EventAuthorizationRequestService>;
