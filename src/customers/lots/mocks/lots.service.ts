import { LotsService } from '../lots.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(LotsServiceMock);
});

export type LotsServiceMock = DeepMockProxy<LotsService>;

export const LotsServiceMock =
  mockDeep<LotsService>() as unknown as DeepMockProxy<LotsService>;
