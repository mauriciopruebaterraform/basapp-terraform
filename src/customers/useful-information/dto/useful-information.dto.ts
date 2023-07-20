import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsUUID,
} from 'class-validator';

export class UsefulInformationDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  link?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  attachment?: File | null;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID('4')
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isCategory?: boolean;
}
