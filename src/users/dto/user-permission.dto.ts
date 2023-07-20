import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
export class UserPermissionDto {
  @IsBoolean()
  @IsOptional()
  alerts?: boolean;

  @IsBoolean()
  @IsOptional()
  events?: boolean;

  @IsBoolean()
  @IsOptional()
  notifications?: boolean;

  @IsBoolean()
  @IsOptional()
  users?: boolean;

  @IsBoolean()
  @IsOptional()
  configurations?: boolean;

  @IsBoolean()
  @IsOptional()
  authorizedUsers?: boolean;

  @IsBoolean()
  @IsOptional()
  cameras?: boolean;

  @IsBoolean()
  @IsOptional()
  alertStates?: boolean;

  @IsBoolean()
  @IsOptional()
  eventTypes?: boolean;

  @IsBoolean()
  @IsOptional()
  eventStates?: boolean;

  @IsBoolean()
  @IsOptional()
  eventKey?: boolean;

  @IsBoolean()
  @IsOptional()
  usefulInformation?: boolean;

  @IsBoolean()
  @IsOptional()
  protocols?: boolean;

  @IsBoolean()
  @IsOptional()
  statesmanEvents?: boolean;

  @IsBoolean()
  @IsOptional()
  reservations?: boolean;

  @IsBoolean()
  @IsOptional()
  lots?: boolean;

  @IsBoolean()
  @IsOptional()
  locations?: boolean;

  @IsBoolean()
  @IsOptional()
  integrations?: boolean;

  @IsBoolean()
  @IsOptional()
  receiveEvents?: boolean;

  @IsBoolean()
  @IsOptional()
  createEvents?: boolean;

  @IsBoolean()
  @IsOptional()
  createReservations?: boolean;

  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;

  @IsBoolean()
  @IsOptional()
  panicButton?: boolean;

  @IsBoolean()
  @IsOptional()
  enableTraccar?: boolean;

  @IsBoolean()
  @IsOptional()
  enableCybermapa?: boolean;

  @IsBoolean()
  @IsOptional()
  visitorsQueue?: boolean;

  @IsBoolean()
  @IsOptional()
  requestAuthorization?: boolean;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  visitorsEventTypeId?: string | null;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  authorizationEventTypeId?: string | null;

  @IsUUID('4', { each: true })
  @IsOptional()
  @IsArray()
  monitoringAlertTypes?: string[];

  @IsUUID('4', { each: true })
  @IsOptional()
  @IsArray()
  monitoringEventTypes?: string[];

  @IsUUID('4', { each: true })
  @IsOptional()
  @IsArray()
  monitoringCustomers?: string[];
}
