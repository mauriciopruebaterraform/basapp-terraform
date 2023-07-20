import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class NotificationTemplateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  image?: File | null;
}
