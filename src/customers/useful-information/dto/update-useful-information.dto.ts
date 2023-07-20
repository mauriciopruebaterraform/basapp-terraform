import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { UsefulInformationDto } from './useful-information.dto';

export class UpdateUsefulInformationDto extends PartialType(
  UsefulInformationDto,
) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
