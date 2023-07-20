import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { AuthorizedUserDto } from './authorized-user.dto';

export class UpdateAuthorizedUserDto extends PartialType(AuthorizedUserDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
