import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ProtocolDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  attachment?: File | null;
}
