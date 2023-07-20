import {
  IsNotEmpty,
  ValidateNested,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import { AuthorizedDto } from './authorized.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @IsString()
  @ApiProperty()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @ApiProperty()
  @IsOptional()
  isDelivery?: boolean;

  @IsString()
  @ApiProperty()
  @IsOptional()
  icmDeliveryType?: string;

  @IsNumber()
  @ApiProperty()
  @IsOptional()
  utcOffset?: number;

  @IsUUID('4')
  @IsString()
  @ApiProperty()
  @IsOptional()
  authorizedUserId?: string;

  @IsString()
  @IsUUID('4')
  @ApiProperty()
  @IsOptional()
  statesmanId?: string;

  @IsString()
  @IsUUID('4')
  @ApiProperty()
  @IsOptional()
  monitorId?: string;

  @IsString()
  @IsUUID('4')
  @ApiProperty()
  @IsNotEmpty()
  eventTypeId: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  fullName?: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  dni?: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  patent?: string;

  @IsBoolean()
  @ApiProperty()
  @IsOptional()
  isCopy?: boolean;

  @IsString()
  @ApiProperty()
  @IsOptional()
  lastName?: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  from: Date;

  @IsDateString()
  @ApiProperty()
  @IsNotEmpty()
  to: Date;

  @ValidateNested()
  @IsOptional()
  @ApiProperty()
  @Type(() => File) // neccessary to trigger the nested validation
  file?: File | null;

  @ValidateNested()
  @IsArray()
  @IsOptional()
  @ApiProperty()
  @Type(() => AuthorizedDto)
  authorized?: AuthorizedDto[];
}
