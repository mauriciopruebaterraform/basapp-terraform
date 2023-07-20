import { ReservationModeService } from '../reservation-mode.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ReservationModeServiceMock);
});

export type ReservationModeServiceMock = DeepMockProxy<ReservationModeService>;

export const ReservationModeServiceMock =
  mockDeep<ReservationModeService>() as unknown as DeepMockProxy<ReservationModeService>;
