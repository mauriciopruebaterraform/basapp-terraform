import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { EventCategoryService } from '@src/event-category/event-category.service';

beforeEach(() => {
  mockReset(EventCategoryServiceMock);
});

export type EventCategoryServiceMock = DeepMockProxy<EventCategoryService>;

export const EventCategoryServiceMock =
  mockDeep<EventCategoryService>() as unknown as DeepMockProxy<EventCategoryService>;
