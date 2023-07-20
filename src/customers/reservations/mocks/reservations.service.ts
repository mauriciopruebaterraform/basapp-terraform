import { ReservationService } from '../reservations.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ReservationServiceMock);
});

export type ReservationServiceMock = DeepMockProxy<ReservationService>;

export const ReservationServiceMock =
  mockDeep<ReservationService>() as unknown as DeepMockProxy<ReservationService>;
