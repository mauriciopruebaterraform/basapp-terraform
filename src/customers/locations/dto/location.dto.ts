import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { LocationType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LocationType, { message: 'Invalid location type' })
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: LocationType })
  type: LocationType;
}
