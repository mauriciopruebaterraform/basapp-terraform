import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class QrCodeDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsOptional()
  patent?: string;
}
