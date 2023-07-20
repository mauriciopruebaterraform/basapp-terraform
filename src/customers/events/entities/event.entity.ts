import { File } from '@src/common/dto/file.dto';
import { Event as EventPrisma, Prisma, Customer } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { ChangeLog } from './change-log.entity';
import { EventType } from '@src/customers/event-types/entities/event-type.entity';
import { EventStates } from '@src/event-states/entities/event-states.entity';
import { User } from '@src/users/entities/user.entity';

export class Event implements EventPrisma {
  isDelivery: boolean;
  customerId: string;
  token: string | null;
  dni: string | null;
  from: Date;
  to: Date;
  reservationId: string | null;
  id: string;
  fullName: string | null;
  description: string | null;
  observations: string | null;
  lot: string | null;
  @ApiProperty({ type: ChangeLog, required: false })
  changeLog: string;
  eventStateId: string | null;
  @ApiProperty({ type: EventStates, required: false })
  eventState: EventStates | null;
  eventTypeId: string | null;
  @ApiProperty({ type: EventType, required: false })
  eventType: EventType | null;
  userId: string | null;
  @ApiProperty({ type: User, required: false })
  user: User | null;
  customer: Customer;
  createdAt: Date;
  updatedAt: Date;
  @ApiProperty({ type: File, required: false })
  file: Prisma.JsonValue;
  isPermanent: boolean;
  isCopy: boolean;
  statesmanId: string | null;
  authorizedUserId: string | null;
  monitorId: string | null;
  firstName: string | null;
  lastName: string | null;
  patent: string | null;
  qrCode: string | null;
  qrPending: boolean;
  trialPeriod: boolean;
  externalId: string | null;
}
