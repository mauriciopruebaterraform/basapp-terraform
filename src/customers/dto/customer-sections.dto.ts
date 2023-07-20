import { IsBoolean, IsOptional } from 'class-validator';

export class CustomerSectionsDto {
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
  reservations?: boolean;

  @IsBoolean()
  @IsOptional()
  protocols?: boolean;

  @IsBoolean()
  @IsOptional()
  usefulInformation?: boolean;

  @IsBoolean()
  @IsOptional()
  integrations?: boolean;

  @IsBoolean()
  @IsOptional()
  lots?: boolean;

  @IsBoolean()
  @IsOptional()
  cameras?: boolean;

  @IsBoolean()
  @IsOptional()
  locations?: boolean;
}
