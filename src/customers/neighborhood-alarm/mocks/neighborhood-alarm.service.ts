import { NeighborhoodService } from '../neighborhood-alarm.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(NeighborhoodServiceMock);
});

export type NeighborhoodServiceMock = DeepMockProxy<NeighborhoodService>;

export const NeighborhoodServiceMock =
  mockDeep<NeighborhoodService>() as unknown as DeepMockProxy<NeighborhoodService>;
