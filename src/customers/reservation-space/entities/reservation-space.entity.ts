import { ApiProperty } from '@nestjs/swagger';
import {
  Prisma,
  ReservationSpace as ReservationSpacePrisma,
} from '@prisma/client';
import { Schedule } from './schedule.entity';

export class ReservationSpace implements ReservationSpacePrisma {
  interval: number | null;
  id: string;
  code: string;
  @ApiProperty({ type: Schedule, required: true })
  schedule: Prisma.JsonValue;
  notifyParticipants: boolean;
  active: boolean;
  additionalNumbers: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  eventTypeId: string;
  reservationTypeId: string;
}
