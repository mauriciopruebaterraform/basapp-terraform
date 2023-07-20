import { EventTypesService } from '../event-types.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(EventTypesServiceMock);
});

export type EventTypesServiceMock = DeepMockProxy<EventTypesService>;

export const EventTypesServiceMock =
  mockDeep<EventTypesService>() as unknown as DeepMockProxy<EventTypesService>;
