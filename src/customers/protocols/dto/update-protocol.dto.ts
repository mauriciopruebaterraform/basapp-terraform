import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { ProtocolDto } from './protocol.dto';

export class UpdateProtocolDto extends PartialType(ProtocolDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
