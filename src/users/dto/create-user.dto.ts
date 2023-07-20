import { UserPermissionDto } from './user-permission.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { File } from '@src/common/dto/file.dto';
import { AddressDto } from './address.dto';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(Role, { message: 'Invalid role' })
  @IsNotEmpty()
  @ApiProperty({ enum: Role })
  role: Role;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  lot?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // neccessary to trigger the nested validation
  image?: File | null;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => UserPermissionDto)
  permissions?: UserPermissionDto | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  homeAddress?: AddressDto | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  workAddress?: AddressDto | null;
}
