import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { LotDto } from './lot.dto';

export class UpdateLotDto extends PartialType(LotDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
