import { EventStates } from '@src/event-states/entities/event-states.entity';
import { User } from '@src/users/entities/user.entity';

export class ChangeLog {
  user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  state: Pick<EventStates, 'id' | 'name'>;
  observations?: string;
  updatedAt: Date;
}
