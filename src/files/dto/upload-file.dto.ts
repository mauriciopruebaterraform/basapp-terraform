import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  path: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  useThumbnail?: 'true' | 'false';
}
