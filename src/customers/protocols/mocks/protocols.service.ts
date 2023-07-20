import { ProtocolsService } from '../protocols.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ProtocolsServiceMock);
});

export type ProtocolsServiceMock = DeepMockProxy<ProtocolsService>;

export const ProtocolsServiceMock =
  mockDeep<ProtocolsService>() as unknown as DeepMockProxy<ProtocolsService>;
