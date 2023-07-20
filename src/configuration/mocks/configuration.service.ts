import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { ConfigurationService } from '../configuration.service';

beforeEach(() => {
  mockReset(ConfigurationServiceMock);
});

export type ConfigurationServiceMock = DeepMockProxy<ConfigurationService>;

export const ConfigurationServiceMock =
  mockDeep<ConfigurationService>() as unknown as DeepMockProxy<ConfigurationService>;
