import { PaginatedResult } from '@src/common/entities/paginated-result.entity';
import { Contact } from './contact.entity';

export class ContactList extends PaginatedResult<Contact> {
  results: Contact[];
}
