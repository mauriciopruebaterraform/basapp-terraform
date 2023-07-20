import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class Coords {
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  altitudeAccuracy?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  heading?: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  speed?: number;
}
