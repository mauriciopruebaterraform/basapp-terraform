import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Geolocation } from '@src/common/dto/geolocation.dto';

class FullAddressDto {
  @IsString()
  @IsNotEmpty()
  formatted_address: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => Geolocation) // neccessary to trigger the nested validation
  geolocation: Geolocation;
}

export class AddressDto {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => FullAddressDto)
  fullAddress: FullAddressDto;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  apartment?: string;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  neighborhoodId?: string;
}
