import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEmail,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class ReservationModeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  maxDuration?: number;

  @IsUUID('4', { each: true })
  @IsOptional()
  @IsArray()
  reservationSpaces?: string[];

  @IsString()
  @ValidateIf((o) => o.email)
  @IsEmail()
  email?: string;

  @IsNumber()
  @IsOptional()
  maxPeople?: number;

  @IsNumber()
  @IsOptional()
  inactivityTime?: number;

  @IsBoolean()
  @IsOptional()
  allowGuests?: boolean;

  @IsBoolean()
  @IsOptional()
  allParticipantsRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  attachList?: boolean;

  @IsNumber()
  @IsOptional()
  maxPerMonth?: number;

  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  reservationTypeId: string;
}
