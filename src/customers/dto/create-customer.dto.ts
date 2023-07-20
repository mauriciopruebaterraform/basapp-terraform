import { CustomerIntegrationsDto } from './customer-integrations.dto';
import { CustomerType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsUUID,
  IsNumberString,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { CustomerSectionsDto } from './customer-sections.dto';

export class CreateCustomerDto {
  @IsEnum(CustomerType, { message: 'Invalid customer type' })
  @IsNotEmpty()
  @ApiProperty({ enum: CustomerType })
  type: CustomerType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsUUID('4', { each: true })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  alertTypes: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  eventCategories?: string[] | undefined;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  secretKey?: string | null;

  @IsBoolean()
  @IsOptional()
  trialPeriod?: boolean | null;

  @IsBoolean()
  @IsOptional()
  verifyBySms?: boolean;

  @IsString()
  @IsOptional()
  countryCode?: string | null;

  @IsInt()
  @IsOptional()
  phoneLength?: number | null;

  @IsString()
  @IsOptional()
  url?: string | null;

  @IsNumberString()
  @IsOptional()
  @MaxLength(3)
  speed?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  notes?: string | null;

  @IsString()
  @IsOptional()
  timezone?: string | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  image?: File | null;

  @IsUUID('4')
  @IsOptional()
  parent?: string | null;

  @IsBoolean()
  @IsOptional()
  isClient?: boolean;

  @ValidateNested()
  @IsOptional()
  @Type(() => CustomerIntegrationsDto)
  integrations?: CustomerIntegrationsDto | null;

  @ValidateNested()
  @IsOptional()
  @Type(() => CustomerSectionsDto)
  sections?: CustomerSectionsDto | null;
}
