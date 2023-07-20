import { AuthorizedUsersService } from '../authorized-users.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(AuthorizedUsersServiceMock);
});

export type AuthorizedUsersServiceMock = DeepMockProxy<AuthorizedUsersService>;

export const AuthorizedUsersServiceMock =
  mockDeep<AuthorizedUsersService>() as unknown as DeepMockProxy<AuthorizedUsersService>;
