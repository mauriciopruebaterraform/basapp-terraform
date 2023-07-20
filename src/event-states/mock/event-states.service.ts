import { EventStatesService } from '@src/event-states/event-states.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(EventStatesServiceMock);
});

export type EventStatesServiceMock = DeepMockProxy<EventStatesService>;

export const EventStatesServiceMock =
  mockDeep<EventStatesService>() as unknown as DeepMockProxy<EventStatesService>;
