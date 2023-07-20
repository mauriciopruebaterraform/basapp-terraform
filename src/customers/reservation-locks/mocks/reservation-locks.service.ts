import { ReservationLocksService } from '../reservation-locks.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ReservationLocksServiceMock);
});

export type ReservationLocksServiceMock =
  DeepMockProxy<ReservationLocksService>;

export const ReservationLocksServiceMock =
  mockDeep<ReservationLocksService>() as unknown as DeepMockProxy<ReservationLocksService>;
