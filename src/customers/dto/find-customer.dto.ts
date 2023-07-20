import { CustomerType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class FindCustomerDto {
  @ValidateIf((o) => !o.secretKey && o.state && o.country)
  @IsString()
  @IsNotEmpty()
  district?: string;

  @IsString()
  @ValidateIf((o) => !o.secretKey && o.country && o.district)
  @IsNotEmpty()
  state?: string;

  @IsString()
  @ValidateIf((o) => !o.secretKey && o.state && o.district)
  @IsNotEmpty()
  country?: string;

  @IsString()
  @ValidateIf((o) => !o.state && !o.country && !o.district)
  @IsNotEmpty()
  secretKey?: string;

  @IsEnum(CustomerType, { message: 'Invalid customer type' })
  @IsOptional()
  type?: CustomerType;
}
