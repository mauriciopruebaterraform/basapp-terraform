import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class LotDto {
  @IsString()
  @IsNotEmpty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  longitude: string;

  @IsString()
  @IsNotEmpty()
  lot: string;

  @IsBoolean()
  @IsOptional()
  isArea?: boolean;
}
