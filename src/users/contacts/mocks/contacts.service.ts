import { ContactsService } from '../contacts.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(ContactsServiceMock);
});

export type ContactsServiceMock = DeepMockProxy<ContactsService>;

export const ContactsServiceMock =
  mockDeep<ContactsService>() as unknown as DeepMockProxy<ContactsService>;
