import { EventsService } from '../events.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(EventsServiceMock);
});

export type EventsServiceMock = DeepMockProxy<EventsService>;

export const EventsServiceMock =
  mockDeep<EventsService>() as unknown as DeepMockProxy<EventsService>;
