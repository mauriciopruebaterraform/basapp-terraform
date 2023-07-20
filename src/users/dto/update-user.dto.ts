import { CreateUserDto } from './create-user.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  updatedById?: string;

  @IsString()
  @IsOptional()
  idCard?: string | null;

  @IsString()
  @IsOptional()
  pushId?: string | null;

  @IsString()
  @IsOptional()
  emergencyNumber?: string | null;

  @IsString()
  @IsOptional()
  alarmNumber?: string | null;

  @IsString()
  @IsOptional()
  status?: string | null;

  @IsDateString()
  @IsOptional()
  lastStateUpdatedTime?: Date | null;

  @IsDateString()
  @IsOptional()
  lastAccessToMenu?: Date | null;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  stateUpdatedUserId?: string | null;

  @IsString()
  @IsOptional()
  comment?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  homeAddress?: AddressDto | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  workAddress?: AddressDto | null;

  @IsString()
  @IsOptional()
  secretKey?: string | null;
}
