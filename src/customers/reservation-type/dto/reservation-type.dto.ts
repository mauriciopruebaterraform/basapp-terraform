import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class ReservationTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  display: string;

  @IsString()
  @IsNotEmpty()
  groupCode: string;

  @IsNumber()
  @IsOptional()
  days?: number;

  @IsNumber()
  @IsOptional()
  minDaysBetweenReservation?: number;

  @IsNumber()
  @IsOptional()
  maxPerMonth?: number;

  @IsNumber()
  @IsOptional()
  minDays?: number;

  @IsNumber()
  @IsOptional()
  numberOfPending?: number;

  @IsBoolean()
  @IsOptional()
  termsAndConditions?: boolean;

  @IsBoolean()
  @IsOptional()
  pendingPerLot?: boolean;

  @IsBoolean()
  @IsOptional()
  allowsSimultaneous?: boolean;

  @IsBoolean()
  @IsOptional()
  requireConfirmation?: boolean;

  @IsNumber()
  @IsOptional()
  daysSecondTime?: number;
}
