import { Type } from 'class-transformer';
import { File } from '@src/common/dto/file.dto';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class CreateEventCategoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // neccessary to trigger the nested validation
  image: File | null;
}
