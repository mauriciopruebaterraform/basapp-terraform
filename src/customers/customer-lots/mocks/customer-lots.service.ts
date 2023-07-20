import { CustomerLotsService } from '../customer-lots.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(CustomerLotsServiceMock);
});

export type CustomerLotsServiceMock = DeepMockProxy<CustomerLotsService>;

export const CustomerLotsServiceMock =
  mockDeep<CustomerLotsService>() as unknown as DeepMockProxy<CustomerLotsService>;
