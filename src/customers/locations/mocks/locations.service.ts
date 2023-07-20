import { LocationsService } from '../locations.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(LocationsServiceMock);
});

export type LocationsServiceMock = DeepMockProxy<LocationsService>;

export const LocationsServiceMock =
  mockDeep<LocationsService>() as unknown as DeepMockProxy<LocationsService>;
