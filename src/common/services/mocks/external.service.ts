import { ExternalService } from '../external.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ExternalServiceMock);

  ExternalServiceMock.reverseGeocoding.mockImplementation(() => {
    return Promise.resolve(null);
  });
});

export type ExternalServiceMock = DeepMockProxy<ExternalService>;

export const ExternalServiceMock =
  mockDeep<ExternalService>() as unknown as DeepMockProxy<ExternalService>;
