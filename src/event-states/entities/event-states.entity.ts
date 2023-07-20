import { EventState as EventStatesPrisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class EventStates implements EventStatesPrisma {
  id: string;
  name: string;
  active: boolean;
  @ApiProperty()
  customerId: string | null;

  constructor(partial?: Partial<EventStates>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
