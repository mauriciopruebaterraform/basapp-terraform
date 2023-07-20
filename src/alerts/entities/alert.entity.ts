import { ApiProperty } from '@nestjs/swagger';
import { Alert as AlertPrisma, Prisma } from '@prisma/client';
import { GeolocationAlert } from '../dto/geolocation.dto';
import { AlertType } from '@src/alert-types/entities/alert-type.entity';
import { AlertState } from '@src/alert-states/entities/alert-states.entity';
import { User } from '@src/users/entities/user.entity';

export class Alert implements AlertPrisma {
  neighborhoodAlarmId: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  neighborhoodId: string | null;
  attachment: Prisma.JsonValue;
  originalGeolocation: Prisma.JsonValue;
  manual: boolean;
  dragged: boolean | null;
  code: string | null;
  id: string;
  alertTypeId: string;
  @ApiProperty({ type: AlertType, required: false })
  alertType: AlertType;
  @ApiProperty({ type: GeolocationAlert, required: false })
  geolocation: Prisma.JsonValue;
  approximateAddress: string | null;
  alertStateId: string;
  @ApiProperty({ type: AlertState, required: false })
  alertState: AlertState;
  userId: string;
  @ApiProperty({ type: User, required: false })
  user: Omit<User, 'password'>;
  alertStateUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  @ApiProperty({ type: [GeolocationAlert], required: false })
  geolocations: Prisma.JsonValue;
  observations: string | null;
  parentId: string | null;
  trialPeriod: boolean;
}
