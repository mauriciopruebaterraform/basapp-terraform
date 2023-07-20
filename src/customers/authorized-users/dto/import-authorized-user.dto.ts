import { IsOptional, IsString } from 'class-validator';

export class AuthorizedUserImportDto {
  @IsOptional()
  @IsString()
  reservationTypes?: string;
}
