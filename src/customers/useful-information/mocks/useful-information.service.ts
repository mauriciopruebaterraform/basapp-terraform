import { UsefulInformationService } from '../useful-information.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(UsefulInformationServiceMock);
});

export type UsefulInformationServiceMock =
  DeepMockProxy<UsefulInformationService>;

export const UsefulInformationServiceMock =
  mockDeep<UsefulInformationService>() as unknown as DeepMockProxy<UsefulInformationService>;
