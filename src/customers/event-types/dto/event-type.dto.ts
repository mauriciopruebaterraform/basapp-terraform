import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class EventTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  lotFrom?: string | null;

  @IsString()
  @IsOptional()
  lotTo?: string | null;

  @IsString()
  @IsOptional()
  additionalNotifications?: string | null;

  @IsString()
  @IsOptional()
  icmDeliveryType?: string | null;

  @IsInt()
  @IsOptional()
  qrFormat?: number | null;

  @IsBoolean()
  @IsOptional()
  description?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  attachment?: boolean;

  @IsBoolean()
  @IsOptional()
  monitor?: boolean;

  @IsBoolean()
  @IsOptional()
  addToStatistics?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;

  @IsBoolean()
  @IsOptional()
  notifySecurityChief?: boolean;

  @IsBoolean()
  @IsOptional()
  isDelivery?: boolean;

  @IsBoolean()
  @IsOptional()
  notifySecurityGuard?: boolean;

  @IsBoolean()
  @IsOptional()
  autoCancelAfterExpired?: boolean;

  @IsBoolean()
  @IsOptional()
  allowsMultipleAuthorized?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresDni?: boolean;

  @IsBoolean()
  @IsOptional()
  isPermanent?: boolean;

  @IsBoolean()
  @IsOptional()
  emergency?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresPatent?: boolean;

  @IsBoolean()
  @IsOptional()
  generateQr?: boolean;

  @IsBoolean()
  @IsOptional()
  reservation?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyGiroVision?: boolean;

  @IsInt()
  @IsOptional()
  gvEntryTypeId?: number | null;

  @IsInt()
  @IsOptional()
  gvGuestTypeId?: number | null;

  @IsUUID()
  @IsString()
  @IsOptional()
  eventCategoryId?: string | null;
}
