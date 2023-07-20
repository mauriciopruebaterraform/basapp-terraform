import { CamerasService } from '../cameras.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(CamerasServiceMock);
});

export type CamerasServiceMock = DeepMockProxy<CamerasService>;

export const CamerasServiceMock =
  mockDeep<CamerasService>() as unknown as DeepMockProxy<CamerasService>;
