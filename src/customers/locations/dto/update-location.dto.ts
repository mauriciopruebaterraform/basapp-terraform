import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { LocationDto } from './location.dto';

export class UpdateLocationDto extends PartialType(LocationDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
