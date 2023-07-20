import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  alertTypes: string[];
}
