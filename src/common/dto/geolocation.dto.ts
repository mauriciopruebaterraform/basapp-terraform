import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Geolocation {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  lat: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  lng: string;
}
