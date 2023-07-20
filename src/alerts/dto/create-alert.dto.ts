import {
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GeolocationAlert } from './geolocation.dto';

export class AlertDto {
  @IsString()
  @IsNotEmpty()
  alertTypeId: string;

  @IsString()
  @IsOptional()
  approximateAddress?: string;

  @IsBoolean()
  @IsOptional()
  manual?: boolean;

  @IsBoolean()
  @IsOptional()
  dragged?: boolean;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => GeolocationAlert) // neccessary to trigger the nested validation
  geolocation: GeolocationAlert;

  @ValidateNested()
  @IsOptional()
  @Type(() => GeolocationAlert) // neccessary to trigger the nested validation
  originalGeolocation?: GeolocationAlert;

  @ValidateNested()
  @IsOptional()
  @Type(() => GeolocationAlert) // neccessary to trigger the nested validation
  geolocations?: GeolocationAlert[] | null;
}
