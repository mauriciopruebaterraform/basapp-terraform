import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAlertStateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
