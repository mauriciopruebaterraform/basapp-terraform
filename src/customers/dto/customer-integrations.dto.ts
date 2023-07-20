import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CustomerIntegrationsDto {
  @IsString()
  @IsOptional()
  traccarUsername?: string | null;

  @IsString()
  @IsOptional()
  traccarPassword?: string | null;

  @IsString()
  @IsOptional()
  traccarUrl?: string | null;

  @IsString()
  @IsOptional()
  icmUrl?: string | null;

  @IsString()
  @IsOptional()
  icmToken?: string | null;

  @IsString()
  @IsOptional()
  giroVisionId?: string | null;

  @IsBoolean()
  @IsOptional()
  neighborhoodAlarm?: boolean | null;

  @IsString()
  @IsOptional()
  neighborhoodAlarmLink?: string | null;

  @IsString()
  @IsOptional()
  neighborhoodAlarmKey?: string | null;

  @IsString()
  @IsOptional()
  cybermapaUsername?: string | null;

  @IsString()
  @IsOptional()
  cybermapaPassword?: string | null;

  @IsString()
  @IsOptional()
  cybermapaUrl?: string | null;
}
