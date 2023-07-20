import { IsString, IsOptional } from 'class-validator';

export class AuthorizedDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  dni?: string;
}
