import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class AuthorizedUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string | null;

  @IsString()
  @IsOptional()
  additionalLots?: string | null;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  lot?: string | null;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsBoolean()
  @IsOptional()
  sendEvents?: boolean | null;

  @IsString()
  @IsDateString()
  @IsOptional()
  expireDate?: string | null;

  @IsBoolean()
  @IsOptional()
  isOwner?: boolean | null;

  @IsUUID('4', { each: true })
  @IsOptional()
  @IsArray()
  reservationTypes?: string[] | null;
}
