import { ReservationTypeService } from '../reservation-type.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ReservationTypeServiceMock);
});

export type ReservationTypeServiceMock = DeepMockProxy<ReservationTypeService>;

export const ReservationTypeServiceMock =
  mockDeep<ReservationTypeService>() as unknown as DeepMockProxy<ReservationTypeService>;
