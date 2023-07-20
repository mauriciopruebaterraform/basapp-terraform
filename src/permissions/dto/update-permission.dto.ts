import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
  @IsBoolean()
  @IsOptional()
  statesman: boolean;

  @IsBoolean()
  @IsOptional()
  monitoring: boolean;
}
