import { HolidaysService } from '../holidays.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(HolidaysServiceMock);
});

export type HolidaysServiceMock = DeepMockProxy<HolidaysService>;

export const HolidaysServiceMock =
  mockDeep<HolidaysService>() as unknown as DeepMockProxy<HolidaysService>;
