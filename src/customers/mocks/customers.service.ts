import { CustomerService } from '@src/customers/customers.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(CustomerServiceMock);
});

export type CustomerServiceMock = DeepMockProxy<CustomerService>;

export const CustomerServiceMock =
  mockDeep<CustomerService>() as unknown as DeepMockProxy<CustomerService>;
