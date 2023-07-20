import { Customer, Prisma, User } from '@prisma/client';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '@src/users/users.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { errorCodes } from '../users.constants';

type UserWithCustomer = Prisma.Prisma__UserClient<
  User & {
    customer: Customer | null;
  }
>;

beforeEach(() => {
  mockReset(UsersServiceMock);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  UsersServiceMock.findByUsername.mockImplementation((username: string) => {
    if (username === 'test') {
      const testUser = mockDeep<UserWithCustomer>();
      return Promise.resolve({
        ...testUser,
        id: '1',
        username: 'test',
        password:
          '$2a$10$AjPLP0yLHpOJ4VsSJ3LVP.Gq.NpYc/2ixpymo873wcRG7rAzPe8IO',
      });
    }
    if (username === 'notfound') {
      return Promise.resolve(null);
    }
    const nullUser = mockDeep<UserWithCustomer>(undefined);
    return Promise.resolve(nullUser);
  });

  UsersServiceMock.requestPasswordReset.mockImplementation(
    (username: string) => {
      if (username === 'notfound@mail.com') {
        throw new ForbiddenException();
      }

      if (username !== 'valid@mail.com') {
        throw new InternalServerErrorException(errorCodes.MAIL_DELIVERY_FAILED);
      }

      return Promise.resolve(true);
    },
  );

  UsersServiceMock.resetPasswordWithToken.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (token: string, password: string) => {
      if (token === 'invalid_token') {
        throw new ForbiddenException({
          statusCode: 403,
          message: errorCodes.INVALID_TOKEN,
        });
      }
      if (token === 'expired_token') {
        throw new ForbiddenException({
          statusCode: 403,
          message: errorCodes.EXPIRED_TOKEN,
        });
      }
      if (token === 'invalid_user') {
        throw new ForbiddenException({
          statusCode: 403,
          message: errorCodes.INVALID_USER,
        });
      }
      return Promise.resolve(true);
    },
  );
});

export type UsersServiceMock = DeepMockProxy<UsersService>;

export const UsersServiceMock =
  mockDeep<UsersService>() as unknown as DeepMockProxy<UsersService>;
