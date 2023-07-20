import { ExternalServiceService } from '../external-service.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ExternalServiceServiceMock);
});

export type ExternalServiceServiceMock = DeepMockProxy<ExternalServiceService>;

export const ExternalServiceServiceMock =
  mockDeep<ExternalServiceService>() as unknown as DeepMockProxy<ExternalServiceService>;
