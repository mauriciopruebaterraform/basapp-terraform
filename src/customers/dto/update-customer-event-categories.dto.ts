import {
  IsBoolean,
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCustomerEventCategoriesDto {
  @IsOptional()
  @IsNumber()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsUUID('4')
  @IsString()
  @IsOptional()
  reservationTypeId?: string;
}
