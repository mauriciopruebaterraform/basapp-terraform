import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CameraDto } from './camera.dto';

export class UpdateCameraDto extends PartialType(CameraDto) {
  @IsBoolean()
  @IsOptional()
  active: boolean;
}
