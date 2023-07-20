import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Battery } from './battery.dto';
import { Coords } from './coords.dto';

export class GeolocationAlert {
  @ValidateNested()
  @IsOptional()
  @Type(() => Battery)
  battery?: Battery;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  network: string;

  @IsNotEmpty()
  @IsNumber()
  timestamp: number;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => Coords)
  coords: Coords;
}
