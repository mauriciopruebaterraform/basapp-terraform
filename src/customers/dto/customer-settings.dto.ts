import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PanicKey } from './panic-key.dto';

export class CustomerSettingsDto {
  @IsNumber()
  @IsOptional()
  minAccuracy?: number | null;

  @IsNumber()
  @IsOptional()
  maxAccuracy?: number | null;

  @IsString()
  @IsOptional()
  perimeterViolationNumbers?: string | null;

  @IsString()
  @IsOptional()
  alarmActivatedNumbers?: string | null;

  @IsString()
  @IsOptional()
  badCompanyNumbers?: string | null;

  @IsString()
  @IsOptional()
  panicNumbers?: string | null;

  @IsString()
  @IsOptional()
  publicViolenceNumbers?: string | null;

  @IsString()
  @IsOptional()
  kidnappingNumbers?: string | null;

  @IsString()
  @IsOptional()
  fireNumbers?: string | null;

  @IsString()
  @IsOptional()
  healthEmergencyNumbers?: string | null;

  @IsString()
  @IsOptional()
  genderViolenceNumbers?: string | null;

  @IsString()
  @IsOptional()
  robberyNumbers?: string | null;

  @IsString()
  @IsOptional()
  fire?: string | null;

  @IsString()
  @IsOptional()
  healthEmergency?: string | null;

  @IsString()
  @IsOptional()
  robbery?: string | null;

  @IsString()
  @IsOptional()
  publicViolence?: string | null;

  @IsString()
  @IsOptional()
  securityGuard?: string | null;

  @IsString()
  @IsOptional()
  securityChief?: string | null;

  @IsString()
  @IsOptional()
  additionalNotifications?: string | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => PanicKey) // necessary to trigger the nested validation
  panicKey?: PanicKey;

  @IsString()
  @IsOptional()
  panicNotifications?: string | null;

  @IsEmail()
  @ValidateIf((o) => o.reservationEmail)
  @IsOptional()
  reservationEmail?: string | null;

  @IsBoolean()
  @IsOptional()
  receiveAlertsFromOutside?: boolean;

  @IsString()
  @IsOptional()
  daysToShow?: string | null;

  @IsString()
  @IsOptional()
  doubleConfirmMessage?: string | null;

  @IsBoolean()
  @IsOptional()
  validateUsers?: boolean;

  @IsBoolean()
  @IsOptional()
  doubleConfirmRequired?: boolean;
}
