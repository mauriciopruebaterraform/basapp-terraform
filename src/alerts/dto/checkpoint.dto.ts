import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GeolocationAlert } from './geolocation.dto';

export class CheckpointDto {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => GeolocationAlert) // neccessary to trigger the nested validation
  geolocation: GeolocationAlert;
}
