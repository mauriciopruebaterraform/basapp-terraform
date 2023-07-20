import { Customer, User } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { AuthService } from '../auth.service';

type UserWithCustomer = User & { customer: Customer };

beforeEach(() => {
  mockReset(AuthServiceMock);
  const testUser = mockDeep<UserWithCustomer>({
    id: '123e4567-e89b-12d3-a456-426614174000',
  });

  AuthServiceMock.validateUser.mockImplementation(
    (username: string, password: string) => {
      if (username === 'test' && password === '123456') {
        return Promise.resolve({
          ...testUser,
          username: 'test',
          active: true,
        });
      }
      if (username === 'test_inactive' && password === '123456') {
        return Promise.resolve({
          ...testUser,
          username: 'test_inactive',
          active: false,
        });
      }
      if (username === 'customer' && password === '123456') {
        return Promise.resolve({
          ...testUser,
          username: 'customer',
          active: true,
          customer: {
            ...testUser.customer,
            active: true,
          },
        });
      }
      if (username === 'customer_inactive' && password === '123456') {
        return Promise.resolve({
          ...testUser,
          username: 'customer_inactive',
          active: true,
          customer: {
            ...testUser.customer,
            active: false,
          },
        });
      }
      return Promise.resolve(null);
    },
  );
});

export type AuthServiceMock = DeepMockProxy<AuthService>;

export const AuthServiceMock =
  mockDeep<AuthService>() as unknown as DeepMockProxy<AuthService>;
