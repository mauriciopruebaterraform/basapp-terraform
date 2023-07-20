import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceContactDto } from './device-contact.dto';

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @Type(() => DeviceContactDto)
  deviceContact: DeviceContactDto;
}
