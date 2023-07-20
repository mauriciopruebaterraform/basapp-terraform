import { ReservationSpaceService } from '../reservation-space.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ReservationSpaceServiceMock);
});

export type ReservationSpaceServiceMock =
  DeepMockProxy<ReservationSpaceService>;

export const ReservationSpaceServiceMock =
  mockDeep<ReservationSpaceService>() as unknown as DeepMockProxy<ReservationSpaceService>;
