import {
  IsOptional,
  ValidateNested,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Geolocation } from '@src/common/dto/geolocation.dto';

export class CameraDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  url?: string | null;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => Geolocation) // neccessary to trigger the nested validation
  geolocation: Geolocation;
}
